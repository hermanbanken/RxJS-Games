/// <reference path="../../ts/rx/rx.all.d.ts" />
/// <reference path="../../ts/rx-jquery/rx.jquery.d.ts" />
/// <reference path="../../ts/rx.flatscan.ts" />
/// <reference path="../../ts/rx.requestanimationframescheduler.ts" />

module Flappy {

	var colors = ["#629E60", "#E9C03A", "#B74133", "#5374ED"];
	var rounds = 2;

	interface Stage {
		draw(ctx: CanvasRenderingContext2D): void;
		run(game: Game): Rx.Observable<Stage>;
	}

	interface Sprite {
		draw(ctx: CanvasRenderingContext2D);
	}

	interface Obstacle extends Sprite {
		boost(): number;
	}

	class NormalStage implements Stage {
		time = 0;

		constructor(public points: number, public obstacles: Obstacle[]){
		}

		draw(ctx: CanvasRenderingContext2D) {
			ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		}

		run(game: Game) {
			return Rx.Observable.never<Stage>();
		}
	}

	class Start extends NormalStage {
		constructor(){ super(0, []); }
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
			).take(1).map(_ => new NormalStage(0, []));
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
		public down = $(this.ctx.canvas).onAsObservable("mousedown");
		public up = $(window).onAsObservable("mouseup");
	}
}

Rx.config['longStackSupport'] = true;
Rx.Observable.just($("#flappy").get(0)).take(1).subscribe(c => {
	var ctx: CanvasRenderingContext2D = (<HTMLCanvasElement>c).getContext("2d");
	var game = new Flappy.Game(ctx);
});