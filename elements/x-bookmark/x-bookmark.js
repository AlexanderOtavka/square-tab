'use strict';

class XBookmarkImpl extends HTMLElement {
  createdCallback() {
    this.createShadowRoot()
      .appendChild(document.importNode(XBookmark.tmpl.content, true));

    this.$image = this.shadowRoot.querySelector('#image');
    this.$name = this.shadowRoot.querySelector('#name');

    this.updateName();
    this.updateImage();
  }

  attributeChangedCallback(attrName, oldValue, newValue) {
    if (attrName === 'data-name') {
      this.updateName();
    } else if (attrName === 'data-image') {
      this.updateImage();
    }
  }

  updateName() {
    this.$name.textContent = this.dataset.name;
  }

  updateImage() {
    this.$image.src = this.dataset.image;
  }
}

XBookmarkImpl.tmpl = document.currentScript.ownerDocument
  .querySelector('template');

window.XBookmark = document.registerElement('x-bookmark', XBookmarkImpl);
