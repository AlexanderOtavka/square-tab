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
    this.updateImage();
  }

  attributeChangedCallback(attrName, oldValue, newValue) {
    switch (attrName) {
      case 'data-top':
        this.updateImage();
        break;
      case 'data-image':
        this.updateImage();
        break;
    }
  }

  updateImage() {
    if (this.dataset.top === 'true') {
      this.$image.src = 'images/folder.svg';
    } else if (this.dataset.image) {
      this.$image.src = this.dataset.image;
    } else if (this._node && !this._node.url) {
      this.$image.src = 'images/folder-outline.svg';
    } else {
      this.$image.src = '';
    }
  }
}

XBookmarkImpl.tmpl = document.currentScript.ownerDocument
  .querySelector('template');

document.registerElement('x-bookmark', XBookmarkImpl);
