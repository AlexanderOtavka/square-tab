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
      requestAnimationFrame(() => {
        let customEvent = new CustomEvent('bookmark-clicked', {
          detail: { node: this._node },
        });

        this.dispatchEvent(customEvent);
      });
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

    if (node) {
      this.$link.href = node.url || '#';
      this.$name.textContent = node.title || '';
      this.updateTooltip();
    } else {
      this.$link.href = '#';
      this.$name.textContent = '';
    }
  }

  updateImage() {
    if (this._node) {
      if (this._node.url) {
        this.$image.src = `chrome://favicon/${this._node.url}`;
      } else {
        this.$image.src = '/images/folder-outline.svg';
      }
    } else {
      this.$image.src = 'chrome://favicon';
    }
  }

  updateTooltip() {
    if (this.dataset.small === 'true') {
      this.title = this.$name.textContent;
    } else {
      this.title = '';
    }
  }
}

app.XBookmark = document.registerElement('x-bookmark', XBookmark);

})(window.app = window.app || {});
