export class Value {
    constructor(c, value) {
        for(const k in c) {
            this[k] = c[k];
        }
        this.promise = value;
        this.value = value;
        value.then(v => {
            this.value = v;
        });
    }
    valueOf() {
        return this.promise;
    }
    then(fn) {
        return this.promise.then(fn);
    }
    catch(fn) {
        return this.promise.catch(fn);
    }
    finally(fn) {
        return this.promise.finally(fn);
    }
    async '=='(aa) {
        const a = await aa;
        const v = await this.value;
        return v == a;
    }
    async '!='(aa) {
        const a = await aa;
        const v = await this.value;
        return v != a;        
    }
    async '==='(aa) {
        const a = await aa;
        const v = await this.value;
        return v === a        
    }
    async '!=='(aa) {
        const a = await aa;
        const v = await this.value;
        return v !== a   
    }
    async '>='(aa) {
        const a = await aa;
        const v = await this.value;
        return v >= a;        
    }
    async '<='(aa) {
        const a = await aa;
        const v = await this.value;
        return v <= a;        
    }
    async '<'(aa) {
        const a = await aa;
        const v = await this.value;
        return v < a       
    }
    async '>'(aa) {
        const a = await aa;
        const v = await this.value;
        return v > a  
    }
    async '+'(aa) {
        const a = await aa;
        const v = await this.value;
        return v + a;
    }
    async '-'(aa) {
        const a = await aa;
        const v = await this.value;
        return v - a;
    }
    async '++'(aa) {
        const a = await aa;
        const v = await this.value;
        return v + 1;
    }
    async '--'(aa) {
        const a = await aa;
        const v = await this.value;
        return v - 1;
    }
    async '*'(aa) {
        const a = await aa;
        const v = await this.value;
        return v * a;
    }
    async '/'(aa) {
        const a = await aa;
        const v = await this.value;
        return v / a;
    }
    async '%'(aa) {
        const a = await aa;
        const v = await this.value;
        return v % a;
    }
    async '**'(aa) {
        const a = await aa;
        const v = await this.value;
        return v ** a;
    }
    async '&'(aa) {
        const a = await aa;
        const v = await this.value;
        return v & aa;
    }
    async '|'(aa) {
        const a = await aa;
        const v = await this.value;
        return v | aa;
    }
    async '^'(aa) {
        const a = await aa;
        const v = await this.value;
        return v ^ aa;
    }
    async '~'() {
        const v = await this.value;
        return ~v;
    }
    async '<<'(aa) {
        const a = await aa;
        const v = await this.value;
        return v << a;
    }
    async '>>'(aa) {
        const a = await aa;
        const v = await this.value;
        return v >> a;
    }
    async '>>>'(aa) {
        const a = await aa;
        const v = await this.value;
        return v >>> a;
    }
    async '&&'(aa) {
        const a = await aa;
        const v = await this.value;
        return v && a;
    }
    async '||'(aa) {
        const a = await aa;
        const v = await this.value;
        return v || a;
    }
    async '!'() {
        const v = this.value;
        return !v;
    }
    async 'typeof'() {
        const v = this.value;
        return typeof v;
    }
    async 'in'(aa) {
        const v = this.value;
        const a = aa;
        return v in aa;
    }
    async 'instanceof'(aa) {
        const v = this.value;
        const a = aa;
        return v instanceof aa;
    }
    async '.'(aa) {
        const v = this.value;
        const a = aa;
        return v[a];
    }
}