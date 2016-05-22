'use strict';

class XDialogElement extends HTMLElement {
  static register() {
    this.$tmpl = document.currentScript.ownerDocument.querySelector('template');
    document.registerElement('x-dialog', this);
  }

  createdCallback() {
    let tmplRoot = document.importNode(XDialogElement.$tmpl.content, true);
    this.createShadowRoot().appendChild(tmplRoot);

    this.$closeButton = this.shadowRoot.querySelector('#close-button');
    this.$footer = this.shadowRoot.querySelector('#footer');
    this.$backdrop = this.shadowRoot.querySelector('#backdrop');

    this.$closeButton.addEventListener('click', () => this.close());
    this.$footer.addEventListener('click', ev => this.onFooterClick(ev));
    this.$backdrop.addEventListener('click', () => this.close());
  }

  open() {
    this.setAttribute('open', '');
  }

  close() {
    this.removeAttribute('open');
  }

  onFooterClick(ev) {
    if (!ev.target.classList.contains('dialog-no-close') &&
        (ev.target.classList.contains('dialog-confirm') ||
         ev.target.classList.contains('dialog-cancel'))) {
      if (ev.target.classList.contains('dialog-confirm')) {
        let customEvent = new CustomEvent('x-dialog-confirm');
        this.dispatchEvent(customEvent);
      }

      requestAnimationFrame(() => this.close());
    }
  }
}

XDialogElement.register();
