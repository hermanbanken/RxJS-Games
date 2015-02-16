interface Shape {}

class Rectangle implements Shape{
    constructor(public x:number, public y:number, public width:number, public height:number, public vx:number = 0, public vy:number = 0, public ax:number = 0, public ay = 0, public restitution = 0) {}

    withPosition(x:number, y:number) {
        return new Rectangle(x, y, this.width, this.height, this.vx, this.vy, this.ax, this.ay, this.restitution);
    }

    withX(x:number) {
        return new Rectangle(x, this.y, this.width, this.height, this.vx, this.vy, this.ax, this.ay, this.restitution);
    }
    withY(y:number) {
        return new Rectangle(this.x, y, this.width, this.height, this.vx, this.vy, this.ax, this.ay, this.restitution);
    }
    withWidth(width:number) {
        return new Rectangle(this.x, this.y, width, this.height, this.vx, this.vy, this.ax, this.ay, this.restitution);
    }
    withHeight(height:number) {
        return new Rectangle(this.x, this.y, this.width, height, this.vx, this.vy, this.ax, this.ay, this.restitution);
    }

    withVX(vx:number) {
        return new Rectangle(this.x, this.y, this.width, this.height, vx, this.vy, this.ax, this.ay, this.restitution);
    }
    withVY(vy:number) {
        return new Rectangle(this.x, this.y, this.width, this.height, this.vx, vy, this.ax, this.ay, this.restitution);
    }
    withAX(ax:number) {
        return new Rectangle(this.x, this.y, this.width, this.height, this.vx, this.vy, ax, this.ay, this.restitution);
    }
    withAY(ay:number) {
        return new Rectangle(this.x, this.y, this.width, this.height, this.vx, this.vy, this.ax, ay, this.restitution);
    }

    getMidX() {
        return this.x + .5 * this.width;
    }
    getMidY() {
        return this.y + .5 * this.height;
    }

    getLeft():number {
        return this.x;
    }
    getRight():number{
        return this.x + this.width;
    }
    getTop():number {
        return this.y;
    }
    getBottom():number {
        return this.y + this.height;
    }
}