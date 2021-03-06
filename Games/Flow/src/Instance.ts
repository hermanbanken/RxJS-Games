/// <reference path="../../ts/math.ts" />

module Flow {

    export interface Flow {
        index: number;
        ps: math.XY[];
    }

    export class Instance {
        constructor(public flows: math.XY[][]) { }

        static simple(w: number, h: number, n_flows: number): Instance {
            var perflow = (w * h / n_flows);
            var flow = [];
            var flows = [flow];
            var totalflows = 1;

            // For every cell
            for (var i = 0, x = 0, y = 0; i < w * h; i++) {
                // When over 'flowing', pun intended
                if (i >= flows.length * perflow) {
                    flow = [];
                    flows.push(flow);
                }
                flow.push(new math.Point2D(x, y));
                // Increase
                x += y % 2 == 0 ? 1 : -1;
                if (x < 0 || x >= w) {
                    y += 1;
                    x = Math.min(w - 1, Math.max(0, x));
                }
            }

            return new Instance(flows);
        }

        contains(p: math.XY): boolean {
            return typeof this.flowIndex(p) == 'number';
        }

        private rowIndex(flow: number | math.XY[], p: math.XY): number | boolean {
            var f = typeof flow == 'number' ? this.flows[<number>flow] : <math.XY[]>flow;
            return f.reduce(
                (b, fp, i) => typeof b === 'number' ? b : fp.x == p.x && fp.y == p.y && i, 
                false
            );
        }

        flowIndex(p: math.XY): number | boolean {
            return this.flows.reduce(
                (b, flow, f_index) => typeof b === 'number' ? b : typeof this.rowIndex(flow, p) === 'number' ? f_index : false,
                false
            );
        }

        isStartOrEnd(p: math.XY): boolean {
            var i = this.flowIndex(p);
            return typeof i === 'number' && i >= 0 && (
                Instance.equals(p, this.flows[i][0]) || 
                Instance.equals(p, this.flows[i][this.flows[i].length - 1])
            );
        }

        static equals(a: math.XY, b: math.XY){
            return a.x === b.x && a.y === b.y;
        }

        with(flow: Flow): Instance {
            if (flow == null || typeof flow != 'object')
                return this;
            var fs = this.flows.slice(0);
            while (fs.length <= flow.index) {
                fs.push([]);
            }
            fs = fs.map((ps, i) => i == flow.index ? flow.ps : ps);
            return new Instance(fs);
        }

        // @see: http://stackoverflow.com/questions/12926111/what-to-use-for-flow-free-like-game-random-level-creation
        permutate(seed: number){
            if (seed == 0)
                return this;

            var rng = new math.RNG(seed);
            var fs = this.flows;

            for (var n = 100; n--;){
                var i = rng.random() * fs.length % fs.length;
                if (fs[i].length < 3)
                    break;
                
            }

            return this;
        }
    }
}