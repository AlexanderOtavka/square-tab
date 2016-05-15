'use strict';

class XBookmarkElement extends HTMLElement {
  static register() {
    this.$tmpl = document.currentScript.ownerDocument.querySelector('template');
    document.registerElement('x-bookmark', this);
  }

  createdCallback() {
    let tmplRoot = document.importNode(XBookmarkElement.$tmpl.content, true);
    this.createShadowRoot().appendChild(tmplRoot);

    this.$link = this.shadowRoot.querySelector('#link');
    this.$image = this.shadowRoot.querySelector('#image');
    this.$name = this.shadowRoot.querySelector('#name');

    this.small = false;
    this.node = null;

    this.addEventListener('click', () => this.onClick());
    this.addEventListener('contextmenu', ev => this.onContextMenu(ev));
  }

  attributeChangedCallback(attrName) {
    switch (attrName) {
      case 'small':
        this._updateTooltip();
        break;
    }
  }

  get node() {
    return this._node;
  }

  set node(node) {
    this._node = node;
    this._updateImage();
    this._updateTooltip();

    this.$link.href = this.url;
    this.$name.textContent = this.name;
  }

  get name() {
    return this.node ? (this.node.title || this.node.url || '') : '';
  }

  get url() {
    return this.node ? (this.node.url || '#') : '#';
  }

  get small() {
    return this.hasAttribute('small');
  }

  set small(small) {
    if (small) {
      this.setAttribute('small', '');
    } else {
      this.removeAttribute('small');
    }
  }

  onClick() {
    let customEvent = new CustomEvent('x-bookmark-click', {
      detail: { node: this._node },
    });

    requestAnimationFrame(() => this.dispatchEvent(customEvent));
  }

  onContextMenu(ev) {
    let customEvent = new CustomEvent('x-bookmark-ctx-open', {
      detail: {
        node: this._node,
        x: ev.x,
        y: ev.y,
      },
    });

    requestAnimationFrame(() => this.dispatchEvent(customEvent));

    ev.preventDefault();
  }

  _updateImage() {
    if (this.node && !this.node.url) {
      this.$image.src = '/images/folder-outline.svg';
    } else {
      this.$image.src = `chrome://favicon/size/16@8x/${this.url}`;
    }
  }

  _updateTooltip() {
    if (this.small) {
      this.title = this.name;
    } else {
      this.title = '';
    }
  }
}

XBookmarkElement.register();
