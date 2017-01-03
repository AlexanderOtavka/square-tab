class XContextMenuElement extends HTMLElement {
  static register() {
    this.$tmpl = document.currentScript.ownerDocument.querySelector('template');
    document.registerElement('x-context-menu', this);
  }

  createdCallback() {
    this.createShadowRoot()
      .appendChild(document.importNode(XContextMenuElement.$tmpl.content,
                                       true));

    this.$wrapper = this.shadowRoot.querySelector('#wrapper');

    this.addEventListener('click', () => this.hide());
    this.addEventListener('contextmenu', ev => {
      this.hide();
      ev.preventDefault();
    });
  }

  show(x, y) {
    this.setAttribute('visible', '');

    const maxW = this.clientWidth;
    const maxH = this.clientHeight;
    const menuW = this.$wrapper.offsetWidth;
    const menuH = this.$wrapper.offsetHeight;

    if (maxW - x < menuW)
      x -= menuW;

    if (maxH - y < menuH)
      y -= menuH;

    this.$wrapper.style.left = `${x}px`;
    this.$wrapper.style.top = `${y}px`;
  }

  hide() {
    this.removeAttribute('visible');
  }
}

XContextMenuElement.register();
