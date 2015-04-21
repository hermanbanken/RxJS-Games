/// <reference path="../../ts/rx/rx.all.d.ts" />
/// <reference path="../../ts/rx-jquery/rx.jquery.d.ts" />
/// <reference path="../../ts/math.ts" />
/// <reference path="../../ts/rx.tupled.ts" />
/// <reference path="../../ts/rx.requestanimationframescheduler.ts" />

var levels = [
	[new math.Box(new math.Point2D(300, 15), 30, 30)],
	[new math.Box(new math.Point2D(170, 15), 30, 30), new math.Box(new math.Point2D(340, 15), 30, 30), new math.Box(new math.Point2D(510, 15), 30, 30)],
	[
		new math.Box(new math.Point2D(100, 15), 30, 30), new math.Box(new math.Point2D(220, 35), 30, 30), 
		new math.Box(new math.Point2D(340, 15), 30, 30), new math.Box(new math.Point2D(460, 35), 30, 30),
		new math.Box(new math.Point2D(580, 15), 30, 30), new math.Box(new math.Point2D(700, 35), 30, 30)
	],
];

module BoxJump {

	export class Game {
		public level: number = 0;

		public player: Player;
		constructor(public ctx: CanvasRenderingContext2D) {
			Rx.Observable.interval(1000/30, Rx.Scheduler.requestAnimationFrame)
				// Get time delta
				.map(_ => new Date().getTime()).tupled().map((p: number[]) => p[1] - p[0])
				// Update game state
				.withLatestFrom(this.spaces, (t,s) => { return { time: t, space: s }; })
				.scan(
					new BoxJump.Player(new math.Box(new math.Point2D(0,0), 20, 20), null),
					(s, t) => s.update(t.time, t.space)
				)
				.takeWhile(p => p.box.centre.x < this.ctx.canvas.width)
				.doWhile(() => ++this.level < levels.length)
				.takeWhile(_ => this.level >= 0)
				.subscribe(p => {
					try {
						this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
						this.ctx.fillStyle = "rgba(255,0,0,1)";
						p.box.draw(this.ctx);
						var dead = false;
						if(levels[this.level])
						for(var bi in levels[this.level]){
							levels[this.level][bi].draw(this.ctx);
							dead = dead || p.box.intersects(levels[this.level][bi]);	
						}
						if(dead){
							this.level = -1;	
						}
						var txt = "Level: "+this.level;
						this.ctx.fillText(txt, this.ctx.canvas.width - this.ctx.measureText(txt).width - 10, 15);
					} catch (e){
						console.error("Subscribe error! %s", e);
					}
				}, e => console.error(e), () => {
					var txt = this.level > 0 ? "You WON!" : "You LOST!";
					this.ctx.font = "30px Arial";
					this.ctx.fillText(txt, this.ctx.canvas.width/2 - this.ctx.measureText(txt).width/2, this.ctx.canvas.height/2);
				});
		}

		public spaces = $(document.body)
			.onAsObservable("keydown keyup")
			.filter(e => e['keyCode'] === 32)
			.map(e => e.type === 'keydown')
			.startWith(false);
	}

	export class Player{
		constructor(public box: math.Box, public velocity: math.Point2D){
			if(this.velocity == null)
				this.velocity = new math.Point2D(170, 0);
		}

		jump(){
			if(this.box.centre.y == this.box.height/2){
				return new Player(this.box, new math.Point2D(this.velocity.x, 340));
			}
			return this;
		}

		rotate(){
			if(this.box.centre.y > this.box.height/2){
				var a = Math.max(this.velocity.y,-340)/340;
				return new Player(
					(new math.Box(this.box.centre, this.box.width, this.box.height)).rotate(Math.PI/2 * a),
					this.velocity
				);
			}
			return this;
		}

		update(millis, jump){
			var v = new math.Point2D(this.velocity.x, this.box.centre.y <= 0 ? 0 : this.velocity.y - 30);
			var m = this.velocity.times(millis/1000);
			m = this.box.centre.add(m).map(x=>x, y=>Math.max(y,this.box.height/2)).min(this.box.centre);
			var p  = new Player(<math.Box> this.box.move(m), v);
			jump && (p = p.jump());
			return p.rotate();
		}
	}
}

$("#boxjump").clickAsObservable().take(1).subscribe(e => {
	var ctx: CanvasRenderingContext2D = (<HTMLCanvasElement>e.target).getContext("2d");
	var game = new BoxJump.Game(ctx);
});