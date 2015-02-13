/// <reference path="../ts/jquery/jquery.d.ts" />
/// <reference path="../ts/rx/rx.all.d.ts" />
/// <reference path="../ts/rx-jquery/rx.jquery.d.ts" />
var diameter = 20;

interface Game {
    start(canvas: HTMLCanvasElement): void
}

class Point2D {
    constructor(public x: number, public y: number) {}
    move(dir: number[]): Point2D {
        return new Point2D(this.x + dir[0], this.y + dir[1]);
    }
    loopRound(w: number, h: number): Point2D {
        return new Point2D((this.x + w) % w, (this.y + h) % h);
    }
    equals(other: Point2D){
        return this.x == other.x && this.y == other.y;
    }
    static random(){
        return new Point2D(~~(Math.random()*800/diameter),~~(Math.random()*600/diameter));
    }
}

class State {
    constructor(public snake: Point2D[], public candy: Point2D = null) {}
}

enum KeyCodes {
    up = 38,
    down = 40,
    left = 37,
    right = 39,
    w = "W".charCodeAt(0),
    s = "S".charCodeAt(0),
    a = "A".charCodeAt(0),
    d = "D".charCodeAt(0)
}

class Snake implements Game {
    keyEvent = $(document.body).keyupAsObservable()

    start(canvas:HTMLCanvasElement):void {
        var ctx = canvas.getContext("2d");

        var directions = this.keyEvent.filter(ke => !!KeyCodes[ke.keyCode]).map(ke => toDirection(ke.keyCode)).filter(d => d.length == 2);

        Rx.Observable
            .interval(100)
            .combineLatest(directions, (t, d) => [t, d])
            .distinctUntilChanged(t => t[0])
            .map(t => t[1])
            .scan(new State([new Point2D(0,0)], Point2D.random()), (s: State, d: number[]) => eat(move(s,d)))
            .subscribe(draw.bind(this, ctx));
    }

}

function draw(ctx: CanvasRenderingContext2D, state: State){
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    state.snake.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x * diameter + diameter/2, p.y * diameter + diameter/2, diameter/2, 0, 2 * Math.PI, false);
        ctx.fillStyle = 'green';
        ctx.fill();
    });

    var p = state.candy;
    ctx.beginPath();
    ctx.arc(p.x * diameter + diameter/2, p.y * diameter + diameter/2, diameter/2, 0, 2 * Math.PI, false);
    ctx.fillStyle = 'orange';
    ctx.fill();
}

function eat(state: State): State {
    if(state.snake[0].equals(state.candy)){
        console.log("Eaten!");
        return new State(
            state.snake.concat(state.snake[state.snake.length-1]), 
            Point2D.random()
        );
    }
    return state;
}

function move(state: State, direction: number[]): State {
    return new State([state.snake[0].move(direction).loopRound(800/diameter,600/diameter)].concat(state.snake.slice(0, -1)), state.candy);
}

function toDirection(keyCode: number){
    switch(keyCode){
        case KeyCodes.w:
        case KeyCodes.up: return [0,-1];
        case KeyCodes.s:
        case KeyCodes.down: return [0,1];
        case KeyCodes.a:
        case KeyCodes.left: return [-1,0];
        case KeyCodes.d:
        case KeyCodes.right: return [1,0];
        default: return [];
    }
}

new Snake().start(<HTMLCanvasElement>document.getElementsByTagName("canvas")[0])