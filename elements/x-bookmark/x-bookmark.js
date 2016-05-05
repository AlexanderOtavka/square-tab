(function (app) {
'use strict';

const $tmpl = document.currentScript.ownerDocument.querySelector('template');

class XBookmarkImpl extends HTMLElement {
  createdCallback() {
    let tmplRoot = document.importNode($tmpl.content, true);
    this.createShadowRoot().appendChild(tmplRoot);

    this.$link = this.shadowRoot.querySelector('#link');
    this.$image = this.shadowRoot.querySelector('#image');
    this.$name = this.shadowRoot.querySelector('#name');

    this._node = null;

    this.dataset.image = this.dataset.image || '';
    this.updateImage();

    this.addEventListener('click', () => {
      requestAnimationFrame(() => {
        this.dispatchEvent(new CustomEvent('bookmark-clicked', {
          detail: { node: this._node },
        }));
      });
    });
  }

  getNode() {
    return this._node;
  }

  setNode(node) {
    this._node = node;
    this.$link.href = node.url || '#';
    this.$name.textContent = node.title || node.url || '';
    this.updateImage();
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
}

app.XBookmark = document.registerElement('x-bookmark', XBookmarkImpl);

})(window.app = window.app || {});
