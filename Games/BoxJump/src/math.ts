module math {

	export class Point2D {
		constructor(public x: number, public y: number){}
		add(other: Point2D){
			return new Point2D(this.x + other.x, this.y + other.y);
		}
		min(other: Point2D){
			return new Point2D(this.x - other.x, this.y - other.y);
		}
		rotate(angle: number, origin: Point2D = null){
			var b = origin == null ? this : this.min(origin), 
				s = Math.sin(angle),
				c = Math.cos(angle),
				p = new Point2D(
					b.x * c - b.y * s,
					b.x * s + b.y * c
				);
			return origin == null ? p : origin.add(p);
		}
		size(): number {
			return Math.sqrt(this.x * this.x + this.y * this.y);
		}
		times(mult: number): Point2D {
			return new Point2D(this.x * mult, this.y * mult);
		}
		toString(): string{
			return "("+this.x+","+this.y+")"; 
		}
		map(fx: (number) => number, fy: (number) => number){
			return new Point2D(fx(this.x), fy(this.y));
		}
	}

	class Form {
		constructor(public centre: Point2D, public points: Point2D[]){}
		rotate(angle: number) {
			return new Form(this.centre, this.points.map(p => p.rotate(angle, this.centre)));
		}
		move(dist: Point2D) {
			return new Form(this.centre.add(dist), this.points.map(p => p.add(dist)));
		}
	}

	export interface Drawable {
		draw(ctx);
	}

	export class Box extends Form implements Drawable {
		constructor(public centre: Point2D, width: number, height: number){
			super(centre, [[-0.5,-0.5],[0.5,-0.5],[0.5,0.5],[-0.5,0.5]].map(c => centre.add(new Point2D(c[0]*width, c[1]*height))));
		}

		width(){
			return this.points[0].min(this.points[3]).size();
		}

		height(){
			return this.points[0].min(this.points[1]).size();
		}

		move(dist: Point2D) {
			return Box.fromForm(super.move(dist));
		}

		static fromForm(f: Form){
			var b = new Box(f.centre, 0, 0);
			b.points = f.points;
			return b;
		}

		draw(ctx: CanvasRenderingContext2D){
			ctx.beginPath();
			ctx.moveTo(this.points[0].x, ctx.canvas.height - this.points[0].y);
			for(var i = 1; i < this.points.length; i++){
				ctx.lineTo(this.points[i].x, ctx.canvas.height - this.points[i].y);
			}
			ctx.closePath();
			ctx.fill();
		}

		map(fx: (number) => number, fy: (number) => number){
			var b = new Box(this.centre.map(fx,fy), 0, 0);
			b.points = this.points.map(p => p.map(fx, fy));
			return b;
		}
	}

}