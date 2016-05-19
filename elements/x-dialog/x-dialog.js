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

    this.$closeButton.addEventListener('click', () => this.close());
  }

  open() {
    this.setAttribute('open', '');
  }

  close() {
    this.removeAttribute('open');
  }
}

XDialogElement.register();
