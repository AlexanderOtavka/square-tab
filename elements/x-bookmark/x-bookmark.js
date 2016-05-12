(function (app) {
'use strict';

const $tmpl = document.currentScript.ownerDocument.querySelector('template');

class XBookmark extends HTMLElement {
  createdCallback() {
    let tmplRoot = document.importNode($tmpl.content, true);
    this.createShadowRoot().appendChild(tmplRoot);

    this.$link = this.shadowRoot.querySelector('#link');
    this.$image = this.shadowRoot.querySelector('#image');
    this.$name = this.shadowRoot.querySelector('#name');

    this.node = null;
    this.dataset.small = 'false';

    this.updateImage();
    this.updateTooltip();

    this.addEventListener('click', () => {
      let customEvent = new CustomEvent('bookmark-clicked', {
        detail: { node: this._node },
      });

      requestAnimationFrame(() => this.dispatchEvent(customEvent));
    });
  }

  attributeChangedCallback(attrName) {
    switch (attrName) {
      case 'data-small':
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

  updateImage() {
    if (this.node && !this.node.url) {
      this.$image.src = '/images/folder-outline.svg';
    } else {
      this.$image.src = `chrome://favicon/size/16@8x/${this.url}`;
    }
  }

  updateTooltip() {
    if (this.dataset.small === 'true') {
      this.title = this.name;
    } else {
      this.title = '';
    }
  }
}

app.XBookmark = document.registerElement('x-bookmark', XBookmark);

})(window.app = window.app || {});
