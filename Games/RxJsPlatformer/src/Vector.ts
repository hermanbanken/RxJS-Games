class Vector {
    constructor(public x:number, public y:number) {}

    withX(x:number){
        return new Vector(x, this.y);
    }
    withY(y:number){
        return new Vector(this.x, y);
    }

    add(v:Vector) {
        return new Vector(this.x + v.x, this.y + v.y);
    }

    mul(factor:number):Vector {
        return new Vector(this.x * factor, this.y * factor);
    }

    equals(v:Vector) {
        return this.x == v.x && this.y == v.y;
    }
}