module Breakout {
	interface Sprite {
        draw(ctx: CanvasRenderingContext2D);
        lines(): math.Line2D[];
    }

    export class Paddle implements Sprite {
    	speed = 120;

    	constructor(public x, public y) {}

    	box(){
            return new math.Box(new math.Point2D(this.x, this.y), 80, 10);
        }

        update(deltaT:number, direction:number) {
            return new Paddle(this.x + deltaT * direction * this.speed, this.y)
        }

        draw(ctx: CanvasRenderingContext2D) {
            this.box().draw(ctx);
        }

        lines(){
            return this.box().lines()
        }

        static initial(){
            return new Paddle(400, 55);
        }
    }

    export class Obstacle implements Sprite {
    	constructor(public x, public y, public width, public height, public color=null, public health=1) {
    		if(this.color == null) 
    			this.color = "rgb(" + Math.floor(Math.random() * 255) + ", " + Math.floor(Math.random() * 255) + ", " + Math.floor(Math.random() * 255) + ")";
    	}

    	box(){
            return new math.Box(new math.Point2D(this.x, this.y), this.width, this.height);
        }

        draw(ctx: CanvasRenderingContext2D) {
        	ctx.save()
        	ctx.fillStyle = this.color;
            this.box().draw(ctx);
            ctx.restore()
        }

        lines(){
            return this.box().lines()
        }

        decreaseHealth(decrease=true) {
        	if (decrease)
        		return new Obstacle(this.x, this.y, this.width, this.height, this.color, this.health-1);
        	else 
        		return new Obstacle(this.x, this.y, this.width, this.height, this.color, this.health);
        }

        static initial() {
        	var obstacles = []

        	for (var x=0; x < 10; x++)
        		for (var y=0; y < 5; y++)
        			obstacles.push(new Obstacle(40 + x*80 , 550 - y*20, 80, 20))
        	return obstacles
        }
    }

    export class Died implements Error {
        constructor(public name: string, public message?: string) {        
        }
    }

    export class GameOver implements Error {
        constructor(public name: string, public message?: string) {        
        }
    }

    export class Ball implements Sprite {

    	constructor(public x, public y, public velocityX, public velocityY) {}

        box(){
            return new math.Box(new math.Point2D(this.x, this.y), 10, 10);
        }

        static anyIntersection(a: math.Box, b: math.Box){
            return a.lines().reduce((p, al) => p || b.lines().reduce((h, bl) => {
                if (h)
                    return h;
                var i = bl.intersects(al);
                return i && i.length && i;
            }, false), false);
        }

        update(deltaT:number, paddle: Paddle, paddleDir:number, obstacles: Obstacle[]) {
            var box = this.box()

            if (this.y < 0)
            	throw new Died(":(")

            if (this.x - 5 < 0 || this.x + 5 > 800)
            	this.velocityX = -this.velocityX;
            if (this.y + 5 > 600)
            	this.velocityY = -this.velocityY;

            if (obstacles.reduce((x, o) => x || Ball.anyIntersection(box, o.box()), false))
            	this.velocityY = -this.velocityY;

            if (Ball.anyIntersection(box, paddle.box())){
                this.velocityX += 3 * (this.x - paddle.x) / 80
                this.velocityY *= -1;
            }

            return new Ball(this.x + this.velocityX, this.y + this.velocityY, this.velocityX, this.velocityY);
        }

        draw(ctx:CanvasRenderingContext2D) {
            this.box().draw(ctx);
        }

        lines() {
            return this.box().lines();
        }

        static initial() {
            return new Ball(400, 400, -1, -5);
        }
	}

	export class Game {
		paddleKeys = [
            39,
            37
        ]

		paddleObservable = $(document.body).onAsObservable("keyup keydown")
            .filter(ke => this.paddleKeys.indexOf(ke['keyCode']) != -1)
            .map(ke => {
                if(ke.type == 'keyup') return 0;
                if(ke['keyCode'] == this.paddleKeys[0]) return 1;
                if(ke['keyCode'] == this.paddleKeys[1]) return -1;
            });

		constructor(public ctx: CanvasRenderingContext2D) {

			var state = { paddle: Paddle.initial(), ball: Ball.initial(), obstacles: Obstacle.initial() };

			var t = Rx.Observable.interval(1000/30, Rx.Scheduler.requestAnimationFrame);

            var events = t
                .map(
                    _ => ({ t: new Date().getTime() }) 
                ).scan(
                    { date: new Date().getTime(), dt: 0, event: null }, 
                    (prev, e) => { return { dt: (e.t - prev.date) / 1000, date: e.t, event: e }; }
                ).skip(
                	1
                ).withLatestFrom(
                    this.paddleObservable.startWith(0), 
                    (t, dir) => ({dt: t.dt, dir: dir})
                );

            events.scan(
            		{ paddle: Paddle.initial(), ball: Ball.initial(), obstacles: Obstacle.initial(), lives: 3 },
            		(state, e) => {
            			var ball = null, lives = 0;

            			try {
            				ball = state.ball.update(e.dt, state.paddle, e.dir, state.obstacles)
        				} catch (e) {
        					ball = Ball.initial()
        					if (state.lives - 1 == 0)
        						throw new GameOver(":(");
        					lives = -1;
        				}

                        return {
                            paddle: state.paddle.update(e.dt, e.dir),
                            ball: ball,
                            obstacles: state.obstacles.map(
                            	o => o.decreaseHealth(Ball.anyIntersection(state.ball.box(), o.box()))
                            	).filter(o => o.health != 0),
                            lives: state.lives + lives
                        };
                    }
            	).subscribe(state => {
            		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            		ctx.fillStyle = "white";
					state.paddle.draw(ctx);
					state.ball.draw(ctx);
					state.obstacles.forEach(o => o.draw(ctx))
            	});
		}
	}
}

$("#breakout").clickAsObservable().take(1).map(e => e.target).subscribe(c => {
    var ctx: CanvasRenderingContext2D = (<HTMLCanvasElement>c).getContext("2d");
    var game = new Breakout.Game(ctx);
});