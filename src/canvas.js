import * as PIXI from 'pixi.js';

import { PI_2, toRad, toDeg, normalize, normalizeArgs, Vec2D } from "./util.js"
import { Shape } from "./shape.js"

function colourNameToHex(colour)
{
    const colours = {"aliceblue":"#f0f8ff","antiquewhite":"#faebd7","aqua":"#00ffff","aquamarine":"#7fffd4","azure":"#f0ffff",
    "beige":"#f5f5dc","bisque":"#ffe4c4","black":"#000000","blanchedalmond":"#ffebcd","blue":"#0000ff","blueviolet":"#8a2be2","brown":"#a52a2a","burlywood":"#deb887",
    "cadetblue":"#5f9ea0","chartreuse":"#7fff00","chocolate":"#d2691e","coral":"#ff7f50","cornflowerblue":"#6495ed","cornsilk":"#fff8dc","crimson":"#dc143c","cyan":"#00ffff",
    "darkblue":"#00008b","darkcyan":"#008b8b","darkgoldenrod":"#b8860b","darkgray":"#a9a9a9","darkgreen":"#006400","darkkhaki":"#bdb76b","darkmagenta":"#8b008b","darkolivegreen":"#556b2f",
    "darkorange":"#ff8c00","darkorchid":"#9932cc","darkred":"#8b0000","darksalmon":"#e9967a","darkseagreen":"#8fbc8f","darkslateblue":"#483d8b","darkslategray":"#2f4f4f","darkturquoise":"#00ced1",
    "darkviolet":"#9400d3","deeppink":"#ff1493","deepskyblue":"#00bfff","dimgray":"#696969","dodgerblue":"#1e90ff",
    "firebrick":"#b22222","floralwhite":"#fffaf0","forestgreen":"#228b22","fuchsia":"#ff00ff",
    "gainsboro":"#dcdcdc","ghostwhite":"#f8f8ff","gold":"#ffd700","goldenrod":"#daa520","gray":"#808080","green":"#008000","greenyellow":"#adff2f",
    "honeydew":"#f0fff0","hotpink":"#ff69b4",
    "indianred ":"#cd5c5c","indigo":"#4b0082","ivory":"#fffff0","khaki":"#f0e68c",
    "lavender":"#e6e6fa","lavenderblush":"#fff0f5","lawngreen":"#7cfc00","lemonchiffon":"#fffacd","lightblue":"#add8e6","lightcoral":"#f08080","lightcyan":"#e0ffff","lightgoldenrodyellow":"#fafad2",
    "lightgrey":"#d3d3d3","lightgreen":"#90ee90","lightpink":"#ffb6c1","lightsalmon":"#ffa07a","lightseagreen":"#20b2aa","lightskyblue":"#87cefa","lightslategray":"#778899","lightsteelblue":"#b0c4de",
    "lightyellow":"#ffffe0","lime":"#00ff00","limegreen":"#32cd32","linen":"#faf0e6",
    "magenta":"#ff00ff","maroon":"#800000","mediumaquamarine":"#66cdaa","mediumblue":"#0000cd","mediumorchid":"#ba55d3","mediumpurple":"#9370d8","mediumseagreen":"#3cb371","mediumslateblue":"#7b68ee",
    "mediumspringgreen":"#00fa9a","mediumturquoise":"#48d1cc","mediumvioletred":"#c71585","midnightblue":"#191970","mintcream":"#f5fffa","mistyrose":"#ffe4e1","moccasin":"#ffe4b5",
    "navajowhite":"#ffdead","navy":"#000080",
    "oldlace":"#fdf5e6","olive":"#808000","olivedrab":"#6b8e23","orange":"#ffa500","orangered":"#ff4500","orchid":"#da70d6",
    "palegoldenrod":"#eee8aa","palegreen":"#98fb98","paleturquoise":"#afeeee","palevioletred":"#d87093","papayawhip":"#ffefd5","peachpuff":"#ffdab9","peru":"#cd853f","pink":"#ffc0cb","plum":"#dda0dd","powderblue":"#b0e0e6","purple":"#800080",
    "rebeccapurple":"#663399","red":"#ff0000","rosybrown":"#bc8f8f","royalblue":"#4169e1",
    "saddlebrown":"#8b4513","salmon":"#fa8072","sandybrown":"#f4a460","seagreen":"#2e8b57","seashell":"#fff5ee","sienna":"#a0522d","silver":"#c0c0c0","skyblue":"#87ceeb","slateblue":"#6a5acd","slategray":"#708090","snow":"#fffafa","springgreen":"#00ff7f","steelblue":"#4682b4",
    "tan":"#d2b48c","teal":"#008080","thistle":"#d8bfd8","tomato":"#ff6347","turquoise":"#40e0d0",
    "violet":"#ee82ee",
    "wheat":"#f5deb3","white":"#ffffff","whitesmoke":"#f5f5f5",
    "yellow":"#ffff00","yellowgreen":"#9acd32"};

    if (colours[colour.toLowerCase()])
        return colours[colour.toLowerCase()];

    throw new Error(`Color ${colour} is not a valid color name!`)
}

const rgbaRegex = /rgba?\(((25[0-5]|2[0-4]\d|1\d{1,2}|\d\d?)\s*,\s*?){2}(25[0-5]|2[0-4]\d|1\d{1,2}|\d\d?)\s*,?\s*([01]\.?\d*?)?\)/;
function rgbToHex(rgbString) {
    const [_, r, g, b, a] = rgbString.match(rgbaRegex);
    return a ? [parseInt(r), parseInt(g), parseInt(b), parseFloat(a)] : [parseInt(r), parseInt(g), parseInt(b)];
}
function convertColor(nameOrRGAOrHex) {
    if(typeof nameOrRGAOrHex === 'number' && nameOrRGAOrHex >= 0 && nameOrRGAOrHex <= 0xFFFFFF) { // hex number
        return nameOrRGAOrHex;
    }
    if(Array.isArray(nameOrRGAOrHex)) {
        return PIXI.utils.rgb2hex(nameOrRGAOrHex);
    }
    // todo rga substring
    if(typeof nameOrRGAOrHex === "string" && nameOrRGAOrHex.startsWith("#")) { // rgb in percents
        return PIXI.utils.string2hex(nameOrRGAOrHex);
    }
    if(typeof nameOrRGAOrHex === "string" && nameOrRGAOrHex.trim().startsWith("rgb")) { // css string
        const [r, b, a] = rgbToHex(nameOrRGAOrHex);
        return PIXI.utils.string2hex([r / 255, b / 255, a / 255]);
    }
    if(typeof nameOrRGAOrHex === "string") {
        return PIXI.utils.string2hex(colourNameToHex(nameOrRGAOrHex));
    }
    throw new Error(`Failed to convert unknown color format ${nameOrRGAOrHex}`);
}

export class PixiCanvas {
    static #defaultCanvas;
    static get defaultCanvas() {
        if(!PixiCanvas.#defaultCanvas) {
            PixiCanvas.#defaultCanvas = new PixiCanvas();
        }
        return PixiCanvas.#defaultCanvas;
    }
    constructor({ app, view, turtle, _canvas } = {}) {
        this.#app = app ?? new PIXI.Application({
            backgroundColor: 0xFFFFFF
        });
        this.backgroundcontainer = new PIXI.Container();
        this.#app.stage.addChild(this.backgroundcontainer);
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
    static #TurtleBindings = new WeakMap();
    bind(turtle) {
        if(PixiCanvas.#TurtleBindings.has(turtle)) {
            return PixiCanvas.#TurtleBindings.get(turtle);
        }
        const canvas = new PixiCanvas({
            app: this.#app,
            view: this.view,
            turtle,
        });
        PixiCanvas.#TurtleBindings.set(turtle, canvas);
        return canvas;
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
            graphics.beginFill(fill ? convertColor(color) : convertColor("white"), 1, 0);
            graphics.drawCircle(x, y, fill ? radius : fill * 0.9);
            graphics.endFill();
        });
    }
    line([x1, y1], [x2, y2], { color, width }) {
        return this.#group(graphics =>  {
            graphics.lineStyle(width, convertColor(color), 1);
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
        appearance,
    }) {
        const shape = this.#shapes[name] ?? name;
        // todo: transform coordinates
        if(x !== undefined) shape.x = x;
        if(y !== undefined) shape.y = y;
        if(rotate !== undefined) shape.rotation = rotate;
        if(scale !== undefined) shape.scale = scale;
        if(skew !== undefined) shape.skew = skew;
        if(appearance !== undefined) {
            shape.removeChild(shape.activeShape);
            shape.activeShape = this.#shapes[appearance] ?? appearance;
            shape.addChild(shape.activeShape);
        }
    }
    removeShape(id) {
        const shape = this.#shapes[name] ?? name;
        this.#app.stage.removeChild(shape);
        shape.destroy();
        this.#objects.splice(this.#objects.indexOf(shape), 1);
    }
    #shapes = {};
    #_loadercache = {}
    #loadercache(name, asset = 'assets/turtle.png') {
        if(this.#_loadercache[`${name}-${asset}`]) {
            return this.#_loadercache[`${name}-${asset}`]
        }
        this.#_loadercache[`${name}-${asset}`] = new Promise(res => {
            this.#app.loader.add(name, asset).load((loader, resources) => {
                res({ loader, resources });
            });
        });
        return this.#_loadercache[`${name}-${asset}`];
    }
    #textureFinalizationRegistry = new FinalizationRegistry(heldValue => {
        heldValue.destroy();
    });
    registerShape(name, data, options = {}) {
        if(this.#shapes[name]) {
            throw new Error(`Shape with name '${name}' already registered!`);
        }
        this.#shapes[name] = new PIXI.Container();
        this.#shapes[name].protected = options.protected ?? false;
        if(typeof data === 'string' || (data instanceof Shape && data.type === Shape.types.IMAGE)) {
            const xdata = typeof data === 'string' ? data : data.data;
            return new Promise(res => {
                this.#loadercache(name, xdata).then(({ loader, resources }) => {
                    const shape = new PIXI.Sprite(resources[name].texture);
                    this.#textureFinalizationRegistry(shape, resources[name].texture)
                    shape.x = shape.y = 0;
                    this.#shapes[name].addChild(shape);
                    this.#shapes[name].activeShape = shape;
                    if(options.interactive) {
                        this.#shapes[name].interactive = true;
                    }
                    if(options.buttonMode) {
                        this.#shapes[name].buttonMode = true;
                    }
                    Object.entries(options).filter(([k, v]) => k.startsWith('on') && typeof v === 'function').forEach(([k, v]) => {
                        this.#shapes[name].on(k.substring('on'.length), v);
                    });
                    res(shape);
                });
            });
        }
        const fromTuples = (data, options, shapeoptions) => {
            const scale = options.scale ?? 1;
            const path = data.map(([x, y]) => [x * scale, y * scale]).flat();
            const graphics = new PIXI.Graphics();
            graphics.lineStyle(0);
            graphics.beginFill(options.color ?? 0x3500FA, options.opacity ?? 1);
            graphics.drawPolygon(path);
            graphics.endFill();
            if(shapeoptions.rotate) {
                graphics.rotation = shapeoptions.rotate;
            }
            return graphics;
        }
        const tupleconstrutor = (data, options, shapeoptions = {}) => {
            const graphics = fromTuples(data, options, shapeoptions);
            this.#shapes[name].addChild(graphics);
            this.#shapes[name].activeShape = graphics;
            if(options.interactive) {
                graphics.interactive = true;
            }
            if(options.buttonMode) {
                graphics.buttonMode = true;
            }
            Object.entries(options).filter(([k, v]) => k.startsWith('on') && typeof v === 'function').forEach(([k, v]) => {
                graphics.on(k.substring('on'.length), v);
            });
            return { w: graphics.width, h: graphics.height, name };
        }
        if(data instanceof Shape && data.type === Shape.types.POLYGON) {
            return tupleconstrutor(data.data, options, data.options);
        }
        if(data instanceof Shape && data.type === Shape.types.COMPOUND) {
            const container = new PIXI.Container();
            data.data.map(({ poly, fill, outline }) => fromTuples(poly, options, {
                ...data.options,
                color: fill,
                outline
            })).forEach(i => {
                container.addChild(i);
            });
            this.#shapes[name].addChild(container);
            this.#shapes[name].activeShape = container;
            if(options.interactive) {
                container.interactive = true;
            }
            if(options.buttonMode) {
                container.buttonMode = true;
            }
            Object.entries(options).filter(([k, v]) => k.startsWith('on') && typeof v === 'function').forEach(([k, v]) => {
                container.on(k.substring('on'.length), v);
            });
            return { w: container.width, h: container.height, name };
        }
        if(data instanceof Shape && data.type === Shape.types.BINARY) {
            const resource = new PIXI.BufferResource(data.data, {
                width: data.options.width,
                height: data.options.height
            });
            const texture = PIXI.Texture.fromBuffer(resource, data.options.width, data.options.height);
            const shape = new PIXI.Sprite(texture);
            this.#textureFinalizationRegistry(shape, texture)
            this.#textureFinalizationRegistry(shape, resource)
            shape.x = shape.y = 0;
            this.#shapes[name].addChild(shape);
            this.#shapes[name].activeShape = shape;
            if(options.interactive) {
                shape.interactive = true;
            }
            if(options.buttonMode) {
                shape.buttonMode = true;
            }
            Object.entries(options).filter(([k, v]) => k.startsWith('on') && typeof v === 'function').forEach(([k, v]) => {
                shape.on(k.substring('on'.length), v);
            });
            return { w: shape.width, h: shape.height, name };
        }
        if(Array.isArray(data) && data.every((j) => Array.isArray(j) && j.length === 2)) {
            return tupleconstrutor(data, options);
        }
        throw new Error(`Unsupported shape type ${typeof data}`);
    }
    unregisterShape(name) {
        this.#shapes[name].removeAllListeners()
        delete this.#shapes[name];
    }
    clear({ includeProtected = false } = {}) {
        this.#objects.splice(0, this.#objects.length)
        .filter((v) => !v.protected)
        .forEach(obj => {
            this.#app.stage.removeChild(obj);
            obj?.removeAllListeners();
            obj.destroy?.();
        });
        Object.values(this.#shapes).forEach(shape => {
            if(shape.protected && !includeProtected) {
                return;
            }
            shape.removeAllListeners();
        });
        this.#shapes = Object.fromEntries(Object.entries(this.#shapes).filter(([k, v]) => v.protected));
    }
    reset({ includeProtected = false } = {}) {
        this.clear({ includeProtected });
        this.backgroundcontainer.destroy();
        this.#app.stage.removeChild(this.backgroundcontainer);
        this.backgroundcontainer = new PIXI.Container();
        this.#app.stage.addChild(this.backgroundcontainer);
    }
    destroy() {
        this.reset();
        this.#app.destroy(true, true);
        PixiCanvas.#defaultCanvas = undefined;
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
            fill: convertColor("black"),
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
    set width(w) {
        if(w === "auto") {
            this.#app.resizeTo = this.#app.view.parentNode;
            return;
        }
        this.#app.renderer.resize(w, this.height);
    }
    set height(h) {
        if(h === "auto") {
            this.#app.resizeTo = this.#app.view.parentNode;
            return;
        }
        this.#app.renderer.resize(this.width, h);
    }
    get window_width() {
        return this.#app.view.parentNode.width;
    }
    get window_height() {
        return this.#app.view.parentNode.height;
    }
    get x0y0() {
        return "TL"; // or BL - where's 0 in this screen - top-left or bottom-left
    }
    #attachedTo
    renderInto(domElement) {
        domElement.appendChild(this.view);
        this.#app.resizeTo = domElement;
    }
    bgcolor(color) {
        this.#app.renderer.backgroundColor = convertColor(color);
    }
    #bgpic({ bgSize, inputSprite: sprite, type, forceSize }) {
        const bgContainer = new PIXI.Container();
        const mask = new PIXI.Graphics().beginFill(0x8bc5ff).drawRect(0,0, bgSize.x, bgSize.y).endFill();
        bgContainer.mask = mask;
        bgContainer.addChild(mask);
        bgContainer.addChild(sprite);
        function resize() {
            let sp = { x: sprite.width, y: sprite.height };
            if(forceSize) sp = forceSize;
            const winratio = bgSize.x/bgSize.y;
            const spratio = sp.x/sp.y;
            let scale = 1;
            const pos = new PIXI.Point(0,0);
            if(type === 'cover' ? (winratio > spratio) : (winratio < spratio)) {
                //photo is wider than background
                scale = bgSize.x/sp.x;
                pos.y = -((sp.y*scale)-bgSize.y)/2
            } else {
                //photo is taller than background
                scale = bgSize.y/sp.y;
                pos.x = -((sp.x*scale)-bgSize.x)/2
            }
            sprite.scale = new PIXI.Point(scale,scale);
            sprite.position = pos;
        }
        resize();
        return {
            container: bgContainer,
            resize,
        }
    }
    bgpic(picname) {
        if(picname === null) {
            this.backgroundcontainer.destroy();
            this.#app.stage.removeChild(this.backgroundcontainer);
            this.backgroundcontainer = new PIXI.Container();
            this.#app.stage.addChild(this.backgroundcontainer);
            return;
        }
        const container = this.backgroundcontainer;
        this.#app.loader.add(picname, picname, {
            loadType: PIXI.LoaderResource.LOAD_TYPE.IMAGE,
            xhrType: PIXI.LoaderResource.XHR_RESPONSE_TYPE.BLOB
        }).load((loader, resources) => {
            const slide = this.#bgpic({ bgSize: { x: this.width, y: this.height }, inputSprite: new PIXI.Sprite(resources[picname].texture), type: 'cover' });        
            container.addChild(slide.container);
        });
        // todo implement resizing with ResizeObserver
    }
}