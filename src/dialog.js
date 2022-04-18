export class Dialog {
    static #defaultDialog;
    static #count = 0;
    #counter;
    static get defaultDialog() {
        if(!Dialog.#defaultDialog) {
            Dialog.#defaultDialog = new Dialog();
        }
        return Dialog.#defaultDialog;
    }
    constructor() {
        this.#counter = Dialog.#count++;
        this.dialog = globalThis.document.createElement('dialog');
        globalThis.document.body.appendChild(this.dialog);
    }
    #isOpen = false;
    async textinput({
        title,
        prompt,
    }) {
        if(this.#isOpen) {
            console.warn(`The dialog is already open. This is a no-op!`)
            return;
        }
        this.#isOpen = true;
        const id = `p${this.#counter}${Date.now()}`;
        this.dialog.innerHTML = `
            <h1>${title}</h1>
            <p>${prompt}</p>
            <form method="dialog">
                <div>
                    <input type="text" id="${id}" name="input"/>
                </div>
                <div>
                    <button value="default">Confirm</button>
                    <button value="cancel${id}">Cancel</button>
                </div>
            </form>`;
        this.dialog.showModal();
        return new Promise(res => this.dialog.addEventListener('close', () => {
            this.#isOpen = false;
            res(this.dialog.returnValue === `cancel${id}` ? null : document.getElementById(id).value)
        }, { once: true }));
    }
    async numinput({
        title,
        prompt,
        defaultVal,
        minVal,
        maxVal
    }) {
        if(this.#isOpen) {
            console.warn(`The dialog is already open. This is a no-op!`)
            return;
        }
        this.#isOpen = true;
        const id = `p${this.#counter}${Date.now()}`;
        this.dialog.innerHTML = `
            <h1>${title}</h1>
            <p>${prompt}</p>
            <form method="dialog">
                <div>
                    <input type="number" id="${id}" min="${minVal ?? ''}" max="${maxVal ?? ''}" value="${defaultVal ?? ''}" name="input"/>
                </div>
                <div>
                    <button value="default">Confirm</button>
                    <button value="cancel${id}">Cancel</button>
                </div>
            </form>`;
        this.dialog.showModal();
        return new Promise(res => this.dialog.addEventListener('close', () => {
            this.#isOpen = false;
            res(this.dialog.returnValue === `cancel${id}` ? defaultVal ?? null : parseFloat(document.getElementById(id).value))
        }, { once: true }));
    }

}