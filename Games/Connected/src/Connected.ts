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
		constructor(public x: number, public y: number, public color: number) {}
		down(y: number = 1){
			return new Sprite(this.x, this.y - y, this.color);
		}
		draw(ctx: CanvasRenderingContext2D, game: Game, selected: boolean = false) {
			this.p = this.p || game.gridXYtoCanvas(this.x, this.y);
			ctx.beginPath();
			var r = game.gridSize / 2;
			ctx.arc(this.p.x + r, this.p.y + r, r, 0, 2 * Math.PI, false);
			ctx.lineWidth = 5;
			ctx.strokeStyle = colors[this.color];
			ctx.stroke();

			if(selected){
				ctx.beginPath();
				ctx.arc(this.p.x + r, this.p.y + r, game.gridSize / 10, 0, 2 * Math.PI, false);
				ctx.lineWidth = 5;
				ctx.strokeStyle = colors[this.color];
				ctx.stroke();
			}
		}
	}

	class NormalStage implements Stage {
		constructor(public points: number, public turnsRemaining: number, public dots: Sprite[]){
			if(this.dots.length == 0){
				for(var i = 0; i < 36; i++){
					this.dots.push(new Sprite(~~(i / 6), i % 6, ~~(Math.random()*4)));
				}
			}
		}

		draw(ctx: CanvasRenderingContext2D, game: Game) {
			ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
			this.dots.forEach(s => s.draw(ctx,game));
		}

		run(game: Game) {
			return game.down.take(1)
				.flatMap(_ => game.dots)
				.takeUntil(game.up)
				.flatMap(dot => {
					console.log("Dots:",this.dots.filter(d => d.x == dot.x && d.y == dot.y));
					return Rx.Observable.from(this.dots.filter(d => d.x == dot.x && d.y == dot.y));
				})
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
				.tap(l => console.log(l))
				// When invalid the list becomes empty:
				.takeWhile(l => l.length > 0)
				.tap(dots => dots[0].draw(game.ctx, game, true))
				.skipWhile(l => l.length == 1)
				.defaultIfEmpty([])
				.last()
				.flatMap(list => {
					return list.length ? Rx.Observable.just(this.next(list)) : Rx.Observable.just(this);
				})
		}

		next(removedDots: Sprite[]) {
			console.log("Success", removedDots);
			console.log(removedDots);
			return this;
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
			return removedDots.length == this.dots.length ? new NormalStage(0, 20, []) : this;
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
				s => s.run(this), 
				s => Rx.Observable.just(s)
			)
			.subscribe(
				s => s.draw(this.ctx, this),
				e => console.error(e), 
				() => console.log("Completed game")
			);
		}

		public down = $(this.ctx.canvas).onAsObservable("mousedown");
		public up = $(this.ctx.canvas).onAsObservable("mouseup");

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