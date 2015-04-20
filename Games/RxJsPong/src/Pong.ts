module Pong {
    interface Sprite {
        draw(ctx: CanvasRenderingContext2D);
        lines(): math.Line2D[];
    }

    export class Paddle implements Sprite{
        public speed = 90;

        constructor(public x, public y, public direction) {}

        box(){
            return new math.Box(new math.Point2D(this.x, this.y), 20, 60);
        }

        update(deltaT:number, direction:number) {
            return new Paddle(this.x, this.y += deltaT * direction * this.speed, 0)
        }

        draw(ctx: CanvasRenderingContext2D) {
            this.box().draw(ctx);
        }

        lines(){
            return this.box().lines()
        }

        static initialLeft(){
            return new Paddle(30, 200, 0);
        }

        static initialRight(){
            return new Paddle(770, 200, 0);
        }
    }

    export class LeftScore implements Error {
        constructor(public name: string, public message?: string) {        
        }

    }
    export class RightScore implements Error {
        constructor(public name: string, public message?: string) {        
        }
    }

    export class Ball implements Sprite {
        constructor(public x, public y, public velocityX, public velocityY) {}

        box(){
            return new math.Box(new math.Point2D(this.x, this.y), 20, 20);
        }

        static anyIntersection(a: math.Box, b: math.Box){
            return a.lines().reduce((p, al) => p || b.lines().reduce((h, bl) => {
                if (h)
                    return h;
                var i = bl.intersects(al);
                return i && i.length && i;
            }, false), false);
        }

        update(deltaT:number, leftPaddle: Paddle, rightPaddle: Paddle) {
            var box = this.box()
            if (this.x < 0)
                throw new RightScore('Score right');
            if (this.x > 800)
                throw new LeftScore('Score left');

            if (this.y < box.height/2 || this.y > 400 - box.height/2)
                this.velocityY = -this.velocityY;

            if (Ball.anyIntersection(box, leftPaddle.box()))
                this.velocityX = -this.velocityX * 1.1;

            if (Ball.anyIntersection(box, rightPaddle.box()))
                this.velocityX = -this.velocityX * 1.1;

            return new Ball(this.x + this.velocityX, this.y + this.velocityY, this.velocityX, this.velocityY);
        }

        draw(ctx:CanvasRenderingContext2D) {
            this.box().draw(ctx);
        }

        lines() {
            return this.box().lines();
        }

        static initial(direction:number=1) {
            return new Ball(400, 200, 5*direction, 5 - (Math.random() * 10));
        }
    }

    export class Game {
        leftPaddleKeys = [
            "W".charCodeAt(0),
            "S".charCodeAt(0)
        ];
        rightPaddleKeys = [
            38,
            40
        ]

        leftPaddleObservable = $(document.body).onAsObservable("keyup keydown")
            .filter(ke => this.leftPaddleKeys.indexOf(ke['keyCode']) != -1)
            .map(ke => {
                if(ke.type == 'keyup') return 0;
                if(ke['keyCode'] == this.leftPaddleKeys[0]) return 1;
                if(ke['keyCode'] == this.leftPaddleKeys[1]) return -1;
            });

        rightPaddleObservable = $(document.body).onAsObservable("keyup keydown")
            .filter(ke => this.rightPaddleKeys.indexOf(ke['keyCode']) != -1)
            .map(ke => {
                if(ke.type == 'keyup') return 0;
                if(ke['keyCode'] == this.rightPaddleKeys[0]) return 1;
                if(ke['keyCode'] == this.rightPaddleKeys[1]) return -1;
            });

        constructor(public ctx: CanvasRenderingContext2D) {
            ctx.fillStyle = 'white';
            var t = Rx.Observable.interval(1000/30, Rx.Scheduler.requestAnimationFrame);

            var timeEvents = t
                .map(
                    _ => ({ t: new Date().getTime() }) 
                ).scan(
                    { date: new Date().getTime(), dt: 0, event: null }, 
                    (prev, e) => { return { dt: (e.t - prev.date) / 1000, date: e.t, event: e }; }
                ).skip(1);

            var paddleEvents = timeEvents.withLatestFrom(
                    this.leftPaddleObservable.startWith(0), 
                    (t, dir) => ({dt: t.dt, left: dir})
                ).withLatestFrom(
                    this.rightPaddleObservable.startWith(0), 
                    (e, dir) => ({dt: e.dt, left: e.left, right: dir})
                );

            paddleEvents.scan(
                    { scoreLeft: 0, left: Paddle.initialLeft(), scoreRight: 0, right: Paddle.initialRight(), ball: Ball.initial() },
                    (state, e) => {
                        var left = 0, right = 0;
                        try {
                            var ball = state.ball.update(e.dt, state.left, state.right);
                        } catch (e) {
                            if (e instanceof RightScore){
                                var ball = Ball.initial(-1);
                                right = 1;
                            }
                            if (e instanceof LeftScore){
                                var ball = Ball.initial(1)
                                left = 1;
                            }
                        }

                        return {
                            scoreLeft: state.scoreLeft + left,
                            left: state.left.update(e.dt, e.left), 
                            scoreRight: state.scoreRight + right,
                            right: state.right.update(e.dt, e.right),
                            ball: ball
                        };
                    }
                ).subscribe(state => {
                    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                    state.left.draw(ctx);
                    state.right.draw(ctx);
                    state.ball.draw(ctx);

                    ctx.font = "50px silkscreennormal";
                    var leftText = state.scoreLeft.toString();
                    var rightText = state.scoreRight.toString();
                    ctx.fillText(leftText, ctx.canvas.width/2 - 40 - ctx.measureText(leftText).width, 65);
                    ctx.fillText(rightText, ctx.canvas.width/2 + 40, 65);
                });

            Ball.initial().draw(ctx);
        }

    }
}

Rx.config['longStackSupport'] = true;
Rx.Observable.just($("#pong").get(0)).take(1).subscribe(c => {
    var ctx: CanvasRenderingContext2D = (<HTMLCanvasElement>c).getContext("2d");
    var game = new Pong.Game(ctx);
});