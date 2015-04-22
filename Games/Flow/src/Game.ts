/// <reference path="../../ts/rx/rx.all.d.ts" />
/// <reference path="../../ts/rx-jquery/rx.jquery.d.ts" />
/// <reference path="../../ts/rx.flatscan.ts" />
/// <reference path="../../ts/math.ts" />
/// <reference path="../../ts/rx.requestanimationframescheduler.ts" />
/// <reference path="../../ts/rx-reveal.ts" />
/// <reference path="Games.ts" />

module Flow {

    export interface Stage {
        draw(ctx: CanvasRenderingContext2D, game: Game): void;
        run(game: Game): Rx.Observable<Stage>;
    }

    export class Game extends games.GridMapping {
        public level: number = 0;

        public gridSize: number = 0;

        constructor(public ctx: CanvasRenderingContext2D) {
            super(5, 5, [ctx.canvas.width, ctx.canvas.height]);
            this.gridSize = this.gridH;
        }

        run(initial: Stage) {
            return Rx.Observable.just(initial)
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

        // Observable of Grid movements, emits grid coordinates
        public mouse = $(this.ctx.canvas).onAsObservable("mousemove mousedown mouseup")
            .map(e => {
            var p = games.Utils.getMousePos(<HTMLCanvasElement>e.target, <JQueryMouseEventObject>e);
            return {
                position: this.canvasToGrid(p.x, p.y),
                originalEvent: null,
                type: e.type
            };
        });

        public tiles = this.mouse.map(e => ({
            x: ~~e.position.x,
            y: ~~e.position.y,
            type: e.type
        }));
    }
}