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

    var originalColors = ["#629E60", "#E9C03A", "#B74133", "#5374ED"];
    var colors = ["#1F00FF", "#D10000", "#EDEF00", "#4F8000", "#9FFFFF", "#D57C00", "#D200FF", "#87302A", "#65007A"];

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
        constructor(private game: Game, public i: number = 0/*, public k: number = 4, public seed: number = 0*/) {
            console.debug("Instantiated Stage", i);
//            this.instance = Instance.simple(game.cols, game.rows, k).permutate(seed);
            this.instance = game.instance(game.cols);
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
            if (false) {
                this.instance.flows.forEach((f, i) => {
                    var l = String.fromCharCode("a".charCodeAt(0) + i);
                    f.forEach((p, i) => {
                        var c = game.gridToCanvas(p.x + 0.5, p.y + 0.5);
                        var txt = "" + l + i;
                        ctx.fillText(txt, c.x - ctx.measureText(txt).width / 2, c.y);
                    })
                });
            }

        }

        dragSequence(game: Game, start: math.XY): Rx.Observable<{ good: boolean; flow: Flow; uf: Instance; }> {
            // The new flow
            var uf = this.userFlows;
            var flow: Flow = { index: this.instance.flowIndex(start), ps: [start] };
            uf = this.userFlows.with(flow);

            var subsequent: Rx.Observable<math.XY> = game.tiles
                .takeWhile(e => e.type == "mousemove")
                .distinctUntilChanged()
                .takeUntil(game.tiles.filter(e => e.type == "mouseup"));

            return subsequent.scan({ good: false, flow: flow, uf: uf }, (acc, box) => {
                var ps = acc.flow.ps;
                var dup = games.Utils.indexOf(ps, Instance.equals.bind(Instance, box));
                
                // Short-wired
                if (typeof dup === 'number') {
                    var flow = {
                        ps: ps.slice(0, dup+1),
                        index: acc.flow.index
                    }
                    return { good: false, flow: flow, uf: acc.uf.with(flow) };
                }
                // Normal new cell: add
                if (!acc.good && this.adjacent(ps[ps.length - 1], box) && !acc.uf.contains(box) && (!this.instance.isStartOrEnd(box) || this.instance.flowIndex(box) === acc.flow.index)) {
                    var flow = {
                        ps: ps.concat(box),
                        index: acc.flow.index
                    }
                    var isFinalised = this.instance.isStartOrEnd(box) && this.instance.flowIndex(box) === acc.flow.index;
                    return { good: isFinalised, flow: flow, uf: acc.uf.with(flow) };
                }
                // Fail!
                return { good: acc.good, flow: acc.flow, uf: acc.uf };
            });
        }

        run(game: Game): Rx.Observable<Stage> {
            var states = game.tiles.filter(e => e.type == "mousedown")
                .filter(start => this.instance.isStartOrEnd(start))
                .flatMap(start => {
                    var messingWith = this.instance.flowIndex(start);
                    var onFail = this.with(this.userFlows.with({ ps: [], index: messingWith }));
                    return this.dragSequence(game, start)
                        .tap(s => this.draw(game.ctx, game, s.flow))
                        .skipWhile(s => !s.good)
                        .last()
                        .map(state => this.with(state.uf))
                        .catch(Rx.Observable.just(onFail))
                }).take(1);
            return states;
        }

        with(userFlows: Instance){
            var s = new NormalStage(this.game, this.i + 1);
            s.instance = this.instance;
            s.userFlows = userFlows;
            return s;        
        }

        adjacent(p1: math.XY, p2: math.XY): boolean {
            return p1.x == p2.x && Math.abs(p1.y - p2.y) == 1
                || p1.y == p2.y && Math.abs(p1.x - p2.x) == 1;
        }
    }

    export class Start extends NormalStage {
        private args;
        constructor(game: Game, ...args: any[]) {
            super(game, args[0]/*, args[1], args[2]*/);
            this.args = args;
        }
        draw(ctx: CanvasRenderingContext2D, game: Game) {
//            console.warn("THOU SHALL NOT PASS!! (you need the third argument often)");
//            super.draw(ctx, game);

            // var txt = "connect the two dots to start";
            // ctx.font = "18px Arial";
            // ctx.fillText(txt, ctx.canvas.width / 2 - ctx.measureText(txt).width / 2, ctx.canvas.height / 2 + 100);
        }
        run(game: Game){
            return Rx.Observable.just(new NormalStage(game, this.args[0]/*, this.args[1], this.args[2]*/));
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

var data = $.getAsObservable<string>("Flow/flows.txt", null, 'text').map(l => l.data).shareReplay(1);

Reveal.forSlide(s => s.currentSlide.id == 'g-flow', s => {
    var canvas = <HTMLCanvasElement> $("#flow", s.currentSlide).get(0);
    
    var strField = (key: string) => $(key).onAsObservable("change").map(e => e.target['value']).startWith($(key).val());
    var numField = (key: string) => strField(key).map(v => parseInt(v));
    
    return Rx.Observable.combineLatest(
        data,
        numField("#flow-n"),
        //numField("#flow-k"),
        //strField("#flow-seed").map(s => s.split("").map(c => c.charCodeAt(0)).reduce((s,a) => s+a, 0)),
        (d, n/*, k, s*/) => ({ n: n/*, k: k, seed: s*/, data: d })
    ).flatMap(o => {
        console.log(o);
        canvas.height = 40 * o.n;
        canvas.width = 40 * o.n;
        var g = new Flow.Game(canvas.getContext("2d"), o.n);
        g.data = o.data;
        return g.run(new Flow.Start(g));
    });
}).subscribe(e => {});