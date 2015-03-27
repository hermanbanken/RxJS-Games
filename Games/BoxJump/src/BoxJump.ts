/// <reference path="../../ts/rx/rx.all.d.ts" />
/// <reference path="../../ts/rx-jquery/rx.jquery.d.ts" />
/// <reference path="math.ts" />
/// <reference path="rx.tupled.ts" />
/// <reference path="rx.requestanimationframescheduler.ts" />

module BoxJump {

	export class Game {
		public player: Player;
		constructor(public ctx: CanvasRenderingContext2D) {
			this.player = new BoxJump.Player(new math.Box(new math.Point2D(0,0), 10, 10));
			Rx.Observable.interval(1000/30, Rx.Scheduler.requestAnimationFrame)
				// Get time delta
				.map(_ => new Date().getTime()).tupled().map((p: number[]) => p[1] - p[0])
				// Update game state
				.withLatestFrom(this.spaces, (t,s) => { return { time: t, space: s }; })
				.scan(
					new BoxJump.Player(new math.Box(new math.Point2D(0,0), 20, 20)),
					(s, t) => s.update(t.time, t.space)
				)
				.takeWhile(p => p.box.centre.x < this.ctx.canvas.width)
				.repeat()
				.subscribe(p => {
					try {
						this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
						this.ctx.fillStyle = "rgba(255,0,0,1)";
						p.box.draw(this.ctx);	
					} catch (e){
						console.error("Subscribe error! %s", e.stack);
					}
				}, e => console.error(e));
		}

		public spaces = $(document.body)
			.onAsObservable("keydown keyup")
			.filter(e => e['keyCode'] === 32)
			.map(e => e.type === 'keydown')
			.startWith(false);
	}

	export class Player{
		constructor(public box: math.Box, public velocity: math.Point2D = null){
			if(this.velocity == null)
				this.velocity = new math.Point2D(170, 0);
		}

		jump(){
			if(this.box.centre.y == this.box.height()/2){
				return new Player(this.box, new math.Point2D(this.velocity.x, 340));
			}
			return this;
		}

		update(millis, jump){
			var v = new math.Point2D(this.velocity.x, this.box.centre.y <= 0 ? 0 : this.velocity.y - 30);
			var m = this.velocity.times(millis/1000);
			m = this.box.centre.add(m).map(x=>x, y=>Math.max(y,this.box.height()/2)).min(this.box.centre);
			var p  = new Player(<math.Box> this.box.move(m), v);
			jump && (p = p.jump());
			return p;
		}
	}
}

Rx.config['longStackSupport'] = true;
$("#boxjump").clickAsObservable().take(1).subscribe(e => {
	var ctx: CanvasRenderingContext2D = (<HTMLCanvasElement>e.target).getContext("2d");
	var game = new BoxJump.Game(ctx);
});