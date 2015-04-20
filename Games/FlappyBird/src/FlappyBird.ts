/// <reference path="../../ts/rx/rx.all.d.ts" />
/// <reference path="../../ts/rx-jquery/rx.jquery.d.ts" />
/// <reference path="../../ts/rx.flatscan.ts" />
/// <reference path="../../ts/math.ts" />
/// <reference path="../../ts/rx.requestanimationframescheduler.ts" />

module Flappy {

	var colors = ["#629E60", "#E9C03A", "#B74133", "#5374ED"];
	var graphics = {
		trees: ["FlappyBird/tree.png", "FlappyBird/Junglewood_Tree.png"],
		flappy: "FlappyBird/sprites.png"
	};
	var images = {};
	var rounds = 2;
	var flapSpeed = 300;
	var gravity = 500;
	var roll = Math.PI/100;
	var speed = 100;
	var debug = true;

	interface Stage {
		draw(ctx: CanvasRenderingContext2D): void;
		run(game: Game): Rx.Observable<Stage>;
	}

	interface Sprite {
		draw(ctx: CanvasRenderingContext2D);
		lines(): math.Line2D[];
	}

	class Img {
		observable = new Rx.Subject<Img>();
		img = null;
		constructor(public src: string){
			this.img = new Image();
			Rx.Observable.fromEvent(this.img, "load").select(_ => this).multicast(this.observable).connect();
			this.observable.subscribe(i => console.log("LOADED! " + src));
			this.img.src = src;
		}
	}

	class SheetSprite implements Sprite {
		f:number = 0;
		constructor(
			public sheet: HTMLImageElement, 
			public sheet_offset: math.Point2D, 
			public frame_width: number, 
			public frame_height: number, 
			public frame_count: number = 1
		){}
		draw(ctx: CanvasRenderingContext2D) {
			this.drawT(ctx, ~~(new Date().getTime() / 30));
		}
		drawT(ctx: CanvasRenderingContext2D, frame_number: number) {
			// For more info to sprite drawing:
			// @see: http://www.williammalone.com/articles/create-html5-canvas-javascript-sprite-animation/
			ctx.drawImage(
				this.sheet,
				this.sheet_offset.x + this.frame_width * (frame_number % this.frame_count),
				this.sheet_offset.y,
				this.frame_width,
				this.frame_height,
				0,
				0,
				this.frame_width,
				this.frame_height
			);
		}
		lines(): math.Line2D[] { return []; }
	}

	class Flappy extends SheetSprite {
		static offset = new math.Point2D(-3,490);
		static x = 60;
		constructor(public y: number, public rotation: number, public velocity: number) {
			super(images[graphics.flappy], Flappy.offset, 28, 14, 3);
			if(y <= 0)
				throw new Error("Flappy died :(");
		}
		flap(){
			return new Flappy(this.y, this.rotation, flapSpeed);
		}
		delta(deltaT: number){
			return new Flappy(
				this.y + this.velocity * deltaT, 
				Math.max(-Math.PI/4, Math.min(Math.PI/4, this.rotation + this.velocity * roll * deltaT)), //this.rotation + Math['sign'].call(Math, this.velocity) * roll * deltaT
				this.velocity - gravity * deltaT
			)
		}
		box(){
			return new math.Box(new math.Point2D(Flappy.x, this.y), 28, 14).rotate(this.rotation);
		}
		draw(ctx: CanvasRenderingContext2D){
			if (debug) {
				this.box().draw(ctx, debug);
			}
			ctx.save();
			ctx.translate(Flappy.x, ctx.canvas.height - this.y);
			ctx.rotate(-this.rotation);
			ctx.translate(- this.frame_width / 2, - this.frame_height / 2);
			super.draw(ctx);
			ctx.restore();
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
			this.obstacles.forEach(o => o.draw(ctx));
			this.flappy.draw(ctx);
			
			ctx.font = "18px Arial";
			ctx.fillText(""+this.points, 25, 30);
		}

		static anyIntersection(as: math.Line2D[], bs: math.Line2D[]){
			return as.reduce((p, a) => p || bs.reduce((h, b) => {
				if (h)
					return h;
				var i = b.intersects(a);
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
			var imageLoaded = Rx.Observable.merge(
				new Img(graphics.trees[0]).observable.take(1),
				new Img(graphics.trees[1]).observable.take(1),
				new Img(graphics.flappy).observable.take(1)
			).scan({}, (registry, img) => {
				registry[img.src] = img.img; 
				return registry;	
			}).last().tap(registry => {
				images = registry;
			});

			imageLoaded.select(_ => new Start())
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