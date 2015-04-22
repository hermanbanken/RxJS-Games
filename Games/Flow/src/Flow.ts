/// <reference path="../../ts/rx/rx.all.d.ts" />
/// <reference path="../../ts/rx-jquery/rx.jquery.d.ts" />
/// <reference path="../../ts/rx.flatscan.ts" />
/// <reference path="../../ts/math.ts" />
/// <reference path="../../ts/rx.requestanimationframescheduler.ts" />
/// <reference path="../../ts/rx-reveal.ts" />
/// <reference path="Games.ts" />
/// <reference path="Instance.ts" />

// http://stackoverflow.com/questions/12926111/what-to-use-for-flow-free-like-game-random-level-creation
module Flow {

    var colors = ["#629E60", "#E9C03A", "#B74133", "#5374ED"];

    function drawCircle(ctx: CanvasRenderingContext2D, r: number, p: math.XY) {
        ctx.beginPath();
        ctx.arc(p.x + r, p.y + r, r, 0, 2 * Math.PI, false);
        ctx.fill();
    }

    function drawLine(ctx, l: math.Line2D){
        ctx.beginPath();
        ctx.moveTo(l._0.x, l._0.y);
        ctx.lineTo(l._1.x, l._1.y);
        ctx.stroke();
    }

    class NormalStage {
        resources: Rx.Disposable[] = [];
        public instance;
        public userFlows;
        constructor(game: Game) {
            this.instance = Instance.simple(game.cols, game.rows, game.cols - 1);
            this.userFlows = new Instance([]);
        }

        draw(ctx: CanvasRenderingContext2D, game: Game, inProgress?: Flow) {
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

            // Ends
            ctx.save();
            ctx.translate(game.gridW * .1, game.gridH * .1);
            this.instance.flows.forEach((f, i) => {
                ctx.fillStyle = colors[i % colors.length];
                var p_a: math.XY = game.gridToCanvasPoint(f[0]),
                    p_b: math.XY = game.gridToCanvasPoint(f[f.length - 1]);
                // Begin / end circles:
                drawCircle(ctx, game.gridH / 2 * .8, p_a);
                drawCircle(ctx, game.gridH / 2 * .8, p_b);
            });
            ctx.restore();

            // Lines
            ctx.save();
            ctx.translate(game.gridW * .5, game.gridH * .5);
            if(inProgress)
            console.log("Drawing, userflows.length = ", this.userFlows.with(inProgress).flows.length, inProgress.index);
            else 
            console.warn("No progress")
            this.userFlows.with(inProgress).flows.forEach((f, i) => {
                ctx.strokeStyle = colors[i % colors.length];
                ctx.fillStyle = colors[i % colors.length];
                ctx.lineWidth = game.gridH / 3;
                
                for (var j = 1; j < f.length; j++){
                    var p_a = game.gridToCanvasPoint(f[j - 1]),
                        p_b = game.gridToCanvasPoint(f[j]);
                    // Line between points:
                    drawLine(ctx, new math.Line2D(p_a, p_b));
                    // Rounded corner:
                    ctx.translate(-game.gridW / 6, -game.gridH / 6);
                    drawCircle(ctx, game.gridH / 2 / 3, p_b);
                    ctx.translate(game.gridW / 6, game.gridH / 6);
                }
            });
            ctx.restore();

            // Draw instance;
            this.instance.flows.forEach((f, i) => {
                var l = String.fromCharCode("a".charCodeAt(0) + i);
                f.forEach((p, i) => {
                    var c = game.gridToCanvas(p.x + 0.5, p.y + 0.5);
                    var txt = "" + l + i;
                    ctx.fillText(txt, c.x - ctx.measureText(txt).width / 2, c.y);
                })
            });

        }

        dragSequence(game: Game, start: math.XY): Rx.Observable<{ good: boolean; flow: Flow; uf: Instance; }> {
            console.log("Down", start);
            // The new flow
            var uf = this.userFlows;
            var flow: Flow = { index: this.instance.flowIndex(start), ps: [start] };
            uf = this.userFlows.with(flow);

            var subsequent: Rx.Observable<math.XY> = game.tiles
                .tap(m => console.log("move", m))
                .takeWhile(e => e.type == "mousemove")
                .distinctUntilChanged()
                .takeUntil(game.tiles.filter(e => e.type == "mouseup"));

            return subsequent.scan({ good: false, flow: flow, uf: uf }, (acc, box) => {
                console.log("SCAN");
                var ps = acc.flow.ps;
                if (this.adjacent(ps[ps.length - 1], box) && !acc.uf.contains(box)) {
                    var flow = {
                        ps: ps.concat(box),
                        index: acc.flow.index
                    }
                    var isFinalised = this.instance.isStartOrEnd(box) && this.instance.flowIndex(box) === acc.flow.index;
                    return {
                        good: isFinalised,
                        flow: flow,
                        uf: acc.uf.with(flow)
                    };
                }
                return { good: false, flow: acc.flow, uf: acc.uf };
            });
        }

        run(game: Game): Rx.Observable<Stage> {
            console.log("NORMAL");
            var states = game.tiles.filter(e => e.type == "mousedown")
                .map(start => 
                    this.dragSequence(game, start)
                        .tap(s => {
                            console.log("DS: ",s.flow.ps.length, s.flow);
                            this.draw(game.ctx, game, s.flow)
                        }, e => console.error("DS error: ",e), () => console.warn("DS ended"))
                        .skipWhile(s => !s.good).last()
                )
                .switch()
                .map(state => {
                    console.log("Resulting state: ", state);
                    var s = new NormalStage(game);
                    s.instance = this.instance;
                    s.userFlows = state.uf;
                    return s;
                });
            return states;
//            return Rx.Observable.never<Stage>();
        }

        adjacent(p1: math.XY, p2: math.XY): boolean {
            return p1.x == p2.x && Math.abs(p1.y - p2.y) == 1
                || p1.y == p2.y && Math.abs(p1.x - p2.x) == 1;
        }
    }

    export class Start extends NormalStage {
        constructor(game: Game) {
            super(game);
        }
        draw(ctx: CanvasRenderingContext2D, game: Game) {
//            console.warn("THOU SHALL NOT PASS!! (you need the third argument often)");
//            super.draw(ctx, game);

            // var txt = "connect the two dots to start";
            // ctx.font = "18px Arial";
            // ctx.fillText(txt, ctx.canvas.width / 2 - ctx.measureText(txt).width / 2, ctx.canvas.height / 2 + 100);
        }
        run(game: Game){
            return Rx.Observable.just(new NormalStage(game));
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
        run(game: Game): Rx.Observable<Stage> {
            return Rx.Observable.just(new Start(game));
        }
    }
}

Reveal.forSlide(s => s.currentSlide.id == 'g-flow', s => {
    var canvas = <HTMLCanvasElement> $("#flow", s.currentSlide).get(0);
    var g = new Flow.Game(canvas.getContext("2d"));
    return g.run(new Flow.Start(g));
}).subscribe(e => {
    console.log("Loaded Flow");
});