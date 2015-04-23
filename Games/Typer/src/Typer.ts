module Typer {
	export class Game {
		constructor(public ctx: CanvasRenderingContext2D ) {
		}

		static shipSpeed = 37;
		static bulletSpeed = 100;
		static shootBack = 6;

		story = [
			"Hello",
			"Welcome to Typeria",
			"a peaceful planet",
			"in the Keymeria universe",
			"Or at least",
			"It WAS peaceful",
			"We are under attack",
			"and we need your help",
			"A hostal alien race",
			"is invading our planet",
			"You should prevent the",
			"ship to reach surface",
			"or we will all DIE",
			"All our hopes are on you"
		];		

		run() {

			var gameEvents = $(document.body).keydownAsObservable()
				.filter(
					ke => "A".charCodeAt(0) <= ke.keyCode && ke.keyCode <= "Z".charCodeAt(0) || ke.keyCode === 32 /* space */
				).do(
					e => e.stopPropagation()
				).scan(
					{ sentence: this.story.shift(), level: 1, shoot: false },
					(state, ke) => {
						var sentence = state.sentence;
						var level = state.level;
						var shoot = false;

						if (String.fromCharCode(ke.keyCode) === sentence.substring(0,1).toUpperCase()){
							sentence = sentence.substring(1);
							shoot = true;
							if (sentence.charCodeAt(0) === 32)
								sentence = sentence.substring(1);
						}

						if (sentence.length == 0) {
							sentence = this.story.shift()
							level += 1;
						}

						return {
							sentence: sentence,
							level: level,
							shoot: shoot
						}
					}
				).share()
				
				var bullet = gameEvents.filter(state => state.shoot).map(_ => 1)

				var t = Rx.Observable.interval(1000/30, Rx.Scheduler.requestAnimationFrame);

	            var timeEvents = t
	                .map(
	                    _ => ({ t: new Date().getTime() }) 
	                ).scan(
	                    { date: new Date().getTime(), dt: 0, event: null }, 
	                    (prev, e) => { return { dt: (e.t - prev.date) / 1000, date: e.t, event: e }; }
	                ).skip(1).share()

	            function bullet_sequence(id:number): Rx.Observable<number[]> {
					return timeEvents.scan(
						300,
						(p, e) => p - e.dt * Game.bulletSpeed
					).takeWhile(p => p > 0).map(p => [id, p])
				}
	            var bullets = bullet.map((_, i) => bullet_sequence(i)).mergeAll();

	            var shipAndBullets = timeEvents.withLatestFrom(
	            	bullets.buffer(timeEvents),
	            	(x, y) => ({dt:x.dt, bullets:y})
	            ).scan(
	            	{shipPostion: 0, bullets: [], lastHit:-1},
	            	(prev, e) => {
	            		var noBulletsHitting = e.bullets.filter(b => b[1] < prev.shipPostion && prev.lastHit < b[0]).length
	            		var bulletsRemaining = e.bullets.filter(b => b[1] > prev.shipPostion)

	        			return {
	        				shipPostion: prev.shipPostion + e.dt * Game.shipSpeed - noBulletsHitting * Game.shootBack, 
	        				bullets:bulletsRemaining,
	        				lastHit: prev.lastHit + noBulletsHitting
	        			}
	        		}
	            ).takeWhile(e => e.shipPostion < 300)
	            	
				return shipAndBullets.withLatestFrom(
					gameEvents,
					(shipBullets, state) => ({state: state, shipBullets:shipBullets})
				).tap(
					x => {
						var state = x.state
						var ctx = this.ctx;
						ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

						ctx.fillStyle = 'black';
						var ship = new math.Box(new math.Point2D(150, x.shipBullets.shipPostion - 30), 20, 60);
						ship.draw(ctx, false, false);

						x.shipBullets.bullets.forEach(b => {
							var bullet = new math.Box(new math.Point2D(150, b[1]), 5, 5);
							bullet.draw(ctx, false, false);
						})
						
						
						ctx.beginPath();
						ctx.moveTo(0, 300);
						ctx.lineTo(ctx.canvas.width, 300);
						ctx.stroke();
						ctx.font = "20px silkscreennormal";
						var text = state.sentence
                    	this.ctx.fillText(text, this.ctx.canvas.width/2 - this.ctx.measureText(text).width/2, 355);
					},
					error => {},
					() => {
						console.log("DONE");
						var ctx = this.ctx;
						ctx.font = "20px silkscreennormal";
						var text = ":( They depended on you"
	                	this.ctx.fillText(text, this.ctx.canvas.width/2 - this.ctx.measureText(text).width/2, 200);
	                }
				);
		}
	}
}

Reveal.forSlide(s => $(s.currentSlide).closest('#g-typer').get().length > 0, s => {
    var canvas = <HTMLCanvasElement> $("#typer", s.currentSlide).get(0);
   
    return new Typer.Game(canvas.getContext("2d")).run();
}).subscribe(e => {
    console.log("Loaded Typer");
});