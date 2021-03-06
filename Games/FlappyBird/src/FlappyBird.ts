/// <reference path="../../ts/rx/rx.all.d.ts" />
/// <reference path="../../ts/rx-jquery/rx.jquery.d.ts" />
/// <reference path="../../ts/rx.flatscan.ts" />
/// <reference path="../../ts/math.ts" />
/// <reference path="../../ts/rx.requestanimationframescheduler.ts" />

module Flappy {

	var colors = ["#629E60", "#E9C03A", "#B74133", "#5374ED"];
	var graphics = {
		trees: ["FlappyBird/tree.png", "FlappyBird/tree-high.png", "FlappyBird/Junglewood_Tree.png", "FlappyBird/Pearlwood_Tree.png"],
        clouds: ["FlappyBird/cloud.png", "FlappyBird/actual-cloud.png"],
		flappy: "FlappyBird/sprites.png",
		aula: "FlappyBird/aula.png",
		ewi: "FlappyBird/ewi-blur.png",
		coin: "FlappyBird/spinning_coin_gold.png"
	};
	var images = {};
	var rounds = 2;
	var flapSpeed = 300;
	var gravity = 500;
	var roll = Math.PI/100;
	var canvas_height = 0;
	var speed = 100;
	var default_speed = 100;
	export var debug = false;

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
			this.img.src = src;
		}
	}

	class SheetSprite implements Sprite {
		f:number = 0;
		frame_offset_x = 0;
		frame_offset_y = 0;
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
				this.frame_offset_x,
				this.frame_offset_y,
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
		at(x: number): Obstacle;
		x: number;
		width: number;
		height: number;
		fatal: boolean;
	}

	class BasicObstacle extends SheetSprite implements Obstacle {
		public x = 400;
		public width : number;
		public height : number;
		public y = 0;
		public fatal = true;
		
		boost() { return 0; }
		draw(ctx: CanvasRenderingContext2D) {
			var b = this.box();
			if (debug) b.draw(ctx, debug);
			if (this.x - this.width / 2 > ctx.canvas.width || this.x + this.width / 2 < 0)
				return;
			ctx.save();
			ctx.translate(this.x - this.frame_width / 2, ctx.canvas.height - b.centre.y - this.height / 2);
			super.draw(ctx);
			ctx.restore();
		}
		at(x: number) {
			this.x = x;
			return this;
		}
		box() {
			return new math.Box(new math.Point2D(this.x, this.height / 2 + this.y), this.width, this.height);
		}
		lines() { return this.box().lines(); }
		delta(deltaT: number) {
			this.x -= speed * deltaT;
			return this;
		}
	}

	class Coin extends BasicObstacle {
		static offset = new math.Point2D(0, 0);
		public x = 400;
		public width = 32;
		public height = 32;
		public y = 20;
		constructor() {
			super(images[graphics.coin], new math.Point2D(0, 0), 32, 32, 8);
		}
	}

	class StaticObstacle extends BasicObstacle {
		public width = 60;
		constructor(public height: number){
			super(null, new math.Point2D(0, 0), 0, 0, 1);
			this.sheet = images[graphics.trees[~~(Math.random() * graphics.trees.length)]];
			this.width = this.frame_width = this.sheet.width;
			this.height = this.frame_height = this.sheet.height;
		}
	}

	class Aula extends BasicObstacle {
		constructor() {
			super(images[graphics.aula], new math.Point2D(0, 0), 400, 300, 1);
			this.width = this.frame_width = this.sheet.width;
			this.height = 128;
			this.frame_height = this.sheet.height;
		}
		box() {
			return new math.Box(new math.Point2D(this.x, 236), this.width, 128);
		}
	}

	class TopDownObstacle extends BasicObstacle {
		public width = 60;
		constructor(public height: number) {
			super(null, new math.Point2D(0, 0), 0, 0, 1);
			this.sheet = images[graphics.trees[~~(Math.random() * graphics.trees.length)]];
			this.width = this.frame_width = this.sheet.width;
			this.height = this.frame_height = this.sheet.height;
			this.y = canvas_height - this.height;
		}
	}

	class Cloud extends BasicObstacle {
		constructor() {
			super(null, new math.Point2D(0, 0), 0, 0, 1);
			this.sheet = images[graphics.clouds[~~(Math.random() * graphics.clouds.length)]];
			this.width = this.frame_width = this.sheet.width;
			this.height = this.frame_height = this.sheet.height;
			this.y = canvas_height - this.height - Math.random() * 200;
		}
	}

	class EWI extends BasicObstacle {
		public speed = 200;
		public fatal = false;
		constructor(){
			super(images[graphics.ewi], new math.Point2D(0,0), 300, 500, 1);
			this.y = 0;
			this.width = this.frame_width;
			this.height = this.frame_height;
		}
		boost() { return 100; }
	}

	class NormalStage implements Stage {
		time = 0;

		constructor(public points: number, public flappy: Flappy, public obstacles: Obstacle[], public coins: Coin[]){
			if(this.obstacles.length == 0){
				this.obstacles.push(new EWI().delta(-4));
				this.obstacles.push(new Aula().delta(-8));
				this.obstacles.push(new StaticObstacle(100).delta(-1));
				this.obstacles.push(new Cloud().delta(-3));
				this.obstacles.push(new Cloud().delta(-5.5));
				this.obstacles.push(new StaticObstacle(300).delta(-11));
				this.obstacles.push(new Cloud().delta(-14));
				this.obstacles.push(new StaticObstacle(100).delta(-11));
				this.obstacles.push(new StaticObstacle(300).delta(-13));
			}
			if(this.coins.length == 0){
				this.coins.push(new Coin().at(160));
			}
		}

		draw(ctx: CanvasRenderingContext2D) {
			ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
			this.obstacles.forEach(o => o.draw(ctx));
			this.coins.forEach(c => c.draw(ctx));
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

		static flappyXline = new math.Line2D(new math.Point2D(Flappy.x, -10), new math.Point2D(Flappy.x, canvas_height + 10));
		
		/* Handles game logic per frame */
		delta(deltaT: number, flap: boolean){
			var f = this.flappy.delta(deltaT);
			if(flap)
				f = f.flap();

			// Collisions
			var fl = this.flappy.lines();
			var collision = this.obstacles.reduce((p, o) => p || o.fatal && NormalStage.anyIntersection(o.lines(), fl), false);
			if (collision){
				console.log("Collision!", collision);
				throw new Error("Dead by collision!");
			}

			// Boosting
			var boost = this.obstacles.reduce((p, o) => p + (!o.fatal && NormalStage.anyIntersection(o.lines(), [NormalStage.flappyXline]) && o.boost() || 0), 0);
			if (boost){
				speed = default_speed + boost;
			} else {
				speed = default_speed;
			}

			var win = 0;
			// Coins
			var cs_all = this.coins.map(c => c.delta(deltaT));
			var cs = this.coins.filter(c => !NormalStage.anyIntersection(c.lines(), fl));
			win += (cs_all.length - cs.length) * 1000;
			
			// Move obstacles
			var os = this.obstacles.map((o:Obstacle) => {
				var ox = o.x;
				var n = o.delta(deltaT);
				if (n.x < Flappy.x && ox >= Flappy.x){
					win += o.height;
				}
				return n;
			});

			// Remove old obstacles
			os = os.filter((o: Obstacle) => o.x + o.width / 2 > 0);
			// Add new obstacles
			while (this.obstacles.length > os.length) {
				var last = this.obstacles[this.obstacles.length - 1];
				var x = Math.max(last.x + last.width + 100, 400) + Math.random() * 200;
				if (Math.random() > 0.8)
					os.push(new Cloud().at(x));
				else
					os.push(new StaticObstacle(300 * Math.random() + 100).at(x));
			}

			return new NormalStage(this.points + win, f, os, cs);
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
		constructor(){ super(0, Flappy.initial(), [], []); }
		draw(ctx: CanvasRenderingContext2D) {
			super.draw(ctx);

			var txt = "press space to start";
			ctx.font = "18px Arial";
			ctx.fillText(txt, ctx.canvas.width/2 - ctx.measureText(txt).width/2, ctx.canvas.height/2 + 100);
		}
		run(game: Game){
			return Rx.Observable.merge(
				$(game.ctx.canvas).onAsObservable("click").map(_ => 1),
				$(window).onAsObservable("keyup").filter(e => e['keyCode'] == 32).map(_ => 1)
			).take(1).map(_ => new NormalStage(0, Flappy.initial(), [], []));
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
		
        constructor(public ctx: CanvasRenderingContext2D){}

		run() {
			var imageLoaded = Rx.Observable.merge(
				Rx.Observable.from(graphics.trees).flatMap(t => new Img(t).observable.take(1)),
				Rx.Observable.from(graphics.clouds).flatMap(t => new Img(t).observable.take(1)),
				new Img(graphics.coin).observable.take(1),
				new Img(graphics.flappy).observable.take(1),
				new Img(graphics.ewi).observable.take(1),
				new Img(graphics.aula).observable.take(1)
			).scan({}, (registry, img) => {
				registry[img.src] = img.img; 
				return registry;	
			}).last().tap(registry => {
				images = registry;
			});
			canvas_height = this.ctx.canvas.height;

			return imageLoaded.select(_ => new Start())
			.flatScan<Stage,Stage>(
				s => { s.draw(this.ctx); return s.run(this).doAction(_ => _.draw(this.ctx)).last() }, 
				s => Rx.Observable.just(s)
			)
			.tap(
				s => s.draw(this.ctx),
				e => console.error(e), 
				() => console.log("Completed game")
			);
		}

		// Mouse events
        public ups = $(window).keyupAsObservable().filter(e => e.keyCode == 32 || e.keyCode == 38).map(_ => new Date().getTime());
		public down = $(this.ctx.canvas).onAsObservable("mousedown");
        public up = $(window).onAsObservable("mouseup");
	}
}

Reveal.forSlide(s => $(s.currentSlide).closest('#g-mekelbird').get().length > 0, s => {
    console.log("Flappy");
    var canvas = <HTMLCanvasElement> $("#flappy").get(0);
    return Rx.Observable.using(
    	() => $(window).keyupAsObservable().filter(k => k.keyCode === "D".charCodeAt(0)).subscribe(_ => {
            console.log("Flipping debug");
            Flappy.debug = !Flappy.debug;	
		}),
    	_ => new Flappy.Game(canvas.getContext("2d")).run()
    );
}).subscribe(e => { });