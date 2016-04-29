'use strict';

class XBookmarkImpl extends HTMLElement {
  createdCallback() {
    let tmplRoot = document.importNode(XBookmarkImpl.tmpl.content, true);
    this.createShadowRoot().appendChild(tmplRoot);

    this.$link = this.shadowRoot.querySelector('#link');
    this.$image = this.shadowRoot.querySelector('#image');
    this.$name = this.shadowRoot.querySelector('#name');

    this._node = null;

    this.dataset.image = this.dataset.image || '';
    this.updateImage();

    this.addEventListener('click', () => requestAnimationFrame(() => {
      this.dispatchEvent(new CustomEvent('bookmark-clicked', {
        detail: { node: this._node },
      }));
    }));
  }

  getNode() {
    return this._node;
  }

  setNode(node) {
    this._node = node;
    this.$link.href = node.url || '#';
    this.$name.textContent = node.title || 'All Bookmarks';
  }

  attributeChangedCallback(attrName, oldValue, newValue) {
    switch (attrName) {
      case 'data-image':
        this.updateImage();
        break;
    }
  }

  updateImage() {
    this.$image.src = this.dataset.image;
  }
}

XBookmarkImpl.tmpl = document.currentScript.ownerDocument
  .querySelector('template');

document.registerElement('x-bookmark', XBookmarkImpl);
