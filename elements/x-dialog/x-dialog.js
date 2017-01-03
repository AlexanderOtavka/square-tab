class XDialogElement extends HTMLElement {
  static register() {
    this.$tmpl = document.currentScript.ownerDocument.querySelector('template');
    document.registerElement('x-dialog', this);
  }

  createdCallback() {
    this.createShadowRoot()
      .appendChild(document.importNode(XDialogElement.$tmpl.content, true));

    this.$closeButton = this.shadowRoot.querySelector('#close-button');
    this.$footer = this.shadowRoot.querySelector('#footer');
    this.$backdrop = this.shadowRoot.querySelector('#backdrop');

    this.$closeButton.addEventListener('click', () => this.close());
    this.$footer.addEventListener('click', ev => this.onFooterClick(ev));
    this.$backdrop.addEventListener('click', () => this.close());
  }

  open() {
    this.setAttribute('open', '');

    const customEvent = new CustomEvent('x-dialog-open');
    this.dispatchEvent(customEvent);
  }

  close() {
    this.removeAttribute('open');

    const customEvent = new CustomEvent('x-dialog-close');
    this.dispatchEvent(customEvent);
  }

  onFooterClick(ev) {
    if (!ev.target.classList.contains('dialog-no-close') &&
        (ev.target.classList.contains('dialog-confirm') ||
         ev.target.classList.contains('dialog-cancel'))) {
      if (ev.target.classList.contains('dialog-confirm')) {
        const customEvent = new CustomEvent('x-dialog-confirm');
        this.dispatchEvent(customEvent);
      }

      requestAnimationFrame(() => this.close());
    }
  }
}

XDialogElement.register();
