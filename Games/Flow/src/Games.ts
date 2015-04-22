module games {
    export class GridMapping {
        public gridW: number;
        public gridH: number;
        constructor(public rows: number, public cols: number, private canvas_wh: number[], private margins_tl: number[] = [0, 0]) {
            this.gridW = (canvas_wh[0] - margins_tl[1] * 2) / cols;
            this.gridH = (canvas_wh[1] - margins_tl[0] * 2) / rows;
            console.log("Grid", this.gridW, this.gridH);
        }
        canvasToGrid(x: any, y: any = null): ({ x: number; y:number }) {
            if (typeof x === 'object' && x.x && x.y) {
                y = x.y;
                x = x.x;
            }
            x -= this.margins_tl[1];
            y -= this.margins_tl[0];
            x /= this.gridW;
            y /= this.gridH;
            return { x: x, y: y };
        }
        gridToCanvas(x: any, y: any = null) {
            if (typeof x === 'object' && x.x && x.y) {
                y = x.y;
                x = x.x;
            }
            return {
                x: this.gridW * x + this.margins_tl[1],
                y: this.gridH * y + this.margins_tl[0]
            };
        }

        gridToCanvasPoint(gx, gy) {
            var c = this.gridToCanvas(gx, gy);
            return new math.Point2D(c.x, c.y);
        }
    }

    export interface MouseEvt {
        position: MouseOnBorder | MouseInGrid;
        originalEvent: BaseJQueryEventObject;
        type: string;
    }

    export interface MouseOnBorder {
        x: number; y: number; border: string;
    }
    export interface MouseInGrid {
        x: number; y: number; inGrid: boolean;
    }

    export class BorderSnapGridMapping extends GridMapping {
        constructor(rows: number, cols: number, canvas_wh: number[], private border_width = 0.125, margins_tl: number[] = [0, 0]) {
            super(rows, cols, canvas_wh, margins_tl);
        }
        canvasToGrid(x: any, y: any = null): MouseOnBorder | MouseInGrid {
            var p = super.canvasToGrid(x, y);
            
            var border = [
                { o: Math.abs(p.x - Math.round(p.x)), b: 'left' },
                { o: Math.abs(p.y - Math.round(p.y)), b: 'top' }
            ].sort((a, b) => a.o - b.o)[0];

            if (border.o < this.border_width) {
                return {
                    x: Math.floor(p.x + this.border_width),
                    y: Math.floor(p.y + this.border_width),
                    border: border.b
                }
            }
            else {
                return {
                    x: ~~p.x,
                    y: ~~p.y,
                    inGrid: true
                };
            }
        }
    }

    export class Grid<T> {
        store: T[][] = [];
        constructor(public generate: ((x: number, y: number) => T)) { }
        get(x: number, y: number) {
            if (!this.store[x])
                this.store[x] = [];
            if (!this.store[x][y])
                this.store[x][y] = this.generate(x, y);
            return this.store[x][y];
        }
    }
}