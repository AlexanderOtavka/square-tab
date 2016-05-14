/* globals Settings */
'use strict';

class Bookmarks {
  static main() {
    this.$bookmarksTitle = document.querySelector('#bookmarks-drawer .title');
    this.$bookmarksUpButton = document.querySelector('#bookmarks-up-button');
    this.$bookmarksTopIcon = document.querySelector('#bookmarks-top-icon');
    this.$bookmarksDrawerItems =
      document.querySelector('#bookmarks-drawer-items');

    this._stack = [];

    this.loadBookmarks();
  }

  static loadBookmarks() {
    chrome.bookmarks.getTree(tree => {
      let root = tree[0];
      let bookmarksBar = root.children.find(child => child.id === '1');
      this._stack[0] = root;
      this.openNode(bookmarksBar || root);
    });
  }

  static openNode(node = null) {
    if (node && node !== this._getCurrentNode()) {
      this._stack.push(node);
      this.$bookmarksUpButton.removeAttribute('hidden');
      this.$bookmarksTopIcon.setAttribute('hidden', '');
    } else {
      node = this._getCurrentNode();
    }

    if (node.url) {
      return;
    }

    this.$bookmarksTitle.textContent = this._getCurrentNode().title ||
                                       'Bookmarks';

    let children = node.children || [];
    let elements = this.$bookmarksDrawerItems.childNodes;

    while (children.length < elements.length) {
      this.$bookmarksDrawerItems.removeChild(
        this.$bookmarksDrawerItems.lastChild
      );
    }

    children.forEach((child, i) => {
      let bookmark = elements[i];
      if (!bookmark) {
        bookmark = document.createElement('x-bookmark');
        bookmark.small = Settings.get(Settings.keys.BOOKMARKS_DRAWER_SMALL);
        this.$bookmarksDrawerItems.appendChild(bookmark);
      }

      bookmark.node = child;
    });
  }

  static ascend() {
    if (!this._isTop()) {
      this._stack.pop();
      this.openNode();

      if (this._isTop()) {
        this.$bookmarksUpButton.setAttribute('hidden', '');
        this.$bookmarksTopIcon.removeAttribute('hidden');
      }
    }
  }

  static updateSize(small) {
    let elements =
      Array.prototype.slice.call(this.$bookmarksDrawerItems.childNodes);
    elements.forEach(element => element.small = small);
  }

  static _getCurrentNode() {
    return this._stack[this._stack.length - 1];
  }

  static _isTop() {
    return this._stack.length === 1;
  }
}

Bookmarks.main();

window.Bookmarks = Bookmarks;
