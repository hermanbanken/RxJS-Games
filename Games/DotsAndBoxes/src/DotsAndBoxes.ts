/// <reference path="../../ts/rx/rx.all.d.ts" />
/// <reference path="../../ts/rx-jquery/rx.jquery.d.ts" />
/// <reference path="../../ts/rx.flatscan.ts" />
/// <reference path="../../ts/math.ts" />
/// <reference path="../../ts/rx.requestanimationframescheduler.ts" />

module DotsAndBoxes {

    var colors = ["#629E60", "#E9C03A", "#B74133", "#5374ED"];
    var rounds = 20;

    interface Stage {
        draw(ctx: CanvasRenderingContext2D, game: Game): void;
        run(game: Game): Rx.Observable<Stage>;
    }

    class User {
        constructor(public id: string, public color: string) {}
    }

    class Box extends math.Box {
        public Owner: Rx.Observable<User>;
        constructor(centre: math.Point2D, size: number, lines: Line[], ctx: CanvasRenderingContext2D) {
            super(centre, size, size);
            this.Owner = Rx.Observable.merge(lines.map(_ => _.Owner)).skip(3).take(1);
            this.Owner.subscribe(this.draw.bind(this, ctx));
        }
        draw(ctx: CanvasRenderingContext2D, user: any) {
            if (user instanceof User){
            }
            else {
            }
            ctx.fillStyle = user && user.color || "blue";
            super.draw(ctx, false, false);
        }
    }

    class Line extends math.Line2D {
        gridSize: number;
        constructor(a: math.Point2D, b: math.Point2D, events: Rx.Observable<MouseEvt>, game: Game) {
            super(a, b);
            this.gridSize = this.size();

            events
                .map(e => {
                    var u = new User("id", "red");
                    if (e.type == 'mousemove')
                        this.draw(game.ctx, u);
                    if (e.type == 'mouseout')
                        this.draw(game.ctx, false);
                    return e.type == 'mousedown' ? u : null;
                })
                .filter(_ => _ != null)
                .subscribe(u => { 
                    this.owned = true;
                    console.log("DOWN!");
                    this.owner.onNext(u);
                });
        }

        private owned = false;
        private owner = new Rx.BehaviorSubject<User>(null);
        public Owner: Rx.Observable<User> = this.owner.filter(_ => _ != null).take(1);

        draw(ctx: CanvasRenderingContext2D, user: any) 
        {
            if (this.owned || user instanceof User)
                ctx.fillStyle = "gray";
            else
                ctx.globalCompositeOperation = "destination-out";

            var c = this.gridSize / 10;

            ctx.beginPath();
            ctx.moveTo(this._0.x, this._0.y);
            if (this._0.y == this._1.y) {
                ctx.lineTo(this._0.x + c, this._0.y + c);
                ctx.lineTo(this._1.x - c, this._1.y + c);
                ctx.lineTo(this._1.x, this._1.y);
                ctx.lineTo(this._1.x - c, this._1.y - c);
                ctx.lineTo(this._0.x + c, this._0.y - c);
            } else {
                ctx.lineTo(this._0.x + c, this._0.y - c);
                ctx.lineTo(this._1.x + c, this._1.y + c);
                ctx.lineTo(this._1.x, this._1.y);
                ctx.lineTo(this._1.x - c, this._1.y + c);
                ctx.lineTo(this._0.x - c, this._0.y - c);
            }
            ctx.lineTo(this._0.x, this._0.y);
            ctx.fill();
            ctx.globalCompositeOperation = "source-over";
        }
    }

    class Grid<T> {
        store: T[][] = [];
        constructor(public generate: ((x:number,y:number) => T)){}
        get(x: number, y: number){
            if (!this.store[x])
                this.store[x] = [];
            if (!this.store[x][y])
                this.store[x][y] = this.generate(x, y);
            return this.store[x][y];
        }
    }

    class NormalStage implements Stage {
        constructor(public points: number, public lines: Line[], public boxes: Box[], game: Game) {
            if(!lines.length || !boxes.length){
                var top = new Grid<Line>((x, y) => {
                    var b = game.gridXYtoCanvasPoint(x, y),
                        c = game.gridXYtoCanvasPoint(x + 1, y);
                    var l = new Line(b, c, game.dots.filter(NormalStage.lineMatches('top', x, y)), game);
                    lines.push(l);
                    return l;
                });
                var left = new Grid<Line>((x, y) => {
                    var a = game.gridXYtoCanvasPoint(x, y + 1),
                        b = game.gridXYtoCanvasPoint(x, y);
                    var l = new Line(a, b, game.dots.filter(NormalStage.lineMatches('left', x, y)), game);
                    lines.push(l);
                    return l;
                });
                for (var i = 0, x = 0, y = 0; y < game.rows; i++ , x = (x + 1) % game.cols, y = x == 0 ? y + 1 : y) {
                    boxes.push(new Box(
                        game.gridXYtoCanvasPoint(x + 0.5, y + 0.5), 
                        game.gridSize * 8 / 10, [
                            top.get(x, y),
                            top.get(x, y + 1),
                            left.get(x, y),
                            left.get(x + 1, y)
                        ], game.ctx
                    ));
                }
            }
        }

        static lineMatches(type, x, y){
            return (e: MouseEvt) => {
                return e.position['border'] && e.position['border'] == type && e.position.x == x && e.position.y == y;
            }
        }

        draw(ctx: CanvasRenderingContext2D, game: Game) {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

            // ctx.font = "18px Arial";
            // ctx.fillText("" + this.points, 25, 30);
            // var txt = "" + (rounds - this.turnsRemaining) + "/" + rounds;
            // ctx.fillText(txt, ctx.canvas.width - ctx.measureText(txt).width - 25, 30);

            this.lines.forEach(l => l.draw(ctx, true));
            this.boxes.forEach(b => b.draw(ctx, true));
        }

        run(game: Game) {
            return Rx.Observable.never<Stage>();
        }
    }

    class Start extends NormalStage {
        constructor(game: Game) {
            super(0, [], [], game);
            //super(0, 0, [new Sprite(0,3,0),new Sprite(1,3,0),new Sprite(2,3,0),new Sprite(3,3,0),new Sprite(4,3,0),new Sprite(5,3,0)]);
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
            return game.up.take(1).map(_ => new Start(game));
        }
    }

    interface MouseEvt {
        position: MouseOnBorder | MouseInGrid;
        originalEvent: BaseJQueryEventObject;
        type: string;
    }

    interface MouseOnBorder {
        x: number; y: number; border: string;
    }
    interface MouseInGrid {
        x: number; y: number; inGrid: boolean;
    }

    export class Game {
        public level: number = 0;

        public cols: number = 0;
        public rows: number = 0;
        public gridSize: number = 0;
        public marginTop: number = 5;
        public marginLeft: number = 5;

        canvasXYtoGridXY(cx, cy): MouseOnBorder | MouseInGrid {
            cx -= this.marginLeft;
            cy -= this.marginTop;
            cx /= this.gridSize;
            cy /= this.gridSize;

            var border = [
                {o: Math.abs(cx - Math.round(cx)), b:'left'},
                {o: Math.abs(cy - Math.round(cy)), b:'top'}
            ].sort((a, b) => a.o - b.o)[0];

            if (border.o < 1/8){
                return {
                    x: Math.floor(cx+1/8),
                    y: Math.floor(cy+1/8),
                    border: border.b
                }
            } 
            else {
                return {
                    x: ~~cx,
                    y: ~~cy,
                    inGrid: true
                };               
            }
        }

        gridXYtoCanvas(gx, gy) {
            return { 
                x: /*this.gridSize + 2 **/ this.gridSize * gx + this.marginLeft,
                y: /*this.gridSize + 2 **/ this.gridSize * gy + this.marginTop
            };
        }

        gridXYtoCanvasPoint(gx, gy) {
            var c = this.gridXYtoCanvas(gx, gy);
            return new math.Point2D(c.x, c.y);
        }

        constructor(public ctx: CanvasRenderingContext2D) {

            this.cols = 4;
            this.rows = 4;

            this.gridSize = (ctx.canvas.width - 2*this.marginLeft) / (this.rows);

            Rx.Observable
                .just(new Start(this))
                .flatScan<Stage, Stage>(
                s => { s.draw(this.ctx, this); return s.run(this).doAction(_ => _.draw(this.ctx, this)).last() },
                s => Rx.Observable.just(s)
                )
                .subscribe(
                s => s.draw(this.ctx, this),
                e => console.error(e),
                () => console.log("Completed game")
                );
        }

        // Mouse events
        public down = $(this.ctx.canvas).onAsObservable("mousedown");
        public up = $(window).onAsObservable("mouseup");

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
                    position: this.canvasXYtoGridXY(p.x, p.y),
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
        // this.mouse
        //     .distinctUntilChanged()
        //     .scan([], (l, d) => {
        //         // Add in mouse out events
        //         if (l[0] && l[0].type == 'mousemove' && (l[0].position.x != d.position.x || l[0].position.y != d.position.y)) {
        //             return [d, {
        //                 position: l[0].position,
        //                 originalEvent: d.originalEvent,
        //                 type: "mouseout"
        //             }];
        //         }
        //         return [d];
        //     })
        //     .flatMap(l => Rx.Observable.from(l))
        //     .filter(_ => _)
    }
}

$("#dotsandboxes").onAsObservable("click").take(1).map(_ => _.target).subscribe(c => {
    var ctx: CanvasRenderingContext2D = (<HTMLCanvasElement>c).getContext("2d");
    var game = new DotsAndBoxes.Game(ctx);
});