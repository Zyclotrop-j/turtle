import { PixiCanvas } from "./canvas.js";
import { Dialog } from "./dialog.js";
import { PI_2, toRad, toDeg, normalize, normalizeArgs, Vec2D } from "./util.js"
import { Shape } from "./shape.js"
import { Value } from "./value.js"

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

const undobuffer = (obj, that) => new Proxy(Array.from(obj ?? { length: that.__undobuffersize ?? 1000 }), {
  get(obj, prop) {
    const prune = () => {
      if(that.__undobuffersize === null) {
          obj.splice(0, obj.length);
      }
      while(typeof that.__undobuffersize === 'number' && that.__undobuffersize > -1 && obj.length > that.__undobuffersize) {
          obj.pop();
      }
    };
    if(prop === 'prune') {
      return prune;
    }
    if (prop in obj && typeof obj[prop] === 'function') {
      return (...args) => {
          const r = obj[prop](...args);
          prune();
          return r;
      };
    }
    if (prop === 'size') {
      return obj.length;
    }
  }
});
const SHAPE_90_DEG_ROTATE = { rotate: toRad(-90) };
const SHAPE_WIDTH_HEIGHT_1 = {width: 1, height: 1 };
class RawTurtle {
    static #turtles = new Set();
    constructor(canvas, domelement) {
        RawTurtle.#turtles.add(new WeakRef(this));
        this.__regsiterCanvas(canvas);
        if(domelement) {
            this.renderInto(domelement);
        }
        this.__undobuffersize = null;
        this.__undobuffer = undobuffer(undefined, this);
        this.___orient = RawTurtle.START_ORIENTATION[this.__mode ?? RawTurtle.DEFAULT_MODE];
        //Object.values(RawTurtle.TURTLE_SHAPES).forEach(shapename => {
        //    this.__canvas.registerShape(name, 'assets/turtle.png')
        //});
        this.___turtleshape = RawTurtle.TURTLE_SHAPES.TURTLE;
        this.__registerNewTurtle();

        this.reset();
    }
    static __canvasregistrations = new WeakMap()
    __regsiterCanvas(canvas = this.__canvas) {
        if(RawTurtle.__canvasregistrations.has(this)) {
            throw new Error(`Registering a canvas is only allowed to happen once per turtle!`);
        }
        const canvast = canvas.bind(this);
        RawTurtle.__canvasregistrations.set(this, canvast);
        const canvasIndex = RawTurtle.__canvasDirectory.indexOf(canvast);
        if(canvasIndex > -1) {
            this.__canvasindex = canvasIndex;
        } else {
            RawTurtle.__canvasDirectory.push(canvast);
            this.__canvasindex = RawTurtle.__canvasDirectory.length - 1;
        }
    }
    static buildAppearanceKey(__PEN, k) {
        return `${__PEN}__turtle_appearance__${k}`;
    }
    static __pens = new WeakMap()
    __registerNewTurtle() {
        if(RawTurtle.__pens.has(this)) {
            throw new Error(`Registering a pen is only allowed to happen once per turtle!`);
        }
        this.__PEN = `PEN_${++RawTurtle.__turtlecounter}`;
        RawTurtle.__pens.set(this,this.__PEN);
        const buttonStates = {};
        Object.values(RawTurtle.TURTLE_SHAPES).forEach((k) => {
            this.__canvas.registerShape(RawTurtle.buildAppearanceKey(this.__PEN, k), RawTurtle[`${k}Polygon`], { protected: true });
        })
        
        this.__canvas.registerShape(this.__PEN, RawTurtle[`${RawTurtle.TURTLE_SHAPES.TURTLE}Polygon`], {
            // todo: setup event listeners for screen and turtle!
            // when click on canvas, then check this.__exitonclick -> if yes, call this.bye
            interactive: true, buttonMode: true,
            onpointerdown: (event) => {
                // https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
                const btn = event.button + 1; 
                const { x, y } = event.screen; // does this property exist?
                buttonStates[btn] = true;
                this.__eventlisteners.click?.[`button${btn}`]?.forEach(fn => {
                    fn(x, y);
                })
            },
            onpointerup: (event) => {
                const btn = event.button + 1; 
                const { x, y } = event.screen; // does this property exist?
                buttonStates[btn] = false;
                this.__eventlisteners.release?.[`button${btn}`]?.forEach(fn => {
                    fn(x, y);
                })
            },
            onpointermove: (event) => {
                const btn = event.button + 1; 
                if(buttonStates[btn]) {
                    const { x, y } = event.screen; // does this property exist?
                    this.__eventlisteners.release?.[`button${btn}`]?.forEach(fn => {
                        fn(x, y);
                    });
                }
            },
            protected: true,
        });
    }
    static __canvasDirectory = [];
    renderInto(domElement) {
        this.__canvas.renderInto(domElement);
    }
    static get shapetypepolygon() {
        return Shape.types.POLYGON;
    }
    get shapetypepolygon() {
        return Shape.types.POLYGON;
    }
    static __turtlecounter = 0;
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
    static __MODE_DEGREEE = "DEGREE"
    static __MODE_RADIANS = "RADIANS";
    static RESIZEMODE = {
        AUTO: "auto",
        USER: "user",
        NORESIZE: "noresize"
    }
    static _CFG = {
        "width" : 0.5,  //todo             // Screen
        "height" : 0.75,    //todo  
        "canvwidth" : 400,    //todo  
        "canvheight": 300,  //todo
        "leftright": null,  //todo
        "topbottom": null,  //todo
        "mode": "standard",          // TurtleScreen
        "colormode": 1,
        "delay": 10,
        "undobuffersize": 1000,  //todo      // RawTurtle
        "shape": "classic",  //todo
        "pencolor" : "black",
        "fillcolor" : "black",
        "resizemode" : RawTurtle.RESIZEMODE.NORESIZE,
        "visible" : true,
        "language": "english",  //todo        // docstrings
        "exampleturtle": "turtle",  //todo
        "examplescreen": "screen",  //todo
        "title": "Python Turtle Graphics",  //todo
        "using_IDLE": false,  //todo
        "_pensize": 1 // non-standard-option
    }

    __PEN

    __mode = RawTurtle.DEFAULT_MODE;
    __canvasindex
    get __canvas() {
        return RawTurtle.__canvasDirectory[this.__canvasindex];
    }
    set __canvas(canvas) {
        RawTurtle.__canvasDirectory[this.__canvasindex] = canvas;
    }
    __undobuffersize;

    __shown = RawTurtle._CFG.visible // : True/False
    __pendown = true // : True/False
    __pencolor = RawTurtle._CFG.pencolor // : color-string or color-tuple
    __fillcolor = RawTurtle._CFG.fillcolor // : color-string or color-tuple
    __pensize = RawTurtle._CFG._pensize // : positive number
    __speed = 3 // : number in range 0..10
    ___resizemode = RawTurtle._CFG.resizemode // : “auto” or “user” or “noresize” // todo: when this is set, re-calc the turtle
    static turtlePolygon = new Shape(
        RawTurtle.shapetypepolygon,
        [[0,16], [-2,14], [-1,10], [-4,7],[-7,9], [-9,8], [-6,5], [-7,1], [-5,-3], [-8,-6],[-6,-8], [-4,-5], [0,-7], [4,-5], [6,-8], [8,-6],[5,-3], [7,1], [6,5], [9,8], [7,9], [4,7], [1,10],[2,14]],
        SHAPE_90_DEG_ROTATE
    );
    static arrowPolygon = new Shape(
        RawTurtle.shapetypepolygon,
        [[-10, 0], [10, 0], [0, 10]],
        SHAPE_90_DEG_ROTATE
    )
    static circlePolygon = new Shape(
        RawTurtle.shapetypepolygon, [[10,0], [9.51,3.09], [8.09,5.88],
        [5.88,8.09], [3.09,9.51], [0,10], [-3.09,9.51],
        [-5.88,8.09], [-8.09,5.88], [-9.51,3.09], [-10,0],
        [-9.51,-3.09], [-8.09,-5.88], [-5.88,-8.09],
        [-3.09,-9.51], [-0.00,-10.00], [3.09,-9.51],
        [5.88,-8.09], [8.09,-5.88], [9.51,-3.09]],
        SHAPE_90_DEG_ROTATE
    )
    static squarePolygon = new Shape(
        RawTurtle.shapetypepolygon,
        [[10,-10], [10,10], [-10,10], [-10,-10]],
        SHAPE_90_DEG_ROTATE
    )
    static trianglePolygon = new Shape(
        RawTurtle.shapetypepolygon,
        [[10,-5.77], [0,11.55], [-10,-5.77]],
        SHAPE_90_DEG_ROTATE
    )
    static classicPolygon = new Shape(
        RawTurtle.shapetypepolygon,
        [[0,0],[-5,-9],[0,-7],[5,-9]],
        SHAPE_90_DEG_ROTATE
    )
    static blankPolygon = new Shape(
        Shape.types.BINARY,
        new Uint8Array(),
        SHAPE_WIDTH_HEIGHT_1
    )
    get __resizemode() {
        return this.___resizemode;
    }
    set __resizemode(value) {
        this.___resizemode = value;
        switch(this.___resizemode) {
            case RawTurtle.RESIZEMODE.AUTO: {
                this.modifyShape([], {
                    shape: this.__PEN,
                    rotate: toRad(this.__orient) + this.__tilt,
                    scale: [this.__pensize, this.__pensize],
                    // skew: 
                    // todo: transform shape with tilt and shear
                })
                break;
            }
            case RawTurtle.RESIZEMODE.USER: {
                // w = this.__outline
                this.modifyShape([], {
                    shape: this.__PEN,
                    rotate: toRad(this.__orient),
                    scale: this.__stretchfactor,
                    // skew: 
                    // todo: transform shape with tilt and shear
                })
                break;
            }
            case RawTurtle.RESIZEMODE.NORESIZE: {
                // w = 1
                this.modifyShape([], {
                    shape: this.__PEN,
                    rotate: toRad(this.__orient),
                    scale: [1, 1],
                    // skew: 
                    // todo: transform shape with tilt and shear
                })
                break;
            }
        }
    }
    __stretchfactor = [1, 1] // : (positive number, positive number)
    __outline // : positive number
    __tilt = 0 // : number
    __shear = 0

    __fill = false;

    __colormode = RawTurtle._CFG.colormode;

    ___x;
    ___y;
    get __x() {
        return this.___x;
    }
    set __x(x) {
        this.___x = x;
    }
    get __y() {
        return this.___y;
    }
    set __y(y) {
        this.___y = y;
    }
    ___turtleshape
    get __turtleshape() {
        return this.___turtleshape;
    }
    set __turtleshape(name) {
        this.___turtleshape = name;
        this.__canvas.modifyShape([], {
            shape: this.__PEN,
            appearance: RawTurtle.buildAppearanceKey(this.__PEN, name),
        });
    }
    __tracer
    __delay = RawTurtle._CFG.delay;
    __motion(fn) {
        const speed = this.__speed, tracer = this.__tracer, delay = this.__delay;
        this.__speed = this.__tracer = this.__delay = 0;
        fn();
        this.__speed = speed, this.__tracer = tracer, this.__delay = delay;
    }
    
    __pos() {
        const obj = [this.__x, this.__y];
        obj.x = this.__x;
        obj.y = this.__y;
        return obj;
    }
    __move(fn) {
        // draw in here
        const before = this.__pos();
        fn();
        const after = this.__pos();
        if(this.__pendown) {
            this.__canvas.line(this.convertTurtleCoordinate(before), this.convertTurtleCoordinate(after), {
                color: this.__pencolor,
                width: this.__pensize
            });
        }
        if(this.__recordpoly) {
            this.__polyrecord.push([this.__x, this.__y]);
        }
        this.__canvas.drawShape(this.convertTurtleCoordinate(this.__pos()), {
            shape: this.__PEN,
            rotate: toRad(this.__orient)
        });
    }
    ___orient = 0
    get __orient() {
        return this.___orient;
    }
    set __orient(orient) {
        if(orient instanceof Vec2D) {
            this.___orient = toDeg(orient.valueOf());
        } else {
            this.___orient = orient;
        }
    }
    __anglemode = RawTurtle.__MODE_DEGREEE; // RawTurtle.__MODE_DEGREEE RawTurtle.__MODE_RADIANS
    get orient() {
        if(this.__anglemode === RawTurtle.__MODE_DEGREEE) {
            return this.__orient;
        } else {
            return toRad(this.__orient);
        }
    }
    set orient(angle) {
        if(this.__anglemode === RawTurtle.__MODE_DEGREEE) {
            this.__orient = normalize(angle);
        } else {
            this.__orient = normalize(toRad(angle));
        }
    }
    get __fullcircle() {
        return this.__anglemode === RawTurtle.__MODE_DEGREEE ? 360 : PI_2;
    }
    get __degreesPerAU() {
        return 360 / this.__fullcircle;
    }
    get __angleOffset() {
        return {
            [RawTurtle.MODES.STANDARD]: 0,
            [RawTurtle.MODES.WORLD]   : 0,
            [RawTurtle.MODES.LOGO]    : this.__fullcircle / 4
        }[this.__mode ?? RawTurtle.DEFAULT_MODE];
    }
    get __angleOrient () {
        return {
            [RawTurtle.MODES.STANDARD]: 1,
            [RawTurtle.MODES.WORLD]   : 1,
            [RawTurtle.MODES.LOGO]    : -1
        }[this.__mode ?? RawTurtle.DEFAULT_MODE]
    }
    setundobuffer(buffer) {
        this.__undobuffersize = buffer;
        this.__undobuffer.prune();
    }
    forward(distance) {
        this.__move(() => {
            // cos(angle) = x / distance
            this.__x += Math.cos(toRad(this.__orient)) * distance;
            // sin(angle) = y / distance
            this.__y -= Math.sin(toRad(this.__orient)) * distance;
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
        this.__move(() => {
            if(this.__anglemode === RawTurtle.__MODE_DEGREEE) {
                this.__orient = normalize(normalize(this.__orient) - normalize(angle));
            } else {
                this.__orient = normalize(this.__orient - toRad(angle));
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
        this.__move(() => {
            this.__x = x1;
            this.__y = y1;
        });
    }
    setpos(x, y) {
        this.goto(x,y);
    }
    setposition(x, y) {
        this.goto(x,y);
    }
    setx(x) {
        this.__move(() => {
            this.__x = x;
        });
    }
    sety(y) {
        this.__move(() => {
            this.__y = y;
        });
    }
    setheading(angle) {
        this.__move(() => {
            this.orient = angle;
        })
    }
    seth(angle) {
        this.setheading(angle);
    }
    home() {
        this.__move(() => {
            this.__x = 0;
            this.__y = 0;
            this.orient = 0;
        });
    }
    circle(radius, extent = null, steps = null) {
        extent ??= this.__fullcircle;
        steps ??= 1 + parseInt(Math.min(11+Math.abs(radius) / 6.0, 59.0) * Math.abs(extent) / this.__fullcircle);
        let w = 1.0 * extent / steps;
        let w2 = 0.5 * w;
        let l = 2.0 * radius * Math.sin(Math.radians(w2)*this.__degreesPerAU);
        if(radius < 0) {
            l = -l, w = -w, w2 = -w2;
        }
        for(let i = 0; i < steps; i++) {
            this.__motion(() => {
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
                size = this.__pensize + Math.max(this.__pensize, 4);
            } else {
                color = this.__pencolor;
                size ??= this.__pensize + Math.max(this.__pensize, 4);
            }
                
        } else {
            size ??= this.__pensize + Math.max(this.__pensize, 4);
        }
        // overload end
        this.__canvas.circle(this.convertTurtleCoordinate(this.__pos()), {
            radius: size / 2,
            color,
            fill: true
        });

    }
    __turtlestamps = [];
    stamp() {
        const id = this.__canvas.drawShape(this.convertTurtleCoordinate(this.__pos()), {
            shape: this.__turtleshape, // todo: clone!!
            rotate: toRad(this.__orient)
        });
        this.__turtlestamps.push(id);
        return id;
    }
    clearstamp(id) {
        this.__turtlestamps.splice(this.__turtlestamps.indexOf(id), 1);
        this.__canvas.removeShape(id);
    }
    clearstamps(n) {
        const deletedElements = this.__turtlestamps.splice(n < 0 ? n : 0, n);
        deletedElements.forEach(id => {
            this.__canvas.removeShape(id);
        })
    }
    undo(n) {
        // todo
    }
    speed(n) {
        if(n === undefined) return this.__speed;
        this.__speed = n;
    }
    position() {
        return new Vec2D(this.__pos());
    }
    pos() {
        return this.position();
    }
    towards(x0, y0) {
        const [x1, y1] = normalizeArgs(x0, y0);
        const x = this.__x - x1, y = this.__y - y2;
        let result = Math.degrees(Math.atan2(y, x)) % 360.0;
        result /= this.__degreesPerAU;
        return (this.__angleOffset + this.__angleOrient * result) % this.__fullcircle;
    }
    xcor() {
        return this.__x;
    }
    ycor() {
        return this.__y;
    }
    heading() {
        return this.orient;
    }
    distance(x0, y0) {
        const [x, y] = normalizeArgs(x0, y0);
        return new Vec2D([x, y]).substract(this.__pos()).abs();
    }
    degrees() {
        this.__anglemode = RawTurtle.__MODE_DEGREEE;
    }
    radians() {
        this.__anglemode = RawTurtle.__MODE_RADIANS;
    }
    pendown() {
        this.__pendown = true;
    }
    pd() {
        this.pendown();
    }
    down() {
        this.pendown();
    }
    penup() {
        this.__pendown = false;
    }
    pu() {
        this.penup();
    }
    up() {
        this.penup();
    }
    pensize(width) {
        if(width === undefined) return this.__pensize;
        this.__pensize = width;
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
            if(shown !== undefined) this.__shown = shown;
            if(pendown !== undefined) this.__pendown = pendown;
            if(pencolor !== undefined) this.__pencolor = pencolor;
            if(fillcolor !== undefined) this.__fillcolor = fillcolor;
            if(pensize !== undefined) this.__pensize = pensize;
            if(speed !== undefined) this.__speed = speed;
            if(resizemode !== undefined) this.__resizemode = resizemode;
            if(stretchfactor !== undefined) this.__stretchfactor = stretchfactor;
            if(outline !== undefined) this.__outline = outline;
            if(tilt !== undefined) this.__tilt = tilt;
            return this;
        }, this);
        return {
            shown: this.__shown,
            pendown: this.__pendown,
            pencolor: this.__pencolor,
            fillcolor: this.__fillcolor,
            pensize: this.__pensize,
            speed: this.__speed,
            resizemode: this.__resizemode,
            stretchfactor: this.__stretchfactor,
            outline: this.__outline,
            tilt: this.__tilt,
        }
    }
    isdown() {
        return this.__pendown
    }
    __convertColorTo255(r, g, b) {
        if(this.__colormode === 255) {
            return `rgb(${(Array.isArray(r) ? r : [r, g, b]).join(', ')})`;
        }
        if(this.__colormode === 1) {
            return `rgb(${(Array.isArray(r) ? r : [r, g, b]).map((percent) => parseInt(percent * 255)).join(', ')})`;
        }
    }
    pencolor(r, g, b) {
        if(r === undefined) return this.__pencolor;
        this.__pencolor = typeof r === 'string' ? r : this.__convertColorTo255(r, g, b);
    }
    fillcolor(r, g, b) {
        if(r === undefined) return this.__fillcolor;
        this.__fillcolor = typeof r === 'string' ? r : this.__convertColorTo255(r, g, b);
    }
    color(r, g, b) {
        if(r === undefined) {
            return [
                this.pencolor(),
                this.fillcolor(),
            ]
        }
        if(b === undefined) {
            this.pencolor(r);
            this.fillcolor(g);
        }
        if(b) {
            this.pencolor(r, g, b);
            this.fillcolor(r, g, b);
        }
    }
    
    filling() {
        return this.__fill;
    }
    begin_fill() {
        this.__fill = true;
    }
    end_fill() {
        this.__fill = false;
    }
    reset() {
        this.__move(() => {
            this.__x = 0;
            this.__y = 0
            this.__pensize = RawTurtle._CFG._pensize
            this.__shown = RawTurtle._CFG.visible
            this.__pencolor = RawTurtle._CFG.pencolor
            this.__fillcolor = RawTurtle._CFG.fillcolor
            this.__pendown = true
            this.__speed = 3
            this.__stretchfactor = [1, 1]
            this.__shear = 0
            this.__tilt = 0
            this.__shapetrafo = [1, 0, 0, 1]
            this.__outline = 1
            this.__eventlisteners = RawTurtle.__EVENTLISTENERS_EMPTY;
            this.__delay = RawTurtle._CFG.delay;
            this.__tracer = undefined;
        });
        this.__canvas.clear();
    }
    clear() {
        this.__canvas.clear();
    }
    write(arg, move = false, align = 'left', font = ['Arial', 8, 'normal']) {
        const { w, h } = this.__canvas.write(this.convertTurtleCoordinate([this.__x, this.__y]), {
            arg, move, alig, font
        });
        if(move) {
            this.__x += this.canvasToTurtle(w, h).w;
        }
    }
    showturtle() {
        this.__shown = true;
    }
    st() {
        this.showturtle()
    }
    hideturtle() {
        this.__shown = false;
    }
    ht() {
        this.hideturtle();
    }
    isvisible() {
        return this.__shown;
    }
    shape(name) {
        if(name === undefined) {
            return this.__turtleshape;
        }
        this.__turtleshape = name;
    }
    resizemode(mode) {
        if(mode === undefined) return this.__resizemode;
        this.__resizemode = mode;
    }
    shapesize(stretch_wid, stretch_len, outline) {
        if(stretch_wid === undefined && stretch_len === undefined &&  outline === undefined) {
            return [...this.__stretchfactor, this.__outline]
        }
        if(stretch_wid === 0 || stretch_len === 0) {
            throw new Error("stretch_wid/stretch_len must not be zero");
        }
        this.__stretchfactor = [stretch_wid ?? this.__stretchfactor[0], stretch_len ?? stretch_wid ?? this.__stretchfactor[1]];
        this.__outline = outline ?? this.__outline;
        this.__resizemode(RawTurtle.RESIZEMODE.USER);
    }
    turtlesize(stretch_wid, stretch_len, outline) {
        return shapesize(stretch_wid, stretch_len, outline)
    }
    shearfactor(shear) {
        if(shear === undefined) return this.__shear;
        this.__shear = shear;
        this.__resizemode(RawTurtle.RESIZEMODE.USER);
    }
    settiltangle(tilt) {
        this.__tilt += tilt;
        this.__resizemode(RawTurtle.RESIZEMODE.USER);
    }
    tilt(tilt) {
        this.__tilt = tilt;
        this.__resizemode(RawTurtle.RESIZEMODE.USER);
    }
    tiltangle(tilt) {
        if(tilt === undefined) return this.__tilt;
        this.__tilt = tilt;
        this.__resizemode(RawTurtle.RESIZEMODE.USER);
    }
    __shapetrafo = [1, 0, 0, 1]
    shapetransform(t11, t12, t21, t22) {
        if([t11, t12, t21, t22].every(i => i === undefined)) {
            return this.__shapetrafo;
        }
        let [m11, m12, m21, m22] = this.__shapetrafo;
        m11 = t11 ?? m11;
        m12 = t12 ?? m12;
        m21 = t21 ?? m21;
        m22 = t22 ?? m22;
        if(m11 * m22 - m12 * m21 === 0) {
            throw new Error("Bad shape transform matrix: must not be singular");
        }
        this.__shapetrafo = [m11, m12, m21, m22]
        const alfa = Math.atan2(-m21, m11) % PI_2;
        const sa = Math.sin(alfa), ca = Math.cos(alfa);
        const [a11, a12, a21, a22] = [ca*m11 - sa*m21, ca*m12 - sa*m22,
                                        sa*m11 + ca*m21, sa*m12 + ca*m22];
        this.__stretchfactor = [a11, a22];
        this.__shear = a12/a22;
        this.__tilt = alfa;
        this.__resizemode(RawTurtle.RESIZEMODE.USER);
    }
    get_shapepoly() {
        return RawTurtle[`${this.__turtleshape}Polygon`].data;
    }
    mode(mode) {
        if(mode === undefined) {
            return this.__mode;    
        }
        this.__mode = mode;
        // todo: implement implications!
    }
    __llx = -100;
    __lly = -100;
    __urx =  100;
    __ury =  100;
    setworldcoordinates(llx, lly, urx, ury) {
        if(this.mode() !== RawTurtle.MODES.WORLD) {
            this.mode(RawTurtle.MODES.WORLD);
        }
        this.__llx = llx;
        this.__lly = lly;
        this.__urx = urx;
        this.__ury = ury;
    }
    convertTurtleCoordinate(xx, yy) {
        const objx = normalizeArgs(xx, yy);
        const [x, y] = objx;
        const x0 = this.__llx;
        const y0 = this.__lly;
        const x1 = this.__urx;
        const y1 = this.__ury;
        const widthX = x1 - x0;
        const widthY = y1 - y0;
        const w = this.__canvas.width;
        const h = this.__canvas.height;

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

        
        const x0y0 = this.__canvas.x0y0;
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
        const x0 = this.__llx;
        const y0 = this.__lly;
        const x1 = this.__urx;
        const y1 = this.__ury;
        const widthX = x1 - x0;
        const widthY = y1 - y0;
        const w = this.__canvas.width;
        const h = this.__canvas.height;

        const x0y0 = this.__canvas.x0y0;
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
        const wt = this.__urx - this.__llx;
        const ht =  this.__ury - this.__lly;
        const w = this.__canvas.width;
        const h = this.__canvas.height;
        const xn = dx / wt * w;
        const yn = dy / ht * h;
        const obj = [xn, yn];
        obj.x = obj.w = xn;
        obj.y = obj.h = yn;
        return obj; 
    }
    canvasToTurtle(dx, dy) {
        const wt = this.__urx - this.__llx;
        const ht =  this.__ury - this.__lly;
        const w = this.__canvas.width;
        const h = this.__canvas.height;
        const xn = dx * wt / w;
        const yn = dy * ht / h;
        const obj = [xn, yn];
        obj.x = obj.w = xn;
        obj.y = obj.h = yn;
        return obj; 
    }
    log(...args) {
        console.log(...args)
    }
    __recordpoly = false;
    __polyrecord;
    begin_poly() {
        this.__polyrecord = [[this.__x, this.__y]];
        this.__recordpoly = true;
    }
    end_poly() {
        this.__polyrecord.push([...this.__polyrecord[0]]);
        this.__recordpoly = false;
    }
    get_poly() {
        return new Shape(RawTurtle.shapetypepolygon, this.__polyrecord);
    }
    clone() {
        const undobuf = this.__undobuffer;
        this.__undobuffer = Object.entries(undobuf);
        const cloned = structuredClone(this);
        this.__undobuffer = undobuf;
        cloned.___orient = new Vec2D(cloned.___orient)
        const q = Object.assign(Object.create(Object.getPrototypeOf(this)), cloned);
        cloned.__undobuffer = undobuffer(cloned.__undobuffer, q);
        q.__regsiterCanvas();
        q.__registerNewTurtle();
        RawTurtle.#turtles.add(new WeakRef(q));
        return q;
    }
    getscreen() {
        return new Proxy(this.__canvas, {
            get: function(target, property) {
                if (property in target) {
                    return target[property];
                } else {
                    throw new ReferenceError("Property \"" + property + "\" does not exist.");
                }
            },
            set: function(target, property, value) {
                if (property in target) {
                    target[property] = value;
                } else {
                    throw new ReferenceError("Property \"" + property + "\" does not exist.");
                }
            }
        });
    }
    undobufferentries() {
        return Object.entries(this.__undobuffer);
    }
    bgcolor(color) {
        this.__canvas.bgcolor(color);
    }
    bgpic(picname) {
        this.__canvas.bgpic(
            picname
                .replaceAll('%x', this.__canvas.width)
                .replaceAll('%y', this.__canvas.height)
        );
    }
    clearscreen({ deep = true } = {}) {
        this.__canvas.bgpic(null);
        this.__canvas.bgcolor("white");
        this.reset();
        if(deep) {
            for(const ref of RawTurtle.#turtles) {
                const turtle = ref.deref();
                if(!turtle) {
                    RawTurtle.#turtles.delete(ref);
                    continue;
                }
                if(turtle === this) {
                    continue;
                }
                turtle.clearscreen({ deep: false });
            }
        }
    }
    resetscreen({ deep = true } = {}) {
        this.reset();
        if(deep) {
            for(const ref of RawTurtle.#turtles) {
                const turtle = ref.deref();
                if(!turtle) {
                    RawTurtle.#turtles.delete(turtle);
                    continue;
                }
                if(turtle === this) {
                    continue;
                }
                turtle.resetscreen({ deep: false });
            }
        }
    }
    screensize(width, height, color) {
        if(width == null && height == null && color == null) {
            return [this.__canvas.width, this.__canvas.height];
        }
        if(width != null) this.__canvas.width = width;
        if(height != null) this.__canvas.height = height;
        if(color != null) this.bgcolor(color);
    }
    setworldcoordinates(llx, lly, urx, ury) {
        this.llx = llx;
        this.lly = lly;
        this.urx = urx;
        this.ury = ury;
        this.mode(RawTurtle.MODES.WORLD);
        // todo: redraw
    }
    update() {
        // todo;
        // used with tracer
    }
    listen() {
        console.warn("This method does nothing - it's only provided for compatability. Events are always listened to!")
    }
    // todo: differentiate between turtle and turtleScreen
    static __EVENTLISTENERS_EMPTY =  {
        click: {},
        release: {},
        drag: {},
        keyup: {},
        keydown: {},
        
    };
    __eventlisteners = RawTurtle.__EVENTLISTENERS_EMPTY;
    /*
    This TurtleScreen method is available as a global function only under the name onscreenclick. 
    The global function onclick is another one derived from the Turtle method onclick.
    */
    onclick(fun, btn = 1, add = null) {
        if(fun === null) { // fun === null -> remove event listeners
            this.__eventlisteners.click = {};
        }
        if(add !== true) { // add === true -> add new listener, else replace
            this.__eventlisteners.click = {};
        }
        if(typeof fun === 'function') {
            this.__eventlisteners.click[`button${btn}`] ??= [];
            this.__eventlisteners.click[`button${btn}`].push(fun);
        }
    }
    onrelease(fun, btn = 1, add = null) {
        if(fun === null) { // fun === null -> remove event listeners
            this.__eventlisteners.release = {};
        }
        if(add !== true) { // add === true -> add new listener, else replace
            this.__eventlisteners.release = {};
        }
        if(typeof fun === 'function') {
            this.__eventlisteners.release[`button${btn}`] ??= [];
            this.__eventlisteners.release[`button${btn}`].push(fun);
        }
    }
    ondrag(fun, btn = 1, add = null) {
        if(fun === null) { // fun === null -> remove event listeners
            this.__eventlisteners.drag = {};
        }
        if(add !== true) { // add === true -> add new listener, else replace
            this.__eventlisteners.drag = {};
        }
        if(typeof fun === 'function') {
            this.__eventlisteners.drag[`button${btn}`] ??= [];
            this.__eventlisteners.drag[`button${btn}`].push(fun);
        }
    }
    onkey(fun, btn = 1, add = null) {
        if(fun === null) { // fun === null -> remove event listeners
            this.__eventlisteners.keyup = {};
        }
        if(add !== true) { // add === true -> add new listener, else replace
            this.__eventlisteners.keyup = {};
        }
        if(typeof fun === 'function') {
            this.__eventlisteners.keyup[`button${btn}`] ??= [];
            this.__eventlisteners.keyup[`button${btn}`].push(fun);
        }
    }
    onkeyrelease(fun, btn = 1, add = null) {
        onkey(fun, btn, add)
    }
    onkeypress(fun, btn = 1, add = null) {
        if(fun === null) { // fun === null -> remove event listeners
            this.__eventlisteners.keydown = {};
        }
        if(add !== true) { // add === true -> add new listener, else replace
            this.__eventlisteners.keydown = {};
        }
        if(typeof fun === 'function') {
            this.__eventlisteners.keydown[`button${btn}`] ??= [];
            this.__eventlisteners.keydown[`button${btn}`].push(fun);
        }
    }
    ontimer(fun, t = 0) {
        if(typeof fun === 'function') {
            return globalThis.setTimeout(fun, t);
        }
    }
    mainloop() {
        console.warn(`mainloop is a no-op in javascript! the event loop is always running in javascript!`)
    }
    done() {
        return this.mainloop();
    }
    getcanvas() {
        return this.__canvas;
    }
    __registeredTurtleShapes = [...Object.values(RawTurtle.TURTLE_SHAPES)]
    getshapes() {
        return [...this.__registeredTurtleShapes];
    }
    register_shape(name, shape = null) {
        this.__registeredTurtleShapes.push(name);
        this.__canvas.registerShape(RawTurtle.buildAppearanceKey(this.__PEN, name), shape ?? name, { protected: true });
    }
    addshape(name, shape = null) {
        this.register_shape(name, shape)
    }
    turtles() {
        return RawTurtle.turtle.map(ref => ref.deref()).filter(i => i);
    }
    window_height() {
        return this.__canvas.window_height;
    }
    window_width() {
        return this.__canvas.window_width;
    }
    bye() {
        this.__canvas.reset({ includeProtected: true });
        this.__canvas = undefined;
        RawTurtle.__canvasDirectory[this.__canvasindex] = undefined; // don't mess with the order; indexes of remaining ones need to stay same
    }
    exitonclick() {
        this.__exitonclick = true;
        // todo: wire to canvas exit
    }
    setup(width=RawTurtle._CFG.width, height=RawTurtle._CFG.height, startx=RawTurtle._CFG.leftright, starty=RawTurtle._CFG.topbottom) {
        // this is out of scope for this lib, as this would rely on the dimensions of the browser-window this is running in...
    }
    title() {
        // this is out of scope for this lib..
    }

}

class Queue {
    __queue = []
    __running = false;
    static sleep(ms) {
        return new Promise(res => setTimeout(res, ms));
    }
    queue(job) {
        this.__queue.push(job);
        this.__processIfRequired();
    }
    async __processIfRequired() {
        if(this.__running) {
            return;
        }
        this.__running = true;
        while(this.__queue.length) {
            await this.__queue.shift()();
        }
        this.__running = false;
    }
    get length() {
        return this.__queue.length;
    }
    isRunning() {
        return this.__running;
    }


}

const createProxiedTurtle = tt => new Proxy(tt, {
    defineProperty(target, prop, descriptor) {
        return  prop.startsWith("__") ? false : Reflect.defineProperty(target, prop, descriptor);
    },
    deleteProperty(target, prop) {
        return  prop.startsWith("__") ? false : Reflect.deleteProperty(target, prop);
    },
    get(target, prop, receiver) {
        return prop.startsWith("__") ? undefined : (target[prop]?.bind?.(target) ?? target[prop]);
    },
    getOwnPropertyDescriptor(target, prop) {
        return prop.startsWith("__") ? undefined : Object.getOwnPropertyDescriptor(target, prop)
    },
    getPrototypeOf(target) {
        return Object.getPrototypeOf(target);
    },
    has(target, key) {
        return key.startsWith("__") ? false : key in target;
    },
    isExtensible(target) {
        return Reflect.isExtensible(target);
    },
    preventExtensions(target) {
        return Reflect.preventExtensions(target);
    },
    ownKeys(target) {
        return Reflect.ownKeys(target).filter(i => !i.startsWith('__'));
    },
    set(obj, prop, value) {
        if(prop.startsWith("__")) {
            return;
        }
        return Reflect.set(obj, prop, value)
    },
    setPrototypeOf(monster1, monsterProto) {
        return false;
    }
});
const PublicRawTurtle = new Proxy(RawTurtle, {
    construct(target, args) {
        const tt = new target(...args);
        return createProxiedTurtle(tt);
    },
    apply() {
        throw new Error(`RawTurtle must be called with 'new'`)
    },
    defineProperty() {
        throw new Error(`You can't define new Properties on RawTurtle`)
    },
    deleteProperty() {
        throw new Error(`You delete Properties from RawTurtle`)
    },
    get(target, prop, receiver) {
        return prop.startsWith("__") ? undefined : target[prop];
    },
    getOwnPropertyDescriptor(target, prop) {
        return prop.startsWith("__") ? undefined : Object.getOwnPropertyDescriptor(target, prop)
    },
    getPrototypeOf(target) {
        return Object.getPrototypeOf(target);
    },
    has(target, key) {
        return key.startsWith("__") ? false : key in target;
    },
    isExtensible(target) {
        return Reflect.isExtensible(target);
    },
    preventExtensions(target) {
        return Reflect.preventExtensions(target);
    },
    ownKeys(target) {
        return Reflect.ownKeys(target).filter(i => !i.startsWith('__'));
    },
    set(obj, prop, value) {
        if(prop.startsWith("__")) {
            return;
        }
        return Reflect.set(obj, prop, value)
    },
    setPrototypeOf(monster1, monsterProto) {
        return false;
    }
});


class Turtle {
    constructor({ renderInto, rawTurtle: q, canvas, prompt }) {
        let rawTurtle;
        if(q) {
            rawTurtle = createProxiedTurtle(q);
        } else {
            rawTurtle = new PublicRawTurtle(canvas, renderInto);
            rawTurtle.setundobuffer(1000);
        }
        this.#rawTurtle = rawTurtle;
        this.#prompt = prompt;
        for(const property of Object.getOwnPropertyNames(PublicRawTurtle.prototype)) {
            if(this[property]) {
                continue;
            }
            if(typeof rawTurtle[property] === 'function' && property !== 'constructor') {
                this[property] = (...args) => {
                    this.__optCount++;
                    return new Value({ operation: property, opt: this.__optCount }, new Promise((res, rej) => {
                        this.__queue.queue(async () => {
                            try {
                                const awaitedArgs = await Promise.all(args.map((v) => {
                                    if(v instanceof Value) return v.promise;
                                    return v;
                                }));
                                const returnvalue = rawTurtle[property](...awaitedArgs);
                                // todo: delay, tracer
                                // todo: annotate functions to indicate if they take time
                                const speed = rawTurtle.speed();
                                if(speed) {
                                    await Queue.sleep(speed * 100);
                                }
                                return res(returnvalue);
                            } catch(e) {
                                rej(e);
                            }
                        });
                    }));
                };
            }
        }
    }
    __queue = new Queue();
    __optCount = 0;
    #rawTurtle;
    #prompt;
    clone() {
        const rawTurtle = this.#rawTurtle;
        this.__optCount++;
        const q = rawTurtle.clone();
        return new Turtle({ rawTurtle: q, prompt: this.#prompt });
    }
    getturtle() {
        return this;
    }
    getpen() {
        return this.getturtle();
    }
    textinput(...args) {
        this.__optCount++;
        return new Value({ operation: "textinput", opt: this.__optCount }, new Promise((res, rej) => {
            this.__queue.queue(async () => {
                try {
                    const [title, prompt] = await Promise.all(args.map((v) => {
                        if(v instanceof Value) return v.promise;
                        return v;
                    }));
                    const returnvalue = await this.#prompt.textinput({
                        title,
                        prompt,
                    });
                    return res(returnvalue);
                } catch(e) {
                    rej(e);
                }
            });
        }));
    }
    numinput(...args) {
        this.__optCount++;
        return new Value({ operation: "numinput", opt: this.__optCount }, new Promise((res, rej) => {
            this.__queue.queue(async () => {
                try {
                    const [
                        title,
                        prompt,
                        defaultVal,
                        minVal,
                        maxVal
                    ] = await Promise.all(args.map((v) => {
                        if(v instanceof Value) return v.promise;
                        return v;
                    }));
                    const returnvalue = await this.#prompt.numinput({
                        title,
                        prompt,
                        defaultVal,
                        minVal,
                        maxVal
                    });
                    return res(returnvalue);
                } catch(e) {
                    rej(e);
                }
            });
        }));
    }
}

class PixiTurtle extends Turtle {
    constructor(obj) {
        super({ ...obj, canvas: PixiCanvas.defaultCanvas, prompt: Dialog.defaultDialog })
    }
}

const turtle = new PixiTurtle({
    renderInto: document.getElementById("screen")
});
turtle.bgcolor("green");
// turtle.screensize(1000, 1000)
turtle.bgpic('https://picsum.photos/%x/%y');
const q = await turtle.clone();
q.speed(5);
sampleDraw(q, -50);
sampleDraw(turtle, 0);
turtle.clearscreen();
const r = await turtle.textinput("Secret", "What's the secret?")
console.log(r);
const rr = await turtle.textinput("Secret 2", "What's the secret?")
console.log(rr);
const l = await turtle.numinput("Secret", "What's the secret?")
console.log(l);

function sampleDraw(turtle, offset) {
    for(var i = 0; i < 2; i ++) {
        turtle.speed(i);
        turtle.log("Speed", i, turtle.speed());
        turtle.goto(10 * i - offset, 10 * i - offset);
        turtle.setheading(0);
        turtle.pendown();
        turtle.setheading(0);
        turtle.forward(20);
        turtle.left(45)
        turtle.forward(10);
        turtle.left(45)
        turtle.forward(10);
        turtle.left(45)
        turtle.forward(10);
        turtle.left(45)
        turtle.forward(10);
        turtle.left(45)
        turtle.forward(10);
        turtle.left(45)
        turtle.forward(10);
        turtle.left(45)
        turtle.forward(10);
        turtle.left(45)
        turtle.forward(10);
        turtle.penup()
    }
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




