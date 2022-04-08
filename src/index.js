import * as PIXI from 'pixi.js';

/**
 * Helper Classes
 */

class PixiCanvas {
    // todo: convert all inputs and output from pixel to world-coordinates and vice-versa
    static #defaultCanvas;
    static get defaultCanvas() {
        if(!PixiCanvas.#defaultCanvas) {
            PixiCanvas.#defaultCanvas = new PixiCanvas();
        }
        return PixiCanvas.#defaultCanvas;
    }
    static #PixiCanvases = [];
    constructor({ app, view, turtle, _canvas } = {}) {
        this.#app = app ?? new PIXI.Application({
            backgroundColor: 0xFFFFFF
        });
        // todo: this.#app.screen is event target!!
        this.view = view ?? this.#app.view;
        this.turtle = turtle ?? null;
    }
    #minx
    #miny
    #maxx
    #maxy
    #objects = [];
    static #PIXI_CANVAS = Symbol("PIXI_CANVAS");
    bind(turtle) {
        return new PixiCanvas({
            app: this.#app,
            view: this.view,
            turtle,
        });
    }
    #app;
    #group(fn) {
        const graphics = new PIXI.Graphics();
        fn(graphics);
        this.#app.stage.addChild(graphics);
        this.#objects.push(graphics);
        return { w: graphics.width, h: graphics.height };
    }
    circle([x, y], { radius, fill, color }) {
        return this.#group(graphics => {
            if(fill) {
                graphics.lineStyle(0);
            } else {
                graphics.lineStyle(radius * 0.1, fill);
            }
            graphics.beginFill(fill ? color : "white", 1, 0);
            graphics.drawCircle(x, y, fill ? radius : fill * 0.9);
            graphics.endFill();
        });
    }
    line([x1, y1], [x2, y2], { color, width }) {
        return this.#group(graphics =>  {
            graphics.lineStyle(width, color, 1);
            graphics.moveTo(x1, y1);
            graphics.lineTo(x2, y2);
        });
    }
    drawShape([x, y], {
        shape: name, // shape or name of shape
        rotate = 0
    }) {
        const shape = this.#shapes[name] ?? name;
        this.modifyShape([x, y], {
            shape: name,
            rotate
        });
        if(!this.#objects.includes(shape)) {
            this.#app.stage.addChild(shape);
            this.#objects.push(shape);
        }
        return { w: shape.width, h: shape.height };
    }
    modifyShape([x, y], {
        shape: name, // shape or name of shape
        rotate,
        scale,
        skew,
    }) {
        const shape = this.#shapes[name] ?? name;
        // todo: transform coordinates
        if(x !== undefined) shape.x = x;
        if(y !== undefined) shape.y = y;
        if(rotate !== undefined) shape.rotation = rotate;
        if(scale !== undefined) shape.scale = scale;
        if(skew !== undefined) shape.skew = skew;
    }
    removeShape(id) {
        const shape = this.#shapes[name] ?? name;
        this.#app.stage.removeChild(shape);
        shape.destroy();
        this.#objects.splice(this.#objects.indexOf(shape), 1);
    }
    #shapes = {};
    #_loadercache = {}
    #loadercache(name, asset) {
        if(this.#_loadercache[`${name}-${asset}`]) {
            return this.#_loadercache[`${name}-${asset}`]
        }
        this.#_loadercache[`${name}-${asset}`] = new Promise(res => {
            app.loader.add(name, 'assets/turtle.png').load((loader, resources) => {
                res({ loader, resources });
            });
        });
        return this.#_loadercache[`${name}-${asset}`];
    }
    registerShape(name, data, options = {}) {
        if(this.#shapes[name]) {
            throw new Error(`Shape with name '${name}' already registered!`);
        }
        if(typeof data === 'string') {
            this.#shapes[name] = new PIXI.Container();
            return new Promise(res => {
                this.#loadercache(name, data).then(({ loader, resources }) => {
                    const shape = new PIXI.Sprite(resources[name].texture);
                    shape.x = shape.y = 0;
                    this.#shapes[name].addChild(shape);
                    if(options.interactive) {
                        shape.interactive = true;
                    }
                    if(options.buttonMode) {
                        shape.buttonMode = true;
                    }
                    Object.entries(options).filter(([k, v]) => k.startsWith('on') && typeof v === 'function').forEach(([k, v]) => {
                        shape.on(k.substring('on'.length), v);
                    });
                    res(shape);
                });
            });
        }
        const tupleconstrutor = (data, options, shapeoptions = {}) => {
            const scale = options.scale ?? 1;
            const path = data.map(([x, y]) => [x * scale, y * scale]).flat();
            this.#shapes[name] = new PIXI.Container();
            const graphics = new PIXI.Graphics();
            this.#shapes[name].addChild(graphics);
            graphics.lineStyle(0);
            graphics.beginFill(options.color ?? 0x3500FA, options.opacity ?? 1);
            graphics.drawPolygon(path);
            graphics.endFill();
            if(options.interactive) {
                graphics.interactive = true;
            }
            if(options.buttonMode) {
                graphics.buttonMode = true;
            }
            if(shapeoptions.rotate) {
                graphics.rotation = shapeoptions.rotate;
            }
            Object.entries(options).filter(([k, v]) => k.startsWith('on') && typeof v === 'function').forEach(([k, v]) => {
                graphics.on(k.substring('on'.length), v);
            });
            return { w: graphics.width, h: graphics.height };
        }
        if(data instanceof Shape && data.type === "polygon") {
            return tupleconstrutor(data.data, options, data.options);
        }
        if(Array.isArray(data) && data.every((j) => Array.isArray(j) && j.length === 2)) {
            return tupleconstrutor(data, options);
        }
        throw new Error(`Unsupported shape type ${typeof data}`);
    }
    clear() {
        this.#objects.splice(0, this.#objects.length).forEach(obj => {
            this.#app.stage.removeChild(obj);
            obj.destroy?.();
        });
    }
    #_fontCache = new Map();
    #fontCache(settings) {
        const finalMap = Object.keys(settings).sort().reduce((cache, key) => {
            const value = settings[key];
            if(!cache.has(key)) {
                cache.set(key, new Map());
            }
            if(!cache.get(key).has(value)) {
                cache.get(key).set(value, new Map());
            }
            return cache.get(key).get(value);
        }, this.#_fontCache);
        if(finalMap.has("data")) {
            return finalMap.get("data");
        }
        const obj = new PIXI.TextStyle(settings);
        finalMap.set("data", obj);
        return finalMap.get("data");
    }
    write([x, y], { arg, move = false, align = 'left', font = ['Arial', 8, 'normal'] } = {}) {
        const [fontFamily, fontSize, fontStyle] = font;
        const richText = new PIXI.Text(arg.toString(), this.#fontCache({
            fontFamily,
            fontSize,
            fontStyle,
            fill: "#ffffff",
            /*
            fontWeight: 'bold',
            fill: ['#ffffff', '#00ff99'], // gradient
            stroke: '#4a1850',
            strokeThickness: 5,
            dropShadow: true,
            dropShadowColor: '#000000',
            dropShadowBlur: 4,
            dropShadowAngle: Math.PI / 6,
            dropShadowDistance: 6,
            wordWrap: true,
            wordWrapWidth: 440,
            lineJoin: 'round',
            */
        }));
        richText.x = x;
        richText.y = y;
        this.#app.stage.addChild(richText);
        this.#objects.push(richText);
        return { w: richText.width, h: richText.height };
    }
    get width() {
        return this.#app.screen.width;
    }
    get height() {
        return this.#app.screen.height;
    }
    get x0y0() {
        return "TL"; // or BL - where's 0 in this screen - top-left or bottom-left
    }
    #attachedTo
    renderInto(domElement) {
        domElement.appendChild(this.view);
        this.#app.resizeTo = domElement;
    }
}

class Shape {
    #type_
    #data
    #options
    constructor(type_, data, options = {}) {
        this.#type_ = type_;
        this.#data = data ?? [];
        this.#options = options;
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
const PI_2 = Math.PI * 2;
const toRad = deg => deg * Math.PI / 180;
const toDeg = rad => rad / Math.PI * 180;
const normalize = degrees => {
    return degrees % 360;
};
const normalizeArgs = (x, y) => {
    if(x[0] !== undefined && x[1] !== undefined && y === undefined) {
        return [x[0], x[1]];
    } else {
        return [x, y];
    } 
}
class Vec2D {
    constructor(x, y) {
        const normal = normalizeArgs(x, y);
        this.x = normal[0]; this.y = normal[1];
    }
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

/*
Turtle motion
Move and draw
forward() | fd()
backward() | bk() | back()
right() | rt()
left() | lt()
goto() | setpos() | setposition()
setx()
sety()
setheading() | seth()
home()
circle()
dot()
stamp()
clearstamp()
clearstamps()
undo()
speed()
*/
class RawTurtle {
    constructor(canvas, domelement) {
        RawTurtle.#turtlecounter++;
        this.#canvas = canvas.bind(this);
        if(domelement) {
            this.renderInto(domelement);
        }
        this.#undobuffer = null;
        this.#_orient = RawTurtle.START_ORIENTATION[this.#mode ?? RawTurtle.DEFAULT_MODE];
        //Object.values(RawTurtle.TURTLE_SHAPES).forEach(shapename => {
        //    this.#canvas.registerShape(name, 'assets/turtle.png')
        //});
        this.#turtleshape = RawTurtle.TURTLE_SHAPES.TURTLE;
        this.#PEN = `PEN_${RawTurtle.#turtlecounter}`;
        const buttonStates = {};
        this.#canvas.registerShape(this.#PEN, RawTurtle[`${RawTurtle.TURTLE_SHAPES.TURTLE}Polygon`], {
            interactive: true, buttonMode: true,
            onpointerdown: (event) => {
                // https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
                const btn = event.button + 1; 
                const { x, y } = event.screen; // does this property exist?
                buttonStates[btn] = true;
                this.#eventlisteners.click?.[`button${btn}`]?.forEach(fn => {
                    fn(x, y);
                })
            },
            onpointerup: (event) => {
                const btn = event.button + 1; 
                const { x, y } = event.screen; // does this property exist?
                buttonStates[btn] = false;
                this.#eventlisteners.release?.[`button${btn}`]?.forEach(fn => {
                    fn(x, y);
                })
            },
            onpointermove: (event) => {
                const btn = event.button + 1; 
                if(buttonStates[btn]) {
                    const { x, y } = event.screen; // does this property exist?
                    this.#eventlisteners.release?.[`button${btn}`]?.forEach(fn => {
                        fn(x, y);
                    });
                }
            }
        });
        // todo: register the other shapes
        // todo: add other shapes on top of the pen and toggle them when changing this.#turtleshape
        // todo: then add all shapes to a container, set this contianer to be names this.#PEN

        this.reset();
    }
    renderInto(domElement) {
        this.#canvas.renderInto(domElement);
    }
    static #turtlecounter = 0;
    static TURTLE_SHAPES = {
        ARROW: "arrow",
        TURTLE: "turtle",
        CIRCLE: "circle",
        SQARE: "square",
        TRIANGLE: "triangle",
        CLASSIC: "classic"
    }
    static MODES = {
        STANDARD: "standard",
        WORLD: "world",
        LOGO: "logo",
    }
    static START_ORIENTATION = {
        [RawTurtle.MODES.STANDARD]: new Vec2D(1, 0),
        [RawTurtle.MODES.WORLD]   : new Vec2D(1, 0),
        [RawTurtle.MODES.LOGO]    : new Vec2D(0, 1) 
    }
    static DEFAULT_MODE = RawTurtle.MODES.STANDARD
    static DEFAULT_ANGLEOFFSET = 0
    static DEFAULT_ANGLEORIENT = 1
    static #MODE_DEGREEE = "DEGREE"
    static #MODE_RADIANS = "RADIANS";

    #PEN

    #mode = RawTurtle.DEFAULT_MODE;
    #canvas;
    #undobuffer;

    #shown = true // : True/False
    #pendown = true // : True/False
    #pencolor = "black" // : color-string or color-tuple
    #fillcolor // : color-string or color-tuple
    #pensize = 1 // : positive number
    #speed // : number in range 0..10
    #_resizemode // : “auto” or “user” or “noresize” // todo: when this is set, re-calc the turtle
    static RESIZEMODE = {
        AUTO: "auto",
        USER: "user",
        NORESIZE: "noresize"
    }
    static turtlePolygon = new Shape(
        "polygon",
        [[0,16], [-2,14], [-1,10], [-4,7],[-7,9], [-9,8], [-6,5], [-7,1], [-5,-3], [-8,-6],[-6,-8], [-4,-5], [0,-7], [4,-5], [6,-8], [8,-6],[5,-3], [7,1], [6,5], [9,8], [7,9], [4,7], [1,10],[2,14]],
        { rotate: toRad(-90) }
    );
    /*
    TODO
    "arrow" : Shape("polygon", ((-10,0), (10,0), (0,10))),
    "turtle" : Shape("polygon", ((0,16), (-2,14), (-1,10), (-4,7),
                (-7,9), (-9,8), (-6,5), (-7,1), (-5,-3), (-8,-6),
                (-6,-8), (-4,-5), (0,-7), (4,-5), (6,-8), (8,-6),
                (5,-3), (7,1), (6,5), (9,8), (7,9), (4,7), (1,10),
                (2,14))),
    "circle" : Shape("polygon", ((10,0), (9.51,3.09), (8.09,5.88),
                (5.88,8.09), (3.09,9.51), (0,10), (-3.09,9.51),
                (-5.88,8.09), (-8.09,5.88), (-9.51,3.09), (-10,0),
                (-9.51,-3.09), (-8.09,-5.88), (-5.88,-8.09),
                (-3.09,-9.51), (-0.00,-10.00), (3.09,-9.51),
                (5.88,-8.09), (8.09,-5.88), (9.51,-3.09))),
    "square" : Shape("polygon", ((10,-10), (10,10), (-10,10),
                (-10,-10))),
    "triangle" : Shape("polygon", ((10,-5.77), (0,11.55),
                (-10,-5.77))),
    "classic": Shape("polygon", ((0,0),(-5,-9),(0,-7),(5,-9))),
    "blank" : Shape("image", self._blankimage())
    }
    */
    get #resizemode() {
        return this.#_resizemode;
    }
    set #resizemode(value) {
        this.#_resizemode = value;
        switch(this.#_resizemode) {
            case RawTurtle.RESIZEMODE.AUTO: {
                this.modifyShape([], {
                    shape: this.#PEN,
                    rotate: toRad(this.#orient) + this.#tilt,
                    scale: [this.#pensize, this.#pensize],
                    // skew: 
                    // todo: transform shape with tilt and shear
                })
                break;
            }
            case RawTurtle.RESIZEMODE.USER: {
                // w = this.#outline
                this.modifyShape([], {
                    shape: this.#PEN,
                    rotate: toRad(this.#orient),
                    scale: this.#stretchfactor,
                    // skew: 
                    // todo: transform shape with tilt and shear
                })
                break;
            }
            case RawTurtle.RESIZEMODE.NORESIZE: {
                // w = 1
                this.modifyShape([], {
                    shape: this.#PEN,
                    rotate: toRad(this.#orient),
                    scale: [1, 1],
                    // skew: 
                    // todo: transform shape with tilt and shear
                })
                break;
            }
        }
    }
    #stretchfactor = [1, 1] // : (positive number, positive number)
    #outline // : positive number
    #tilt = 0 // : number
    #shear = 0

    #fill = false;

    #colormode = 255;

    #_x;
    #_y;
    get #x() {
        return this.#_x;
    }
    set #x(x) {
        this.#_x = x;
    }
    get #y() {
        return this.#_y;
    }
    set #y(y) {
        this.#_y = y;
    }
    #_turtleshape
    get #turtleshape() {
        return this.#_turtleshape;
    }
    set #turtleshape(name) {
        this.#_turtleshape = name;
        // this.#canvas.drawShape([this.#x, this.#y], { shape: this.#_turtleshape, rotate: this.#orient.valueOf() })
    }
    #tracer;
    #delay;
    #motion(fn) {
        const speed = this.#speed, tracer = this.#tracer, delay = this.#delay;
        this.#speed = this.#tracer = this.#delay = 0;
        fn();
        this.#speed = speed, this.#tracer = tracer, this.#delay = delay;
    }
    
    #pos() {
        const obj = [this.#x, this.#y];
        obj.x = this.#x;
        obj.y = this.#y;
        return obj;
    }
    #move(fn) {
        // draw in here
        const before = this.#pos();
        fn();
        const after = this.#pos();
        if(this.#pendown) {
            this.#canvas.line(this.convertTurtleCoordinate(before), this.convertTurtleCoordinate(after), {
                color: this.#pencolor,
                width: this.#pensize
            });
        }
        this.#canvas.drawShape(this.convertTurtleCoordinate(this.#pos()), {
            shape: this.#PEN,
            rotate: toRad(this.#orient)
        });
    }
    #_orient = 0
    get #orient() {
        return this.#_orient;
    }
    set #orient(orient) {
        if(orient instanceof Vec2D) {
            this.#_orient = toDeg(orient.valueOf());
        } else {
            this.#_orient = orient;
        }
    }
    #anglemode = RawTurtle.#MODE_DEGREEE; // RawTurtle.#MODE_DEGREEE RawTurtle.#MODE_RADIANS
    get orient() {
        if(this.#anglemode === RawTurtle.#MODE_DEGREEE) {
            return this.#orient;
        } else {
            return toRad(this.#orient);
        }
    }
    set orient(angle) {
        if(this.#anglemode === RawTurtle.#MODE_DEGREEE) {
            this.#orient = normalize(angle);
        } else {
            this.#orient = normalize(toRad(angle));
        }
    }
    get #fullcircle() {
        return this.#anglemode === RawTurtle.#MODE_DEGREEE ? 360 : PI_2;
    }
    get #degreesPerAU() {
        return 360 / this.#fullcircle;
    }
    get #angleOffset() {
        return {
            [RawTurtle.MODES.STANDARD]: 0,
            [RawTurtle.MODES.WORLD]   : 0,
            [RawTurtle.MODES.LOGO]    : this.#fullcircle / 4
        }[this.#mode ?? RawTurtle.DEFAULT_MODE];
    }
    get #angleOrient () {
        return {
            [RawTurtle.MODES.STANDARD]: 1,
            [RawTurtle.MODES.WORLD]   : 1,
            [RawTurtle.MODES.LOGO]    : -1
        }[this.#mode ?? RawTurtle.DEFAULT_MODE]
    }
    setundobuffer(buffer) {
        this.#undobuffer = buffer;
    }
    forward(distance) {
        this.#move(() => {
            // cos(angle) = x / distance
            this.#x += Math.cos(toRad(this.#orient)) * distance;
            // sin(angle) = y / distance
            this.#y -= Math.sin(toRad(this.#orient)) * distance;
        });
    }
    fd(distance) {
        this.forward(distance);
    }
    back(distance) {
        this.forward(-distance)
    }
    backward(distance) {
        this.forward(-distance)
    }
    bk(distance) {
        this.forward(-distance)
    }
    left(angle) {
        this.#move(() => {
            if(this.#anglemode === RawTurtle.#MODE_DEGREEE) {
                this.#orient = normalize(this.#orient - angle);
            } else {
                this.#orient = normalize(this.#orient - toRad(angle));
            }
        });
    }
    lt(angle) {
        this.left(angle);
    }
    right(angle) {
        this.left(-angle);
    }
    rt(angle) {
        this.right(angle);
    }
    goto(x, y) {
        const [x1, y1] = Vec2D.normalizeArgs(x, y);
        this.#move(() => {
            this.#x = x1;
            this.#y = y1;
        });
    }
    setpos(x, y) {
        this.goto(x,y);
    }
    setposition(x, y) {
        this.goto(x,y);
    }
    setx(x) {
        this.#move(() => {
            this.#x = x;
        });
    }
    sety(y) {
        this.#move(() => {
            this.#y = y;
        });
    }
    setheading(angle) {
        this.#move(() => {
            this.orient = angle;
        })
    }
    seth(angle) {
        this.setheading(angle);
    }
    home() {
        this.#move(() => {
            this.#x = 0;
            this.#y = 0;
            this.orient = 0;
        });
    }
    circle(radius, extent = null, steps = null) {
        extent ??= this.#fullcircle;
        steps ??= 1 + parseInt(Math.min(11+Math.abs(radius) / 6.0, 59.0) * Math.abs(extent) / this.#fullcircle);
        let w = 1.0 * extent / steps;
        let w2 = 0.5 * w;
        let l = 2.0 * radius * Math.sin(Math.radians(w2)*this.#degreesPerAU);
        if(radius < 0) {
            l = -l, w = -w, w2 = -w2;
        }
        for(let i = 0; i < steps; i++) {
            this.#motion(() => {
                this.orient = toDeg(toRad(this.orient) * w2);
            });
            this.forward(l);
        }
    }
    dot(size, color) {
        // overload
        if(!color) {
            if(typeof size === 'string') {
                color = size;
                size = this.#pensize + Math.max(this.#pensize, 4);
            } else {
                color = this.#pencolor;
                size ??= this.#pensize + Math.max(this.#pensize, 4);
            }
                
        } else {
            size ??= this.#pensize + Math.max(this.#pensize, 4);
        }
        // overload end
        this.#canvas.circle(this.convertTurtleCoordinate(this.#pos()), {
            radius: size / 2,
            color,
            fill: true
        });

    }
    #turtlestamps = [];
    stamp() {
        const id = this.#canvas.drawShape(this.convertTurtleCoordinate(this.#pos()), {
            shape: this.#turtleshape,
            rotate: toRad(this.#orient)
        });
        this.#turtlestamps.push(id);
        return id;
    }
    clearstamp(id) {
        this.#turtlestamps.splice(this.#turtlestamps.indexOf(id), 1);
        this.#canvas.removeShape(id);
    }
    clearstamps(n) {
        const deletedElements = this.#turtlestamps.splice(n < 0 ? n : 0, n);
        deletedElements.forEach(id => {
            this.#canvas.removeShape(id);
        })
    }
    undo(n) {
        // todo
    }
    speed(n) {
        // todo
    }
    position() {
        return new Vec2D(this.#pos());
    }
    pos() {
        return this.position();
    }
    towards(x0, y0) {
        const [x1, y1] = normalizeArgs(x0, y0);
        const x = this.#x - x1, y = this.#y - y2;
        let result = Math.degrees(Math.atan2(y, x)) % 360.0;
        result /= this.#degreesPerAU;
        return (this.#angleOffset + this.#angleOrient * result) % this.#fullcircle;
    }
    xcor() {
        return this.#x;
    }
    ycor() {
        return this.#y;
    }
    heading() {
        return this.orient;
    }
    distance(x0, y0) {
        const [x, y] = normalizeArgs(x0, y0);
        return new Vec2D([x, y]).substract(this.#pos()).abs();
    }
    degrees() {
        this.#anglemode = RawTurtle.#MODE_DEGREEE;
    }
    radians() {
        this.#anglemode = RawTurtle.#MODE_RADIANS;
    }
    pendown() {
        this.#pendown = true;
    }
    pd() {
        this.pendown();
    }
    down() {
        this.pendown();
    }
    penup() {
        this.#pendown = false;
    }
    pu() {
        this.penup();
    }
    up() {
        this.penup();
    }
    pensize(width) {
        if(!width) return this.#pensize;
        this.#pensize = width;
    }
    width(...args) {
        return this.pensize(...args);
    }
    pen(...dicts) {
        dicts.reduce((p, dict) => {
            const {
                shown,
                pendown,
                pencolor,
                fillcolor,
                pensize,
                speed,
                resizemode,
                stretchfactor,
                outline,
                tilt,
            } = dict;
            if(shown !== undefined) this.#shown = shown;
            if(pendown !== undefined) this.#pendown = pendown;
            if(pencolor !== undefined) this.#pencolor = pencolor;
            if(fillcolor !== undefined) this.#fillcolor = fillcolor;
            if(pensize !== undefined) this.#pensize = pensize;
            if(speed !== undefined) this.#speed = speed;
            if(resizemode !== undefined) this.#resizemode = resizemode;
            if(stretchfactor !== undefined) this.#stretchfactor = stretchfactor;
            if(outline !== undefined) this.#outline = outline;
            if(tilt !== undefined) this.#tilt = tilt;
            return this;
        }, this);
        return {
            shown: this.#shown,
            pendown: this.#pendown,
            pencolor: this.#pencolor,
            fillcolor: this.#fillcolor,
            pensize: this.#pensize,
            speed: this.#speed,
            resizemode: this.#resizemode,
            stretchfactor: this.#stretchfactor,
            outline: this.#outline,
            tilt: this.#tilt,
        }
    }
    isdown() {
        return this.#pendown
    }
    #convertColorTo255(r, g, b) {
        if(this.#colormode === 255) {
            return `rgb(${(Array.isArray(r) ? r : [r, g, b]).join(', ')})`;
        }
        if(this.#colormode === 1) {
            return `rgb(${(Array.isArray(r) ? r : [r, g, b]).map((percent) => parseInt(percent * 255)).join(', ')})`;
        }
    }
    pencolor(r, g, b) {
        if(!r) return this.#pencolor;
        this.#pencolor = typeof r === 'string' ? r : this.#convertColorTo255(r, g, b);
    }
    fillcolor(r, g, b) {
        if(!r) return this.#fillcolor;
        this.#fillcolor = typeof r === 'string' ? r : this.#convertColorTo255(r, g, b);
    }
    color(r, g, b) {
        if(!r) {
            return [
                this.pencolor(),
                this.fillcolor(),
            ]
        }
        if(!b) {
            this.pencolor(r);
            this.fillcolor(g);
        }
        if(b) {
            this.pencolor(r, g, b);
            this.fillcolor(r, g, b);
        }
    }
    
    filling() {
        return this.#fill;
    }
    begin_fill() {
        this.#fill = true;
    }
    end_fill() {
        this.#fill = false;
    }
    reset() {
        this.#x = 0;
        this.#y = 0
        // todo
    }
    clear() {
        this.#canvas.clear();
    }
    write(arg, move = false, align = 'left', font = ['Arial', 8, 'normal']) {
        const { w, h } = this.#canvas.write(this.convertTurtleCoordinate([this.#x, this.#y]), {
            arg, move, alig, font
        });
        if(move) {
            this.#x += this.canvasToTurtle(w, h).w;
        }
    }
    showturtle() {
        this.#shown = true;
    }
    st() {
        this.showturtle()
    }
    hideturtle() {
        this.#shown = false;
    }
    ht() {
        this.hideturtle();
    }
    isvisible() {
        return this.#shown;
    }
    shape(name) {
        if(!name) {
            return this.#turtleshape;
        }
        this.#turtleshape = name;
    }
    resizemode(mode) {
        if(!mode) return this.#resizemode;
        this.#resizemode = mode;
    }
    shapesize(stretch_wid, stretch_len, outline) {
        if(stretch_wid === undefined && stretch_len === undefined &&  outline === undefined) {
            return [...this.#stretchfactor, this.#outline]
        }
        if(stretch_wid === 0 || stretch_len === 0) {
            throw new Error("stretch_wid/stretch_len must not be zero");
        }
        this.#stretchfactor = [stretch_wid ?? this.#stretchfactor[0], stretch_len ?? stretch_wid ?? this.#stretchfactor[1]];
        this.#outline = outline ?? this.#outline;
        this.#resizemode(RawTurtle.RESIZEMODE.USER);
    }
    turtlesize(stretch_wid, stretch_len, outline) {
        return shapesize(stretch_wid, stretch_len, outline)
    }
    shearfactor(shear) {
        if(!shear) return this.#shear;
        this.#shear = shear;
        this.#resizemode(RawTurtle.RESIZEMODE.USER);
    }
    settiltangle(tilt) {
        this.#tilt += tilt;
        this.#resizemode(RawTurtle.RESIZEMODE.USER);
    }
    tilt(tilt) {
        this.#tilt = tilt;
        this.#resizemode(RawTurtle.RESIZEMODE.USER);
    }
    tiltangle(tilt) {
        if(!tilt) return this.#tilt;
        this.#tilt = tilt;
        this.#resizemode(RawTurtle.RESIZEMODE.USER);
    }
    #shapetrafo = [1, 1, 1, 1]
    shapetransform(t11, t12, t21, t22) {
        if([t11, t12, t21, t22].every(i => i === undefined)) {
            return this.#shapetrafo;
        }
        let [m11, m12, m21, m22] = this.#shapetrafo;
        m11 = t11 ?? m11;
        m12 = t12 ?? m12;
        m21 = t21 ?? m21;
        m22 = t22 ?? m22;
        if(m11 * m22 - m12 * m21 === 0) {
            throw new Error("Bad shape transform matrix: must not be singular");
        }
        this.#shapetrafo = [m11, m12, m21, m22]
        const alfa = Math.atan2(-m21, m11) % PI_2;
        const sa = Math.sin(alfa), ca = Math.cos(alfa);
        const [a11, a12, a21, a22] = [ca*m11 - sa*m21, ca*m12 - sa*m22,
                                        sa*m11 + ca*m21, sa*m12 + ca*m22];
        this.#stretchfactor = [a11, a22];
        this.#shear = a12/a22;
        this.#tilt = alfa;
        this.#resizemode(RawTurtle.RESIZEMODE.USER);
    }
    get_shapepoly() {
        return RawTurtle[`${this.#turtleshape}Polygon`].data;
    }
    #eventlisteners = {
        click: {},
        release: {},
        drag: {},
    };
    onclick(fun, btn = 1, add = null) {
        if(fun === null) { // fun === null -> remove event listeners
            this.#eventlisteners.click = {};
        }
        if(add !== true) { // add === true -> add new listener, else replace
            this.#eventlisteners.click = {};
        }
        if(typeof fun === 'function') {
            this.#eventlisteners.click[`button${btn}`] ??= [];
            this.#eventlisteners.click[`button${btn}`].push(fun);
        }
    }
    onrelease() {
        if(fun === null) { // fun === null -> remove event listeners
            this.#eventlisteners.release = {};
        }
        if(add !== true) { // add === true -> add new listener, else replace
            this.#eventlisteners.release = {};
        }
        if(typeof fun === 'function') {
            this.#eventlisteners.release[`button${btn}`] ??= [];
            this.#eventlisteners.release[`button${btn}`].push(fun);
        }
    }
    ondrag() {
        if(fun === null) { // fun === null -> remove event listeners
            this.#eventlisteners.drag = {};
        }
        if(add !== true) { // add === true -> add new listener, else replace
            this.#eventlisteners.drag = {};
        }
        if(typeof fun === 'function') {
            this.#eventlisteners.drag[`button${btn}`] ??= [];
            this.#eventlisteners.drag[`button${btn}`].push(fun);
        }
    }
    mode(mode) {
        if(!mode) {
            return this.#mode;    
        }
        this.#mode = mode;
        // todo: implement implications!
    }
    #llx = -100;
    #lly = -100;
    #urx =  100;
    #ury =  100;
    setworldcoordinates(llx, lly, urx, ury) {
        if(this.mode() !== RawTurtle.MODES.WORLD) {
            this.mode(RawTurtle.MODES.WORLD);
        }
        this.#llx = llx;
        this.#lly = lly;
        this.#urx = urx;
        this.#ury = ury;
    }
    convertTurtleCoordinate(xx, yy) {
        const objx = normalizeArgs(xx, yy);
        const [x, y] = objx;
        const x0 = this.#llx;
        const y0 = this.#lly;
        const x1 = this.#urx;
        const y1 = this.#ury;
        const widthX = x1 - x0;
        const widthY = y1 - y0;
        const w = this.#canvas.width;
        const h = this.#canvas.height;

        /*
        x | x*
        -100 | 0
        0 | 5
        100 | 10

        x* = w / (x1 - x0) * x -w / (x1 - x0) * x0;
        
        x* = (10 - 0) / (100 - -100) * x - (10 - 0) / (100 - -100) * -100 = x / 20 + 5
        x*(-100) = -100 / 20 + 5 = 0
        x*(0) = 0 / 20 + 5 = 5
        x*(100) = 100 / 20 + 5 = 10

        y* = h / (y1 - y0) * y + h / (y1 - y0) * y0;
        */

        
        const x0y0 = this.#canvas.x0y0;
        const [TB, LR] = x0y0.split("");
        const flipped = (f1, f2, isFlipped) => isFlipped ? f1 + f2 : f1 - f2;
        const xn = flipped(w / (x1 - x0) * x, w / (x1 - x0) * x0, LR === "R");
        const yn = flipped(h / (y1 - y0) * y, h / (y1 - y0) * y0, TB === "T");
        const obj = [xn, -yn];
        obj.x = xn;
        obj.y = -yn;
        return obj;

    }
    convertCanvasCoordinate(xx, yy) {
        const [x, py] = normalizeArgs(xx, yy);
        const y = -py;
        const x0 = this.#llx;
        const y0 = this.#lly;
        const x1 = this.#urx;
        const y1 = this.#ury;
        const widthX = x1 - x0;
        const widthY = y1 - y0;
        const w = this.#canvas.width;
        const h = this.#canvas.height;

        const x0y0 = this.#canvas.x0y0;
        const [TB, LR] = x0y0.split("");
        
        // xn = w / (x1 - x0) * x - w / (x1 - x0) * x0
        // xn + w / (x1 - x0) * x0 = w / (x1 - x0) * x
        // w / (xn + w / (x1 - x0) * x0) = (x1 - x0) * x
        // w / (xn + w / (x1 - x0) * x0) / (x1 - x0) =  1/x
        const flipped = (f1, f2, isFlipped) => isFlipped ? f1 - f2 : f1 + f2;
        const xn = (x1 - x0) / w * flipped(x, w / (x1 - x0) * x0, LR === "R");
        const yn = (y1 - y0) / h * flipped(y, h / (y1 - y0) * y0, TB === "T");
        const obj = [xn, yn];
        obj.x = xn;
        obj.y = yn;
        return obj;
    }
    turtleToCanvas(dx, dy) {
        const wt = this.#urx - this.#llx;
        const ht =  this.#ury - this.#lly;
        const w = this.#canvas.width;
        const h = this.#canvas.height;
        const xn = dx / wt * w;
        const yn = dy / ht * h;
        const obj = [xn, yn];
        obj.x = obj.w = xn;
        obj.y = obj.h = yn;
        return obj; 
    }
    canvasToTurtle(dx, dy) {
        const wt = this.#urx - this.#llx;
        const ht =  this.#ury - this.#lly;
        const w = this.#canvas.width;
        const h = this.#canvas.height;
        const xn = dx * wt / w;
        const yn = dy * ht / h;
        const obj = [xn, yn];
        obj.x = obj.w = xn;
        obj.y = obj.h = yn;
        return obj; 
    }

}




/*
Special Turtle methods
begin_poly()
end_poly()
get_poly()
clone()
getturtle() | getpen()
getscreen()
setundobuffer()
undobufferentries()
*/

/*
Methods of TurtleScreen/Screen
Window control
bgcolor()
bgpic()
clearscreen()
resetscreen()
screensize()
setworldcoordinates()
*/

/*
Animation control
delay()
tracer()
update()
*/

/*
Using screen events
listen()
onkey() | onkeyrelease()
onkeypress()
onclick() | onscreenclick()
ontimer()
mainloop() | done()
*/

/*
Settings and special methods
mode()
colormode()
getcanvas()
getshapes()
register_shape() | addshape()
turtles()
window_height()
window_width()
Input methods
textinput()
numinput()
Methods specific to Screen
bye()
exitonclick()
setup()
title()
*/

class Turtle extends RawTurtle {
    constructor({ renderInto }) {
        super(PixiCanvas.defaultCanvas, renderInto);
        this.setundobuffer(1000);
    }
    


}

const sleep = ms => new Promise(res => setTimeout(res, ms));
const turtle = new Turtle({
    renderInto: document.getElementById("screen")
});

for(var i = 0; i < 5; i ++) {
    turtle.goto(10 * i, 10 * i)
    turtle.setheading(0)
    turtle.pendown()
    turtle.setheading(0)
    await sleep(100)
    turtle.forward(20);
    await sleep(100)
    turtle.left(45)
    await sleep(100)
    turtle.forward(10);
    await sleep(100)
    turtle.left(45)
    await sleep(100)
    turtle.forward(10);
    await sleep(100)
    turtle.left(45)
    await sleep(100)
    turtle.forward(10);
    await sleep(100)
    turtle.left(45)
    await sleep(100)
    turtle.forward(10);
    await sleep(100)
    turtle.left(45)
    await sleep(100)
    turtle.forward(10);
    await sleep(100)
    turtle.left(45)
    await sleep(100)
    turtle.forward(10);
    await sleep(100)
    turtle.left(45)
    await sleep(100)
    turtle.forward(10);
    await sleep(100)
    turtle.left(45)
    await sleep(100)
    turtle.forward(10);
    await sleep(100)
    turtle.penup()
}




/*
[
    { x: 10, y : 20 },
    { x: 100, y : 100 },
    { x: -100, y : -100 },
    { x: 0, y : 0 }
].map(({x, y}) => {
    const { x: x0, y: y0 } = turtle.convertTurtleCoordinate(x, y);
    const r = turtle.convertCanvasCoordinate(x0, y0);
    console.log('coordinates', {x, y},x0, y0, r);
});

[
    { x: 10, y : 20 },
    { x: 100, y : 100 },
    { x: -100, y : -100 },
    { x: 0, y : 0 }
].map(({x, y}) => {
    const { x: x0, y: y0 } = turtle.turtleToCanvas(x, y);
    const r = turtle.canvasToTurtle(x0, y0);
    console.log('distance', {x, y},x0, y0, r);
});
*/




