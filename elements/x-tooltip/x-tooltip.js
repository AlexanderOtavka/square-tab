

class XTooltipElement extends HTMLElement {
  static register() {
    this.$tmpl = document.currentScript.ownerDocument.querySelector('template');
    document.registerElement('x-tooltip', this);
  }

  createdCallback() {
    this.createShadowRoot()
      .appendChild(document.importNode(XTooltipElement.$tmpl.content, true));

    this.$tooltip = this.shadowRoot.querySelector('#tooltip');

    this._x = 0;
    this._y = 0;
  }

  get name() {
    return this.$tooltip.textContent;
  }

  set name(name) {
    this.$tooltip.textContent = name;

    requestAnimationFrame(() => {
      const clientRect = this.$tooltip.getBoundingClientRect();
      const x = this._x - (clientRect.width - 10);
      const y = this._y - (clientRect.height / 2);
      this.$tooltip.style.transform = `translate(${x}px, ${y}px)`;
      this.classList.add('show');
    });
  }

  show(clientRect, name = this.name) {
    this._x = clientRect.left;
    this._y = clientRect.top + (clientRect.height / 2);
    this.name = name;
  }

  hide() {
    this.classList.remove('show');
  }
}

XTooltipElement.register();
