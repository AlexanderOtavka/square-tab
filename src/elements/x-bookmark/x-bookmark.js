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

    this.setAttribute('draggable', 'true');

    this.addEventListener('click', () => this.onClick());
    this.addEventListener('contextmenu', ev => this.onContextMenu(ev));
    this.addEventListener('dragstart', ev => this.onDragStart(ev));
    this.addEventListener('dragover', ev => this.onDragOver(ev));
    this.addEventListener('dragenter', ev => this.onDragOver(ev));
    this.addEventListener('dragleave', ev => this.onDragLeave(ev));
    this.addEventListener('dragend', ev => this.onDragEnd(ev));
    this.addEventListener('drop', ev => this.onDrop(ev));
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

  get isFolder() {
    return !this.node.url;
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
      detail: { nodeId: this._node.id },
    });

    requestAnimationFrame(() => this.dispatchEvent(customEvent));
  }

  onContextMenu(ev) {
    let customEvent = new CustomEvent('x-bookmark-ctx-open', {
      detail: {
        nodeId: this._node.id,
        x: ev.x,
        y: ev.y,
      },
    });

    requestAnimationFrame(() => this.dispatchEvent(customEvent));

    ev.preventDefault();
  }

  onDragStart(ev) {
    requestAnimationFrame(() => this.classList.add('dragging'));

    ev.dataTransfer.setDragImage(this, ev.offsetX, ev.offsetY);
    ev.dataTransfer.setData('text/x-bookmark-id', this.node.id);

    let customEvent = new CustomEvent('x-bookmark-drag-start');
    this.dispatchEvent(customEvent);
  }

  onDragOver(ev) {
    ev.preventDefault();
    ev.dataTransfer.dropEffect = 'move';

    let customEvent = new CustomEvent('x-bookmark-drag-over', {
      detail: { isFolder: this.isFolder, y: ev.y },
    });
    this.dispatchEvent(customEvent);
  }

  onDragLeave() {
    this.classList.remove('expand');
  }

  onDragEnd() {
    requestAnimationFrame(() => this.classList.remove('dragging'));
  }

  onDrop(ev) {
    ev.preventDefault();

    let bookmarkId = ev.dataTransfer.getData('text/x-bookmark-id') || null;
    let title = ev.dataTransfer.getData('text/plain');
    let url = ev.dataTransfer.getData('text/uri-list') || title;
    let customEvent = new CustomEvent('x-bookmark-drop', {
      detail: { bookmarkId, title, url, y: ev.y },
    });

    this.dispatchEvent(customEvent);
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
