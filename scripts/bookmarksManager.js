(function (app) {
'use strict';

const $bookmarksTitle = document.querySelector('#bookmarks-drawer .title');
const $bookmarksUpButton = document.querySelector('#bookmarks-up-button');
const $bookmarksDrawerItems = document.querySelector('#bookmarks-drawer-items');

let bookmarksManager = {
  stack: [],

  init(root) {
    this.stack[0] = root;
    let bookmarksBar = root.children.find(child => child.id === '1');
    this.openNode(bookmarksBar || root);
  },

  getCurrentNode() {
    return this.stack[this.stack.length - 1];
  },

  isTop() {
    return this.stack.length === 1;
  },

  ascend() {
    if (!this.isTop()) {
      this.stack.pop();
      this.openNode();

      if (this.isTop()) {
        $bookmarksUpButton.setAttribute('hidden', '');
      }
    }
  },

  openNode(node = null) {
    if (node && node !== this.getCurrentNode()) {
      this.stack.push(node);
      $bookmarksUpButton.removeAttribute('hidden');
    } else {
      node = this.getCurrentNode();
    }

    if (node.url) {
      return;
    }

    $bookmarksTitle.textContent = this.getCurrentNode().title || 'Bookmarks';

    let children = node.children || [];
    let elements = $bookmarksDrawerItems.childNodes;

    while (children.length < elements.length) {
      $bookmarksDrawerItems.removeChild($bookmarksDrawerItems.lastChild);
    }

    children.forEach((child, i) => {
      let bookmark = elements[i];
      if (!bookmark) {
        bookmark = document.createElement('x-bookmark');
        $bookmarksDrawerItems.appendChild(bookmark);
      }

      bookmark.setNode(child);
    });
  },
};

chrome.bookmarks.getTree(tree => {
  let root = tree[0];
  bookmarksManager.init(root);
});

app.bookmarksManager = bookmarksManager;

})(window.app = window.app || {});
