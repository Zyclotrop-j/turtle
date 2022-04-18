const EMPTY = {};
export class Shape {
    #type_
    #data
    #options
    constructor(type_, data, options = EMPTY) {
        if(Shape.#cache[type_]?.get(data)?.has(options)) {
            return Shape.#cache[type_].get(data).get(options);
        }
        this.#type_ = type_;
        this.#data = data ?? [];
        this.#options = options;
        Shape.#cache[type_] ??= new WeakMap();
        if(!Shape.#cache[type_].has(data)) {
            Shape.#cache[type_].set(data, new WeakMap())
        };
        if(!Shape.#cache[type_].get(data).has(options)) {
            Shape.#cache[type_].get(data).set(options, this);
        };
    }
    static #cache = {}
    static #types = {
        POLYGON: Symbol("shape_polygon"),
        IMAGE: Symbol("shape_image"),
        COMPOUND: Symbol("shape_compound"),
        BINARY: Symbol("shape_binary"),
    };
    static get types() {
        return Shape.#types;
    }
    get data() {
        return this.#data;
    }
    get type() {
        return this.#type_;
    }
    get options() {
        return { ...this.#options };
    }
    addcomponent(poly, fill, outline = null) {
        this.#data.push({
            poly, fill, outline
        });
    }
}