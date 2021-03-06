/// <reference path="../../ts/jquery/jquery.d.ts" />
/// <reference path="../../ts/rx/rx.all.d.ts" />
/// <reference path="../../ts/rx-jquery/rx.jquery.d.ts" />
/// <reference path="../../ts/pullrequestmaterial.d.ts" />
var diameter = 15,
    screenW = 600,
    screenH = 450;

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
        return new Point2D(~~(Math.random()*screenW/diameter),~~(Math.random()*screenH/diameter));
    }

    public size = 1;
    belly(){
        var p = new Point2D(this.x, this.y);
        p.size = 1.4;
        return p;
    }
}

class State {
    constructor(public snake: Point2D[], public candy: Point2D[] = null, public status: GameState = GameState.loaded) {}
    static initial(): State {
        return new State(snakelet(~~(screenW/diameter/2),~~(screenH/diameter/2), 5), [Point2D.random()]);
    }
}

enum GameState {
    loaded = 0,
    running = 1,
    gameover = 2
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
    keyEvent = $(document.body).keydownAsObservable()
    
    start(canvas:HTMLCanvasElement): Rx.Observable<State> {
        var ctx = canvas.getContext("2d");
        var disposables = [];

        // Globally: disable up/down scrolling
        var d = $(document.body).keydownAsObservable()
            .filter(ke => ke.keyCode === KeyCodes.up || ke.keyCode === KeyCodes.down || ke.keyCode === 32)
            .subscribe(e => { e.preventDefault(); e.stopPropagation(); });
        disposables.push(d);

        var directions = this.keyEvent
            // Start with S
            //.filter(e => e.keyCode === 32).take(1).flatMap(_ => this.keyEvent)
            .filter(ke => !!KeyCodes[ke.keyCode])
            .do(e => { e.preventDefault(); e.stopPropagation(); })
            .map(ke => toDirection(ke.keyCode))
            .distinctUntilChanged(null, (a,b) => a[0] == b[0] || a[1] == b[1])
            .filter(d => d.length == 2)
            .startWith([]);

        var restart = this.keyEvent
            .filter(ke => ke.keyCode == 13).select(_ => true);

        var candySource = new Rx.Subject<number>();
        var candy = candySource
            .startWith(0)
            .select(_ => ~~(Math.pow(Math.random(),6)*4)+1)
            .select(Monster)
            .select(ps => { var origin = Point2D.random(); return ps.map(p => p.move([origin.x, origin.y])) })
            .select((m: Point2D[]) => {
                if(m.length == 1)
                    return Rx.Observable.just<Point2D[]>(m);
                // Timeout larger monsters
                return Rx.Observable.just<Point2D[]>(m)
                    .merge(Rx.Observable.just([]).delay(4000).selectMany(_ => Rx.Observable.throw<Point2D[]>(new Error("Timeout"))));
            })
            .switch()
            .retry()
            .replay(_ => _, 1);
        
        var windowState = $(window).onAsObservable("focus blur")
            .select(e => e.type).startWith("focus").replay(_ => _, 1)

        var game = Rx.Observable
            .interval(100)
            .withLatestFrom(windowState, (t, w) => [t, w]).filter(l => l[1] == 'focus').select(l => l[0])
            .withLatestFrom(directions, (t, d) => d)
            .withLatestFrom(candy, (d, c) => [d, c])
            .scan(State.initial(), (s: State, tuple) => eat(move(s,tuple[0]), tuple[1], candySource))
        
        disposables.push(candySource);

        return Rx.Observable.using(
            function() { return new Rx.CompositeDisposable(disposables); },
            function(resource) {
                return restart.startWith(true)
                    .select(_ => game)
                    .switch()
                    .tap(draw.bind(this, ctx))
            }
        );

    }
}

function snakelet(x: number, y: number, length: number = 5): Point2D[] {
    return Array.apply(null, {length: length}).map(_ => new Point2D(x,y));
}

function draw(ctx: CanvasRenderingContext2D, state: State){
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    state.snake.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x * diameter + diameter/2, p.y * diameter + diameter/2, diameter*p.size/2, 0, 2 * Math.PI, false);
        ctx.fillStyle = 'green';
        ctx.fill();
    });

    state.candy.forEach(p => {
        ctx.beginPath();
        if(state.candy.length == 1)
        ctx.arc(p.x * diameter + diameter/2, p.y * diameter + diameter/2, diameter/2, 0, 2 * Math.PI, false);
        else
        ctx.rect(p.x * diameter, p.y * diameter, diameter, diameter)
        ctx.fillStyle = 'orange';
        ctx.fill();
    });

    if(state.status == GameState.loaded){
        var help, m : TextMetrics;
        ctx.font = "40px Arial";
        help = "Press any arrow/wasd key";
        m = ctx.measureText(help);
        ctx.fillText(help, screenW / 2 - m.width / 2, screenH / 2);
        help = "to move";
        m = ctx.measureText(help);
        ctx.fillText(help, screenW / 2 - m.width / 2, screenH / 2 + 60);
    }

    if(state.status == GameState.gameover){
        ctx.font = "60px Arial";
        var m = ctx.measureText("GAME OVER");
        ctx.fillText("GAME OVER", screenW / 2 - m.width / 2, screenH / 2 - 30);
        ctx.font = "40px Arial";
        var m = ctx.measureText("Press enter to restart");
        ctx.fillText("Press enter to restart", screenW / 2 - m.width / 2, screenH / 2 + 20);
    }
}

function eat(state: State, candy: Point2D[], subject: Rx.Subject<number>): State {
    if(candy.map(p => state.snake[0].equals(p)).filter(_ => _).length){
        subject.onNext(0);
        return new State(
            [state.snake[0].belly()].concat(state.snake.slice(1).concat(afill(candy.length, _ => state.snake[state.snake.length-1]))), 
            [],
            state.status
        );
    }
    return new State(state.snake, candy, state.status);
}

function move(state: State, direction: number[]): State {
    if(state.status == GameState.running || state.status == GameState.loaded && direction.length != 0){
        // Move
        var newPos = state.snake[0].move(direction).loopRound(screenW/diameter,screenH/diameter);
        // Possibly die
        if(state.snake.slice(0, -1).reduce((p, c) => p || newPos.equals(c), false)){
            return new State(state.snake, state.candy, GameState.gameover);
        }
        // Moved state
        return new State(
            [newPos].concat(state.snake.slice(0, -1)), 
            state.candy,
            GameState.running
        );
    }
    return state;
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

function Monster(size: number): Point2D[] {
    var d = Math.ceil(Math.sqrt(size));
    return afill(size, _ => 1).concat(afill(d*d-size, _ => 0))
        .sort(_ => Math.random()-0.5 > 0)
        .map((v, i) => v ? new Point2D(~~(i / d), i % d) : null)
        .filter(_ => !!_);
}

function afill<T>(n: number, v: (number) => T){
    return Array.apply(null, new Array(n)).map((_, i: number) => v(i));
}

Reveal.forSlide(s => $(s.currentSlide).closest('#g-snake').get().length > 0, s => {
    console.log("Snake");
    var canvas = <HTMLCanvasElement> $("#snake").get(0);
    return new Snake().start(canvas);
}).subscribe(e => {});