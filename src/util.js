export const PI_2 = Math.PI * 2;
export const toRad = deg => deg * Math.PI / 180;
export const toDeg = rad => rad / Math.PI * 180;
export const normalize = degrees => {
    if(typeof degrees !== 'number' && typeof degrees?.valueOf?.() !== 'number' && typeof degrees.x === 'number' && typeof degrees.y === 'number') {
        const v = new Vec2D(degrees.x, degrees.y);
        return toDeg(v.valueOf()) % 360;
    }
    return degrees % 360;
};
export const normalizeArgs = (x, y) => {
    if(x.x !== undefined && x.y !== undefined && y === undefined) {
        return [x.x, x.y];
    } else if(x[0] !== undefined && x[1] !== undefined && y === undefined) {
        return [x[0], x[1]];
    } else {
        return [x, y];
    } 
}
export class Vec2D extends Array {
    constructor(x, y) {
        super();
        const normal = normalizeArgs(x, y);
        this.x = normal[0]; this.y = normal[1];
        this[0] = this.x, this[1] = this.y;
    }
    *[Symbol.iterator] () {
        yield this.x;
        yield this.y;
    }
    static typename = Symbol("Vec2D")
    __type = Vec2D.typename.toString()
    static normalizeArgs(x, y) {
        return normalizeArgs(x, y);
    }
    x;
    y;
    static add(a, b) {
        return new Vec2D(a.x + b.x, a.y + b.y);
    }
    static substract(a, b) {
        return new Vec2D(a.x - b.x, a.y - b.y);
    }
    static innerProduct(a, b) {
        return new Vec2D(a.x * b.x, a.y * b.y);
    }
    static scalarProduct(a, k) {
        return new Vec2D(a.x * k, a.y * k);
    }
    static abs(a) {
        return new Vec2D(Math.abs(a.x), Math.abs(a.y));
    }
    static rotate(a, angle) {
        const perp = new Vec2D(-a.y, a.x);
        const radangle = toRad(angle);
        const c = Math.cos(radangle), s = Math.sin(radangle);
        return Vec2D(a.x*c+perp.x*s, a.y*c+perp.y*s);
    }
    add(b) {
        return Vec2D.add(this, b);
    }
    substract(b) {
        return Vec2D.substract(this, b);
    }
    innerProduct(b) {
        return Vec2D.innerProduct(this, b);
    }
    scalarProduct(k) {
        return Vec2D.scalarProduct(this, k);
    }
    abs() {
        return Vec2D.abs(this);
    }
    rotate(angle) {
        return Vec2D.rotate(this, angle);
    }
    toJSON() {
        return [this.x, this.y]
    }
    toArray() {
        return this.toJSON();
    }
    valueOf() {
        return Math.atan(this.y/this.x);
    }
}