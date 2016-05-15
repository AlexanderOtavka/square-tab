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

    this.addEventListener('click', () => {
      let customEvent = new CustomEvent('bookmark-clicked', {
        detail: { node: this._node },
      });

      requestAnimationFrame(() => this.dispatchEvent(customEvent));
    });
  }

  attributeChangedCallback(attrName) {
    switch (attrName) {
      case 'small':
        this.updateTooltip();
        break;
    }
  }

  get node() {
    return this._node;
  }

  set node(node) {
    this._node = node;
    this.updateImage();
    this.updateTooltip();

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

  updateImage() {
    if (this.node && !this.node.url) {
      this.$image.src = '/images/folder-outline.svg';
    } else {
      this.$image.src = `chrome://favicon/size/16@8x/${this.url}`;
    }
  }

  updateTooltip() {
    if (this.small) {
      this.title = this.name;
    } else {
      this.title = '';
    }
  }
}

XBookmarkElement.register();
