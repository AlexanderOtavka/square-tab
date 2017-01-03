class XTooltipElement extends HTMLElement {
  static register() {
    this.$tmpl = document.currentScript.ownerDocument.querySelector('template');
    document.registerElement('x-tooltip', this);
  }

  createdCallback() {
    this.createShadowRoot()
      .appendChild(document.importNode(XTooltipElement.$tmpl.content, true));

    this.$tooltip = this.shadowRoot.querySelector('#tooltip');

    this._name = '';
    this._element = null;
    this._hidden = true;

    // +------------------+
    // |                  |
    // |   Tooltip Name   *  <-- _x, _y represent this point, as opposed to the
    // |                  |      translation x, y coordinates
    // +------------------+
    this._x = 0;
    this._y = 0;

    this._hideFrame = null;
    this._updateTransformFrame = null;
  }

  get name() {
    return this._name;
  }

  set name(name) {
    if (name === this.name) return;

    this.$tooltip.textContent = name;
    this._name = name;

    requestAnimationFrame(() => this._updateXTransform());
  }

  show(element, name = this.name) {
    if (this._hideFrame !== null) {
      cancelAnimationFrame(this._hideFrame);
      this._hideFrame = null;
    }

    const wasHidden = this._hidden;
    this._hidden = false;

    this.name = name;

    requestAnimationFrame(() => {
      this._element = element;
      this._updateTransform(!wasHidden);
      this.classList.add('show');
    });
  }

  hide() {
    this.classList.remove('show');
    this._hideFrame = requestAnimationFrame(() => {
      this._hidden = true;
      cancelAnimationFrame(this._updateTransformFrame);
    });
  }

  _updateTransform(isEased) {
    const elementClientRect = this._element.getBoundingClientRect();
    const targetY = elementClientRect.top + (elementClientRect.height / 2);

    let easeNextFrame = isEased;

    const CLOSE_ENOUGH_PX = 0.5;
    if (Math.abs(this._y - targetY) > CLOSE_ENOUGH_PX) {
      const yEasingStrength = isEased ? 0.25 : 1;
      this._y += (targetY - this._y) * yEasingStrength;

      this._updateXTransform(elementClientRect);
    } else {
      easeNextFrame = false;
    }

    cancelAnimationFrame(this._updateTransformFrame);
    this._updateTransformFrame =
      requestAnimationFrame(() => this._updateTransform(easeNextFrame));
  }

  _updateXTransform(clientRect = null) {
    if (this._element) {
      const elementClientRect =
        clientRect || this._element.getBoundingClientRect();
      this._x = elementClientRect.left;

      const tooltipClientRect = this.$tooltip.getBoundingClientRect();
      const x = this._x - (tooltipClientRect.width - 10);
      const y = this._y - (tooltipClientRect.height / 2);
      this.$tooltip.style.transform = `translate(${x}px, ${y}px)`;
    }
  }
}

XTooltipElement.register();
