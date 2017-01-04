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
      ev.preventDefault();
      this.hide();
    });
  }

  show(x, y) {
    this.setAttribute('visible', '');

    const windowRect = this.getBoundingClientRect();
    const menuRect = this.$wrapper.getBoundingClientRect();

    if (windowRect.width - x < menuRect.width)
      x -= menuRect.width;
    if (windowRect.height - y < menuRect.height)
      y -= menuRect.height;

    this.$wrapper.style.transform = `translate(${x}px, ${y}px)`;
  }

  hide() {
    this.removeAttribute('visible');
    this.dispatchEvent(new CustomEvent('x-context-menu-close'));
  }
}

XContextMenuElement.register();
