/// <reference path="../../ts/rx/rx.all.d.ts" />
/// <reference path="../../ts/rx-jquery/rx.jquery.d.ts" />
/// <reference path="../../ts/rx.flatscan.ts" />
/// <reference path="../../ts/math.ts" />
/// <reference path="../../ts/rx.requestanimationframescheduler.ts" />
/// <reference path="../../ts/rx-reveal.ts" />
/// <reference path="Games.ts" />

// http://stackoverflow.com/questions/12926111/what-to-use-for-flow-free-like-game-random-level-creation
module Flow {

    interface Stage {
        draw(ctx: CanvasRenderingContext2D, game: Game): void;
        run(game: Game): Rx.Observable<Stage>;
    }

    class User {
        constructor(public id: string, public color: string) { }
    }

    function draw(i: Instance, ctx: CanvasRenderingContext2D){

    }

    class NormalStage implements Stage, Rx.Disposable {
        resources: Rx.Disposable[] = [];
       
        constructor(game: Game) {
                // var top = new Grid<Line>((x, y) => {
                //     var b = game.gridToCanvasPointPoint(x, y),
                //         c = game.gridToCanvasPointPoint(x + 1, y);
                //     var l = new Line(b, c, game.eventsFor('top', x, y), game);
                //     lines.push(l);
                //     return l;
                // });
        }

        draw(ctx: CanvasRenderingContext2D, game: Game) {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

            for (var x = 0; x <= game.cols; x++){
                ctx.beginPath();
                var a = game.gridToCanvasPoint(x, 0),
                    b = game.gridToCanvasPoint(x, game.rows);
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.stroke();
            }
            for (var y = 0; y <= game.rows; y++) {
                ctx.beginPath();
                var a = game.gridToCanvasPoint(0, y),
                    b = game.gridToCanvasPoint(game.cols, y);
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.stroke();
            }

            game.instance.flows.forEach((f,i) => {
                var l = String.fromCharCode("a".charCodeAt(0) + i);
                f.forEach((p,i) => {
                    var c = game.gridToCanvas(p.x + 0.5, p.y + 0.5);
                    var txt = "" + l + i;
                    ctx.fillText(txt, c.x - ctx.measureText(txt).width/2, c.y);        
                })
            })
            console.log(game.instance);

            // ctx.font = "18px Arial";
            // ctx.fillText("" + this.points, 25, 30);
            // var txt = "" + (rounds - this.turnsRemaining) + "/" + rounds;
            // ctx.fillText(txt, ctx.canvas.width - ctx.measureText(txt).width - 25, 30);
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

    class Instance {
        constructor(public flows: math.Point2D[][]){}

        static simple(w: number, h: number, n_flows: number): Instance {
            var perflow = (w * h / n_flows);
            var flow = [];
            var flows = [flow];
            var totalflows = 1;

            // For every cell
            for (var i = 0, x = 0, y = 0; i < w * h; i++) {
                // When over 'flowing', pun intended
                if (i >= flows.length * perflow){
                    flow = [];
                    flows.push(flow);
                }
                flow.push(new math.Point2D(x, y));
                // Increase
                x += y % 2 == 0 ? 1 : -1;
                if (x < 0 || x >= w){
                    y += 1;
                    x = Math.min(w - 1, Math.max(0, x));
                }
            }

            return new Instance(flows);
        }
    }

    class Start extends NormalStage {
        constructor(game: Game) {
            super(game);
        }
        draw(ctx: CanvasRenderingContext2D, game: Game) {
            super.draw(ctx, game);

            // var txt = "connect the two dots to start";
            // ctx.font = "18px Arial";
            // ctx.fillText(txt, ctx.canvas.width / 2 - ctx.measureText(txt).width / 2, ctx.canvas.height / 2 + 100);
        }
    }

    class ScoreStage implements Stage {
        constructor(public points: number) { }
        draw(ctx: CanvasRenderingContext2D, game: Game) {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            var txt = "You scored " + this.points + " points!";
            ctx.font = "24px Arial";
            ctx.fillText(txt, ctx.canvas.width / 2 - ctx.measureText(txt).width / 2, ctx.canvas.height / 2);

            txt = "Click to restart";
            ctx.font = "18px Arial";
            ctx.fillText(txt, ctx.canvas.width / 2 - ctx.measureText(txt).width / 2, ctx.canvas.height / 2 + 100);
        }
        run(game: Game) {
            return Rx.Observable.just(new Start(game));
        }
    }

    export class Game extends games.GridMapping {
        public level: number = 0;

        public gridSize: number = 0;
        public user = new User("id", "red");
        public users = [this.user, new User("id", "blue")];

        public instance = Instance.simple(this.cols, this.rows, this.cols-1);
        constructor(public ctx: CanvasRenderingContext2D) {
            super(5, 5, [ctx.canvas.width, ctx.canvas.height]);
            this.gridSize = this.gridH;
        }
 
        run() {
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
                originalEvent: null,
                type: e.type
            };
        });

        // All distinct positions the mouse visits
        public hoovers = this.mouse.distinctUntilChanged(e => e.position);
        // Ends hoovers if another hoover on a different element occurs.
        public hooverInOut = this.hoovers.filter(e => e.type == 'mousemove').flatMap(h => {
            return Rx.Observable.just(h).concat(this.hoovers.filter(h2 => {
                return h.position.x != h2.position.x || h.position.y != h2.position.y || h.position['border'] != h2.position['border'];
            }).take(1).map(_ => ({
                position: h.position,
                type: "mouseout",
                originalEvent: _.originalEvent
            })));
        });

        public dots = Rx.Observable.merge(
            this.mouse.filter(m => m.type == 'mousedown' || m.type == 'mouseup'),
            this.hooverInOut
            );
    }
}

Reveal.forSlide(s => s.currentSlide.id == 'g-flow', s => {
    var canvas = <HTMLCanvasElement> $("#flow", s.currentSlide).get(0);
    return new Flow.Game(canvas.getContext("2d")).run();
}).subscribe(e => {
    console.log("Loaded Flow");
});