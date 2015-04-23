/// <reference path="../../ts/rx/rx.all.d.ts" />
/// <reference path="../../ts/rx-jquery/rx.jquery.d.ts" />
/// <reference path="../../ts/rx.flatscan.ts" />
/// <reference path="../../ts/math.ts" />
/// <reference path="../../ts/rx.requestanimationframescheduler.ts" />
/// <reference path="../../ts/rx-reveal.ts" />
/// <reference path="../../Flow/src/Games.ts" />

module Minesweeper {

    interface Stage {
        draw(ctx: CanvasRenderingContext2D, game: Game): void;
        run(game: Game): Rx.Observable<Stage>;
    }

    class Box extends math.Box {
        public neighbors: Box[] = [];
        revealed = false;
        flagged = false;

        private revealer = new Rx.BehaviorSubject<boolean>(null);
        public Reveal: Rx.Observable<boolean> = this.revealer.filter(_ => _ != null).take(1);

        is_bomb = false;
        events:Rx.Observable<games.MouseEvt> = null

        constructor(centre: math.Point2D, size: number, events, private ctx: CanvasRenderingContext2D) {
            super(centre, size, size);
            this.events = events;

            events.subscribe(ev => {
                if(ev.originalEvent.which === 3)
                    this.toggleFlag();
                else 
                    this.reveal();
                this.draw(ctx)
            })
        }

        toggleFlag() {
            if (!this.revealed)
                this.flagged = !this.flagged;
        }

        reveal() {
            if (this.flagged) return true;
            if (!this.revealed){
                this.revealed = true;
                if (!this.is_bomb)
                    this.revealer.onNext(this.neighbors.filter(n => n.is_bomb).length == 0);
            }
            return true
        }

        initialize() {
            this.is_bomb = Math.random() < .1;
            Rx.Observable.merge(
                    this.neighbors.map(_ => _.Reveal)
                ).filter(
                    x => x
                ).subscribe(
                    _ => this.reveal() && this.draw(this.ctx)
                )
        }

        addNeighbour(neighbor:Box) {
            this.neighbors.push(neighbor);
            neighbor.neighbors.push(this);
        }

        draw(ctx: CanvasRenderingContext2D) {
            if (this.revealed) {
                if(this.is_bomb)
                    ctx.fillStyle = "red";
                else 
                    ctx.fillStyle = "#ccc";

                super.draw(ctx, false, false);
                if (this.is_bomb) {
                    this.fillText(ctx, String.fromCharCode(0xf1e2), "black", "FontAwesome")
                }
                if (!this.is_bomb) {
                    var neighbor_bombs = this.neighbors.filter(n => n.is_bomb).length
                    if (neighbor_bombs > 0) {
                        this.fillText(ctx, neighbor_bombs.toString(), "blue", "Arial")
                    }
                }
            } else {
                ctx.fillStyle = "white";
                super.draw(ctx, false, false);

                if (this.flagged){
                    this.fillText(ctx, String.fromCharCode(0xf024), "green", "FontAwesome")
                }
            }            

            ctx.save();
            ctx.strokeStyle = "black";
            this.lines().forEach(l => {
                ctx.beginPath();
                ctx.moveTo(l._0.x, l._0.y);
                ctx.lineTo(l._1.x, l._1.y);
                ctx.stroke();
            })
            ctx.restore();
        }

        fillText(ctx:CanvasRenderingContext2D, text:string, color:string, font:string) {
            ctx.font = this.height-4 + "px " + font;
            ctx.fillStyle = color;
            ctx.fillText(text, this.centre.x - ctx.measureText(text).width/2, this.centre.y + this.height/2 - 4);
        }
    }

    class NormalStage implements Stage, Rx.Disposable {
        resources: Rx.Disposable[] = [];

        constructor(public points: number, public boxes: Box[], game: Game) {
            if(!boxes.length){
                var boxGrid = new games.Grid<Box>((x, y) => {
                    var b = new Box(game.gridToCanvasPoint(x + .5, y + .5), game.gridSize, game.eventsFor('box', x, y), game.ctx)
                    boxes.push(b);
                    return b;
                });

                for (var i = 0, x = 0, y = 0; y < game.rows; i++ , x = (x + 1) % game.cols, y = x == 0 ? y + 1 : y) {
                    var b = boxGrid.get(x, y);
                    if (x > 0) b.addNeighbour(boxGrid.get(x-1, y))
                    if (y > 0) b.addNeighbour(boxGrid.get(x, y-1))
                    if (x > 0 && y > 0) b.addNeighbour(boxGrid.get(x-1, y-1))
                    if (x > 0 && y < game.rows - 1) b.addNeighbour(boxGrid.get(x-1, y+1))
                }

                for (var i = 0, x = 0, y = 0; y < game.rows; i++ , x = (x + 1) % game.cols, y = x == 0 ? y + 1 : y) {
                    boxGrid.get(x, y).initialize();
                }
            }

            this.resources.push(Rx.Observable.merge(boxes.map(_ => _.events)).subscribe(e=> e))
        }

        draw(ctx: CanvasRenderingContext2D, game: Game) {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

            // ctx.font = "18px Arial";
            // ctx.fillText("" + this.points, 25, 30);
            // var txt = "" + (rounds - this.turnsRemaining) + "/" + rounds;
            // ctx.fillText(txt, ctx.canvas.width - ctx.measureText(txt).width - 25, 30);
            this.boxes.forEach(b => b.draw(ctx));
        }

        run(game: Game) {
            return Rx.Observable.using(
                () => this,
                (resources) => {
                    return Rx.Observable.never<Stage>();
                }
            );
        }

        dispose() {
            this.resources.forEach(r => r.dispose());
        }
    }

    class Start extends NormalStage {
        constructor(game: Game) {
            super(0, [], game);
            //super(0, 0, [new Sprite(0,3,0),new Sprite(1,3,0),new Sprite(2,3,0),new Sprite(3,3,0),new Sprite(4,3,0),new Sprite(5,3,0)]);
        }
        draw(ctx: CanvasRenderingContext2D, game: Game) {
            super.draw(ctx, game);

            // var txt = "connect the two dots to start";
            // ctx.font = "18px Arial";
            // ctx.fillText(txt, ctx.canvas.width / 2 - ctx.measureText(txt).width / 2, ctx.canvas.height / 2 + 100);
        }
    }

    export class Game extends games.GridMapping {
        public level: number = 0;

        public gridSize: number;

        constructor(public ctx: CanvasRenderingContext2D) {
            super(12, 12, [ctx.canvas.width, ctx.canvas.height]);
            this.gridSize = this.gridW;
        }

        /* The mouse events one Line needs */
        eventsFor(type, x, y) {
            return this.dots.filter((e: games.MouseEvt) => {
                return Math.floor(e.position.x) == x && Math.floor(e.position.y) == y;
            });
        }

        run(){
            return Rx.Observable.just(new Start(this))
                .flatScan<Stage, Stage>(
                    s => { s.draw(this.ctx, this); return s.run(this).doAction(_ => _.draw(this.ctx, this)).last() },
                    s => Rx.Observable.just(s)
                )
                .tap(
                    s => s.draw(this.ctx, this),
                    e => console.error(e),
                    () => console.log("Completed game")
                );
        }

        // Mouse events
        static getMousePos(canvas, evt) {
            var rect = canvas.getBoundingClientRect();
            return {
                x: evt.clientX - rect.left,
                y: evt.clientY - rect.top
            };
        }

        // Observable of Grid movements, emits grid coordinates
        public mouse = $(this.ctx.canvas).onAsObservable("mousemove mousedown mouseup")
            .map(e => {
                var p = Game.getMousePos(e.target, e);
                return {
                    position: this.canvasToGrid(p.x, p.y),
                    originalEvent: e,
                    type: e.type
                };
            });

        public dots = this.mouse.filter(m => m.type == 'mousedown');
    }
}

Reveal.forSlide(s => s.currentSlide.id == 'g-minesweeper', s => {
    var canvas = <HTMLCanvasElement> $("#minesweeper", s.currentSlide).get(0);
    return new Minesweeper.Game(canvas.getContext("2d")).run();
}).subscribe(e => {
    console.log("Loaded Minesweeper");
});