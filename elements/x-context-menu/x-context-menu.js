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
    this.$wrapper.style.width = 'auto';
    this.$wrapper.style.height = 'auto';

    requestAnimationFrame(() => {
      const windowRect = this.getBoundingClientRect();
      const menuRect = this.$wrapper.getBoundingClientRect();

      const MARGIN = 4;

      const rightSideSpace = windowRect.width - x - MARGIN;
      const bottomSideSpace = windowRect.height - y - MARGIN;
      if (menuRect.width > rightSideSpace)
        x -= menuRect.width;
      if (menuRect.height > bottomSideSpace)
        y -= menuRect.height;

      if (x < MARGIN) x = MARGIN;
      if (y < MARGIN) y = MARGIN;

      const maxWidth = windowRect.width - (MARGIN * 2);
      const maxHeight = windowRect.height - (MARGIN * 2);
      if (menuRect.width > maxWidth)
        this.$wrapper.style.width = `${maxWidth}px`;
      if (menuRect.height > maxHeight)
        this.$wrapper.style.height = `${maxHeight}px`;

      // since the wrapper is attached to the right side of the screen
      const adjustedX = (x + menuRect.width) - windowRect.width;
      this.$wrapper.style.transform = `translate(${adjustedX}px, ${y}px)`;
    });
  }

  hide() {
    this.removeAttribute('visible');
    this.dispatchEvent(new CustomEvent('x-context-menu-close'));
  }
}

XContextMenuElement.register();
