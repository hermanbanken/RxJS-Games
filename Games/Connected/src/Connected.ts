/// <reference path="../../ts/rx/rx.all.d.ts" />
/// <reference path="../../ts/rx-jquery/rx.jquery.d.ts" />
/// <reference path="../../ts/math.ts" />
/// <reference path="../../ts/rx.tupled.ts" />
/// <reference path="../../ts/rx.flatscan.ts" />
/// <reference path="../../ts/rx.requestanimationframescheduler.ts" />

module Connected {

	var colors = ["#629E60", "#E9C03A", "#B74133", "#5374ED"];

	interface Stage {
		draw(ctx: CanvasRenderingContext2D, game: Game): void;
		run(game: Game): Rx.Observable<Stage>;
	}

	class Sprite {
		p = null;
		public tween: any;
		constructor(public x: number, public y: number, public color: number) {}
		down(y: number = 1){
			return new Sprite(this.x, this.y + y, this.color);
		}
		downWithTween(y: number = 1){
			var t = this.down(y);
			t.tween = { from: this.tween && this.tween.from || this, to: t };
			return t;
		}
		draw(ctx: CanvasRenderingContext2D, game: Game, selected: boolean = false, yoffset: number = 0, opacity: number = 1) {
			this.p = this.p || game.gridXYtoCanvas(this.x, this.y);
			ctx.beginPath();
			var r = game.gridSize / 2;
			ctx.arc(this.p.x + r, this.p.y + r + yoffset, r, 0, 2 * Math.PI, false);
			ctx.lineWidth = 5;
			ctx.strokeStyle = colors[this.color];
			ctx.stroke();

			if(selected){
				ctx.beginPath();
				ctx.arc(this.p.x + r, this.p.y + r + yoffset, game.gridSize / 10, 0, 2 * Math.PI, false);
				ctx.lineWidth = 5;
				ctx.strokeStyle = colors[this.color];
				ctx.stroke();
			}
		}
	}

	class NormalStage implements Stage {
		time = 0;

		constructor(public points: number, public turnsRemaining: number, public dots: Sprite[]){
			if(this.dots.length == 0){
				for(var i = 0; i < 36; i++){
					this.dots.push(this.randomSprite(~~(i / 6), i % 6));
				}
			}
		}

		randomSprite(x,y){
			return new Sprite(x,y, ~~(Math.random()*4));
		}

		draw(ctx: CanvasRenderingContext2D, game: Game) {
			var t = this.time;
			ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
			this.dots.forEach(s => {
				s.draw(
					ctx,
					game,
					false,
					s.tween && s.tween.from ? (s.tween.from.y - s.y) * (1-Math.min(1, t)) * game.gridSize * 2 : 0,
					1
				);
			});
		}

		atTime(t: number){
			this.time = t;
			return this;
		}

		clearedAnimations(){
			return new NormalStage(this.points, this.turnsRemaining, this.dots.map(d => d.down(0)));
		}

		run(game: Game) {
			var ss = game.down.take(1)
				.flatMap(_ => game.dots)
				.takeUntil(game.up)
				.flatMap(dot => {
					// Convert positions to actual Sprite objects
					return Rx.Observable.from(this.dots.filter(d => d.x == dot.x && d.y == dot.y));
				})
				// Verify if dot may be added,
				// if so:	  add to list
				// otherwise: return empty list
				.scan([], (list, dot) => {
					// Check if not already contained
					var contains = list.filter(d => d.x == dot.x && d.y == dot.y).length > 0;
					if(contains)
						return list;
					// Verify dots are adjacent
					var ok = list.length == 0 || (list[0].x == dot.x || list[0].y == dot.y) && Math.abs(list[0].x - dot.x + list[0].y - dot.y) <= 1;
					// Verify color
					var color = list.length == 0 || list[0].color == dot.color;
					if(!ok || !color)
						return [];
					list.unshift(dot);
					return list;
				})
				// Draw dot inner circles
				.tap(dots => dots.length && dots[0].draw(game.ctx, game, true))
				.skipWhile(dots => dots.length == 1);
			
			// When invalid the list becomes empty, but we still want that empty list (to terminate):
			var inclusive = ss.publish(ob => ob.takeUntil(ob.skipWhile(l => l.length > 0)))
			
			return inclusive
				.lastOrDefault(null, [])
				.flatMap(list => {
					return list.length ? this.next(list) : Rx.Observable.just(this);
				})
		}

		next(removedDots: Sprite[]) {
			// Delete removed dots
			removedDots.forEach(d => {
				this.dots.splice(this.dots.indexOf(d), 1);
			});
			// Move existing dots
			this.dots = this.dots.map(o => {
				var below = removedDots.filter(_ => _.x == o.x && _.y > o.y).length;
				return below ? o.downWithTween(below) : o;
			});
			// Add new dots that move down
			removedDots.reduce((p,d) => { p[d.x] = (p[d.x]+1 || 1); return p; }, []).forEach((below, x) => {
				for(var i = 1; i <= below; i++)
					this.dots.push(this.randomSprite(x, -i).downWithTween(below));
			});
	
			// Animate
			var duration = 500;//ms
			var t = Rx.Observable.interval(duration/30, Rx.Scheduler.requestAnimationFrame).map(i => i/30);
			var inclusive = t.publish(ob => ob.takeUntil(ob.skipWhile(t => t < duration/1000)));
			return inclusive.doAction(t => console.log("T=",t))
				.map(t => this.atTime(t*2))
				.concat(Rx.Observable.just(this.clearedAnimations()));
		}
	}

	class Start extends NormalStage {
		constructor(){
			super(0, 0, [new Sprite(2,3,0),new Sprite(3,3,0)]);
			//super(0, 0, [new Sprite(0,3,0),new Sprite(1,3,0),new Sprite(2,3,0),new Sprite(3,3,0),new Sprite(4,3,0),new Sprite(5,3,0)]);
		}
		draw(ctx: CanvasRenderingContext2D, game: Game) {
			super.draw(ctx, game);

			var txt = "connect the two dots to start";
			ctx.font = "18px Arial";
			ctx.fillText(txt, ctx.canvas.width/2 - ctx.measureText(txt).width/2, ctx.canvas.height/2 + 100);
		}
		next(removedDots: Sprite[]) {
			console.log(removedDots.length == this.dots.length ? "Advancing to normal stage" : "Failed tutorial :-(");
			var r = removedDots.length == this.dots.length ? new NormalStage(0, 20, []) : this;
			return Rx.Observable.just(r);
		}
	}


	export class Game {
		public level: number = 0;

		public cols: number = 0;
		public rows: number = 0;
		public gridSize: number = 0;
		public marginTop: number = 30;

		canvasXYtoGridXY(cx,cy){
			cx -= this.gridSize;
			cy -= this.gridSize + this.marginTop;
			cx /= this.gridSize;
			cy /= this.gridSize;
			return {
				x: ~~(cx / 2),
				y: ~~(cy / 2),
				inGrid: ~~cx % 2 == 0 && ~~cy % 2 == 0
			};
		}

		gridXYtoCanvas(gx,gy){
			return {
				x: this.gridSize + 2*this.gridSize*gx,
				y: this.gridSize + 2*this.gridSize*gy + this.marginTop
			};
		}

		constructor(public ctx: CanvasRenderingContext2D) {

			this.cols = 6;
			this.rows = 6;

			this.gridSize = ctx.canvas.width / (this.rows * 2 + 1);

			Rx.Observable
			.just(new Start())
			.flatScan<Stage,Stage>(
				s => { s.draw(this.ctx, this); return s.run(this).doAction(_ => _.draw(this.ctx, this)).last() }, 
				s => Rx.Observable.just(s)
			)
			.subscribe(
				s => s.draw(this.ctx, this),
				e => console.error(e), 
				() => console.log("Completed game")
			);
		}

		public down = $(this.ctx.canvas).onAsObservable("mousedown");
		public up = $(window).onAsObservable("mouseup");

		public dots = $(this.ctx.canvas).onAsObservable("mousemove")
			.filter(e => e.which === 1)
			.map(e => this.canvasXYtoGridXY(e.pageX - $(e.target).offset().left, e.pageY - $(e.target).offset().top))
			.distinctUntilChanged()
			.filter(p => p.inGrid && p.x >= 0 && p.x < this.cols && p.y >= 0 && p.y < this.rows);

		public spaces = $(document.body)
			.onAsObservable("keydown keyup")
			.filter(e => e['keyCode'] === 32)
			.map(e => e.type === 'keydown')
			.startWith(false);
	}
}

Rx.config['longStackSupport'] = true;
Rx.Observable.just($("#connected").get(0)).take(1).subscribe(c => {
	var ctx: CanvasRenderingContext2D = (<HTMLCanvasElement>c).getContext("2d");
	var game = new Connected.Game(ctx);
});