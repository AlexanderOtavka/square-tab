'use strict';

class XContextMenuElement extends HTMLElement {
  static register() {
    this.$tmpl = document.currentScript.ownerDocument.querySelector('template');
    document.registerElement('x-context-menu', this);
  }

  createdCallback() {
    let tmplRoot = document.importNode(XContextMenuElement.$tmpl.content, true);
    this.createShadowRoot().appendChild(tmplRoot);

    this.$wrapper = this.shadowRoot.querySelector('#wrapper');

    this.addEventListener('click', () => this.hide());
    this.addEventListener('contextmenu', ev => {
      this.hide();
      ev.preventDefault();
    });
  }

  show(x, y) {
    this.setAttribute('visible', '');

    let maxW = this.clientWidth;
    let maxH = this.clientHeight;
    let menuW = this.$wrapper.offsetWidth;
    let menuH = this.$wrapper.offsetHeight;

    if (maxW - x < menuW) {
      x -= menuW;
    }

    if (maxH - y < menuH) {
      y -= menuH;
    }

    this.$wrapper.style.left = `${x}px`;
    this.$wrapper.style.top = `${y}px`;
  }

  hide() {
    this.removeAttribute('visible');
  }
}

XContextMenuElement.register();
