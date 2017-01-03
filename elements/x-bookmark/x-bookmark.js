class XBookmarkElement extends HTMLElement {
  static register() {
    this.$tmpl = document.currentScript.ownerDocument.querySelector('template');
    document.registerElement('x-bookmark', this);
  }

  createdCallback() {
    this.createShadowRoot()
      .appendChild(document.importNode(XBookmarkElement.$tmpl.content, true));

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
    this.addEventListener('mouseover', ev => this.onMouseOver(ev));
    this.addEventListener('mouseleave', ev => this.onMouseLeave(ev));
  }

  attributeChangedCallback(attrName) {
    switch (attrName) {
      case 'small':
        this._updateTooltip();
        break;
      default:
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
    if (small)
      this.setAttribute('small', '');
    else
      this.removeAttribute('small');
  }

  onClick() {
    const customEvent = new CustomEvent('x-bookmark-click', {
      detail: { nodeId: this._node.id },
    });

    requestAnimationFrame(() => this.dispatchEvent(customEvent));
  }

  onContextMenu(ev) {
    const customEvent = new CustomEvent('x-bookmark-ctx-open', {
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

    const customEvent = new CustomEvent('x-bookmark-drag-start');
    this.dispatchEvent(customEvent);
  }

  onDragOver(ev) {
    ev.preventDefault();
    ev.dataTransfer.dropEffect = 'move';

    const customEvent = new CustomEvent('x-bookmark-drag-over', {
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

    const bookmarkId = ev.dataTransfer.getData('text/x-bookmark-id') || null;
    const title = ev.dataTransfer.getData('text/plain');
    const url = ev.dataTransfer.getData('text/uri-list') || title;
    const customEvent = new CustomEvent('x-bookmark-drop', {
      detail: { bookmarkId, title, url, y: ev.y },
    });

    this.dispatchEvent(customEvent);
  }

  onMouseOver() {
    const customEvent = new CustomEvent('x-bookmark-mouseover');
    this.dispatchEvent(customEvent);
  }

  onMouseLeave() {
    const customEvent = new CustomEvent('x-bookmark-mouseleave');
    this.dispatchEvent(customEvent);
  }

  _updateImage() {
    if (this.node && !this.node.url)
      this.$image.src = '/images/folder-outline.svg';
    else
      this.$image.src = `chrome://favicon/size/16@8x/${this.url}`;
  }

  _updateTooltip() {
    if (this.small)
      this.title = '';
    else
      this.title = this.name;
  }
}

XBookmarkElement.register();
