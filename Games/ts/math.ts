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
		public rotation: number = 0;
		
		constructor(public centre: Point2D, public width: number, public height: number, public points: Point2D[] = []){
			super(centre, points);
			this.points = points.length && points || [[-0.5,-0.5],[0.5,-0.5],[0.5,0.5],[-0.5,0.5]].map(c => centre.add(new Point2D(c[0]*width, c[1]*height)));
		}

		move(dist: Point2D) {
			return new Box(this.centre.add(dist), this.width, this.height, this.points.map(p => p.add(dist)));
		}

		rotate(angle: number): Box {
			var b = new Box(this.centre, this.width, this.height);
			b.rotation = this.rotation + angle;
			b.points = super.rotate(angle).points;
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

		clearRadius(): number {
			return Math.max(this.width, this.height);
		}

		intersects(other: Box){
			return this.centre.min(other.centre).size() < Math.min(this.clearRadius(), other.clearRadius());
		}

	}

}