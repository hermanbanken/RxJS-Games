/// <reference path="../../ts/rx/rx.all.d.ts" />
/// <reference path="../../ts/rx-jquery/rx.jquery.d.ts" />
/// <reference path="../../ts/rx.flatscan.ts" />
/// <reference path="../../ts/math.ts" />
/// <reference path="../../ts/rx.requestanimationframescheduler.ts" />
/// <reference path="../../ts/rx-reveal.ts" />
/// <reference path="../../Flow/src/Games.ts" />

module DotsAndBoxes {

    interface Stage {
        draw(ctx: CanvasRenderingContext2D, game: Game): void;
        run(game: Game): Rx.Observable<Stage>;
    }

    class User {
        constructor(public id: string, public color: string) {}
    }

    interface GameEvents {
        user: User;
        evt: games.MouseEvt;
    }

    class Box extends math.Box {
        public Owner: Rx.Observable<User>;
        constructor(centre: math.Point2D, size: number, lines: Line[], ctx: CanvasRenderingContext2D) {
            super(centre, size, size);
            this.Owner = Rx.Observable.merge(lines.map(_ => _.Owner)).skip(3).take(1);
            this.Owner.subscribe(this.draw.bind(this, ctx));
        }
        draw(ctx: CanvasRenderingContext2D, user: any) {
            if (user instanceof User) {
                ctx.fillStyle = user && user.color || "blue";
                super.draw(ctx, false, false);
            }
        }
    }

    class Line extends math.Line2D implements Rx.Disposable {
        gridSize: number;
        private disposed = false;
        private resources = [];

        constructor(a: math.Point2D, b: math.Point2D, events: Rx.Observable<GameEvents>, game: Game) {
            super(a, b);
            this.gridSize = this.size();

            var r = events
                .map(e => {
                    if (e.evt.type == 'mousemove')
                        this.draw(game.ctx, e.user);
                    if (e.evt.type == 'mouseout')
                        this.draw(game.ctx, false);
                    return e.evt.type == 'mousedown' ? e.user : null;
                })
                .filter(_ => _ != null)
                .subscribe(u => { 
                    this.owned = true;
                    this.owner.onNext(u);
                });
            this.resources.push(r);
        }

        dispose() {
            this.resources = this.resources.filter(r => r.dispose() && false);
            this.owner.dispose();
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

            this.path(ctx);
            ctx.fill();
            ctx.globalCompositeOperation = "source-over";
 
            this.path(ctx);
            ctx.strokeStyle = "gray";
            ctx.stroke();
        }

        path(ctx: CanvasRenderingContext2D){
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
        }
    }

    interface OwnershipEvt {
        box: Box; owner: User;
    }

    class NormalStage implements Stage, Rx.Disposable {
        resources: Rx.Disposable[] = [];
        boxOwner: Rx.Observable<{ box: Box; owner: User; }>;
        lineOwner: Rx.Observable<{ line: Line; owner: User; }>;

        constructor(public points: number, public lines: Line[], public boxes: Box[], game: Game) {
            if(!lines.length || !boxes.length){
                var top = new games.Grid<Line>((x, y) => {
                    var b = game.gridToCanvasPoint(x, y),
                        c = game.gridToCanvasPoint(x + 1, y);
                    var l = new Line(b, c, game.eventsFor('top', x, y), game);
                    lines.push(l);
                    return l;
                });
                var left = new games.Grid<Line>((x, y) => {
                    var a = game.gridToCanvasPoint(x, y + 1),
                        b = game.gridToCanvasPoint(x, y);
                    var l = new Line(a, b, game.eventsFor('left', x, y), game);
                    lines.push(l);
                    return l;
                });
                for (var i = 0, x = 0, y = 0; y < game.rows; i++ , x = (x + 1) % game.cols, y = x == 0 ? y + 1 : y) {
                    boxes.push(new Box(
                        game.gridToCanvasPoint(x + 0.5, y + 0.5), 
                        game.gridSize * 8 / 10, [
                            top.get(x, y),
                            top.get(x, y + 1),
                            left.get(x, y),
                            left.get(x + 1, y)
                        ], game.ctx
                    ));
                }
            }
            
            this.boxOwner = Rx.Observable.merge(boxes.map(b =>
                b.Owner.map(u => ({
                    box: b,
                    owner: u
                }))
            ));

            this.lineOwner = Rx.Observable.merge(lines.map(b =>
                b.Owner.map(u => ({
                    line: b,
                    owner: u
                }))
            ));

            this.resources.push(this.boxOwner.subscribe(bo => game.score(bo.owner, bo.box)));
            this.resources.push(this.lineOwner.subscribe(bo => game.linePlaced(bo.owner, bo.line)));
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
            return Rx.Observable.using(
                () => this,
                (resources) => {
                    return Rx.Observable.never<Stage>();
                }
            );
        }

        dispose() {
            this.resources.forEach(r => r.dispose());
            this.lines.forEach(l => l.dispose());
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
            return Rx.Observable.just(new Start(game));
        }
    }

    export class Game extends games.BorderSnapGridMapping {
        public level: number = 0;

        public user = new User("id", "red");
        public users = [this.user, new User("id", "blue")];

        public gridSize: number;

        constructor(public ctx: CanvasRenderingContext2D, public players: HTMLElement[]) {
            super(4, 4, [ctx.canvas.width, ctx.canvas.height], 1 / 8, [5, 5]);
            this.gridSize = this.gridW;
        }

        private onBox = new Rx.Subject<User>();
        score(user: User, box: Box){
            this.onBox.onNext(user);
        }

        private onLine = new Rx.Subject<User>();
        linePlaced(user: User, line: Line) {
            this.onLine.onNext(user);
        }

        /* Random first player */
        initialTurn = Math.floor(Math.random() + .5);

        /* Events that define who is on turn */
        turns = Rx.Observable.merge(
            // Normal turns (a line was placed)
            this.onLine.map(_ => 1),
            // A 'box' was filled, do 'turn' twice at score moment
            this.onBox
                // When two boxes fill at the same time: we need a window
                .window(this.onLine)
                // Need the count of this list
                .flatMap(l => l.count())
                // Only non-empty
                .filter(a => a > 0)
                // -> void
                .map(_ => 1)
            )
            .scan(this.initialTurn, (p, u) => 1 - p)
            .startWith(this.initialTurn)
            .tap(ui => {
                this.players[1 - ui].style.opacity = "1";
                this.players[ui].style.opacity = "0";                    
            });
 
        /* The mouse events one Line needs */
        eventsFor(type, x, y) {
            return this.turns
                .map(ui => {
                    return this.dots.filter((e: games.MouseEvt) => {
                        return e.position['border'] && e.position['border'] == type && e.position.x == x && e.position.y == y;
                    }).map(e => ({
                        evt: e,
                        user: this.users[ui]
                    }));
                })
                .switch()
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

Reveal.forSlide(s => s.currentSlide.id == 'g-dotsandboxes', s => {
    var canvas = <HTMLCanvasElement> $("#dotsandboxes", s.currentSlide).get(0);
    var players = $(".dots-player", s.currentSlide).get();
    return new DotsAndBoxes.Game(canvas.getContext("2d"), players).run();
}).subscribe(e => {
    console.log("Loaded Dots & Boxes");
});