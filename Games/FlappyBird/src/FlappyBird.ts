/// <reference path="../../ts/rx/rx.all.d.ts" />
/// <reference path="../../ts/rx-jquery/rx.jquery.d.ts" />
/// <reference path="../../ts/rx.flatscan.ts" />
/// <reference path="../../ts/math.ts" />
/// <reference path="../../ts/rx.requestanimationframescheduler.ts" />

module Flappy {

	var colors = ["#629E60", "#E9C03A", "#B74133", "#5374ED"];
	var rounds = 2;
	var flapSpeed = 300;
	var gravity = 500;
	var roll = Math.PI/100;
	var speed = 100;

	interface Stage {
		draw(ctx: CanvasRenderingContext2D): void;
		run(game: Game): Rx.Observable<Stage>;
	}

	interface Sprite {
		draw(ctx: CanvasRenderingContext2D);
        lines(): math.Line2D[];
	}

	class Flappy implements Sprite {
		constructor(public y: number, public rotation: number, public velocity: number) {
			if(y <= 0)
				throw new Error("Flappy died :(");
		}
		flap(){
			return new Flappy(this.y, this.rotation, flapSpeed);
		}
		delta(deltaT: number){
			console.log("Flapping", deltaT);
			return new Flappy(
				this.y + this.velocity * deltaT, 
				Math.max(-Math.PI/4, Math.min(Math.PI/4, this.rotation + this.velocity * roll * deltaT)), //this.rotation + Math['sign'].call(Math, this.velocity) * roll * deltaT
				this.velocity - gravity * deltaT
			)
		}
		box(){
            return new math.Box(new math.Point2D(60, this.y), 30, 30).rotate(this.rotation);
		}
		draw(ctx: CanvasRenderingContext2D){
			this.box().draw(ctx);
		}
		static initial(){
			return new Flappy(200, 0, 0);
        }
        lines() { return this.box().lines(); }
	}

	interface Obstacle extends Sprite {
		boost(): number;
		delta(deltaT: number): Obstacle;
	}

	class StaticObstacle implements Obstacle {
		public x = 400;
		constructor(public height: number){}
		boost() { return 0; }
		delta(deltaT: number) {
			this.x -= speed * deltaT;
			return this;
        }
        box() {
            return new math.Box(new math.Point2D(this.x, this.height / 2), 60, this.height);
        }
		draw(ctx: CanvasRenderingContext2D){
            this.box().draw(ctx);
		}
        lines() { return this.box().lines(); }
	}

	class EWI implements Obstacle {
		public x = 400;
        h: number = 0;
		constructor(canvas_height: number){
            this.h = canvas_height;
		}
		boost() { return 100; }
		delta(deltaT: number) {
			this.x -= speed * deltaT;
			return this;
		}
		box() {
            return new math.Box(new math.Point2D(this.x, 200), 60, this.h - 400);
		}
		draw(ctx: CanvasRenderingContext2D){
			this.box().draw(ctx);
        }
        lines() { return this.box().lines(); }
	}

	class NormalStage implements Stage {
		time = 0;

		constructor(public points: number, public flappy: Flappy, public obstacles: Obstacle[]){
			if(this.obstacles.length == 0){
				this.obstacles.push(new StaticObstacle(100));
				this.obstacles.push(new StaticObstacle(200).delta(-3));
				this.obstacles.push(new StaticObstacle(250).delta(-6));
				this.obstacles.push(new StaticObstacle(300).delta(-9));
			}

			// TODO check for collisions somewhere. For example here
			// throw new Error("Flappy collided :-(");
		}

		draw(ctx: CanvasRenderingContext2D) {
			ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
			this.flappy.draw(ctx);
			this.obstacles.forEach(o => o.draw(ctx));

			ctx.font = "18px Arial";
			ctx.fillText(""+this.points, 25, 30);
		}

        static anyIntersection(a: math.Line2D[], b: math.Line2D[]){
            return a.reduce((p, al) => p || b.reduce((h, bl) => {
                if (h)
                    return h;
                var i = bl.intersects(al);
                return i && i.length && i;
            }, false), false);
        }

		delta(deltaT: number, flap: boolean){
			var f = this.flappy.delta(deltaT);
			if(flap)
				f = f.flap();

            var fl = this.flappy.lines();
            var collision = this.obstacles.reduce((p, o) => p || NormalStage.anyIntersection(o.lines(), fl), false);
            if (collision){
                console.log("Collision!", collision);
                throw new Error("Dead by collision!");
            }

			return new NormalStage(this.points, f, this.obstacles.map(o => o.delta(deltaT)));
		}

		run(game: Game) {
			var duration = 1000;//ms
			var t = Rx.Observable.interval(duration/30, Rx.Scheduler.requestAnimationFrame);
			var events = Rx.Observable.merge(
					t.map(_ => { return { t: new Date().getTime(), key: false }; }),
					game.ups.map(k => { return { t: k, key: true }; })
				)
				.scan(
					{ date: new Date().getTime(), dt: 0, event: null }, 
					(prev, e) => { return { dt: (e.t - prev.date) / 1000, date: e.t, event: e }; }
				).skip(1);

			return events.scan(this, (g, _) => g.delta(_.dt, _.event.key)).catch(Rx.Observable.just(new Start()))
		}
	}

	class Start extends NormalStage {
		constructor(){ super(0, Flappy.initial(), []); }
		draw(ctx: CanvasRenderingContext2D) {
			super.draw(ctx);

			var txt = "click to start or press F";
			ctx.font = "18px Arial";
			ctx.fillText(txt, ctx.canvas.width/2 - ctx.measureText(txt).width/2, ctx.canvas.height/2 + 100);
		}
		run(game: Game){
			return Rx.Observable.merge(
				$(game.ctx.canvas).onAsObservable("click").map(_ => 1),
				$(window).onAsObservable("keyup").filter(e => e['keyCode'] == "F".charCodeAt(0)).map(_ => 1)
			).take(1).map(_ => new NormalStage(0, Flappy.initial(), []));
		}
	}

	class ScoreStage implements Stage {
		constructor(public points: number){}
		draw(ctx: CanvasRenderingContext2D) {
			ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
			var txt = "You scored "+this.points+" points!";
			ctx.font = "24px Arial";
			ctx.fillText(txt, ctx.canvas.width/2 - ctx.measureText(txt).width/2, ctx.canvas.height/2);
		
			txt = "Click to restart";
			ctx.font = "18px Arial";
			ctx.fillText(txt, ctx.canvas.width/2 - ctx.measureText(txt).width/2, ctx.canvas.height/2 + 100);
		}
		run(game: Game) {
			return game.up.take(1).map(_ => new Start());
		}
	}


	export class Game {
		public level: number = 0;

		constructor(public ctx: CanvasRenderingContext2D) {
			Rx.Observable
			.just(new Start())
			.flatScan<Stage,Stage>(
				s => { s.draw(this.ctx); return s.run(this).doAction(_ => _.draw(this.ctx)).last() }, 
				s => Rx.Observable.just(s)
			)
			.subscribe(
				s => s.draw(this.ctx),
				e => console.error(e), 
				() => console.log("Completed game")
			);
		}

		// Mouse events
		public ups = $(window).onAsObservable("keyup").filter(e => (e['keyCode'] == 38)).map(_ => new Date().getTime());
		public down = $(this.ctx.canvas).onAsObservable("mousedown");
		public up = $(window).onAsObservable("mouseup");
	}
}

Rx.config['longStackSupport'] = true;
Rx.Observable.just($("#flappy").get(0)).take(1).subscribe(c => {
	var ctx: CanvasRenderingContext2D = (<HTMLCanvasElement>c).getContext("2d");
	var game = new Flappy.Game(ctx);
});