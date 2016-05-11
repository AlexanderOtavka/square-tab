(function (app) {
'use strict';

const {
  settings,
} = app;

const $bookmarksTitle = document.querySelector('#bookmarks-drawer .title');
const $bookmarksUpButton = document.querySelector('#bookmarks-up-button');
const $bookmarksTopIcon = document.querySelector('#bookmarks-top-icon');
const $bookmarksDrawerItems = document.querySelector('#bookmarks-drawer-items');

let _stack = [];

chrome.bookmarks.getTree(tree => {
  let root = tree[0];
  _stack[0] = root;
  let bookmarksBar = root.children.find(child => child.id === '1');
  openNode(bookmarksBar || root);
});

function openNode(node = null) {
  if (node && node !== _getCurrentNode()) {
    _stack.push(node);
    $bookmarksUpButton.removeAttribute('hidden');
    $bookmarksTopIcon.setAttribute('hidden', '');
  } else {
    node = _getCurrentNode();
  }

  if (node.url) {
    return;
  }

  $bookmarksTitle.textContent = _getCurrentNode().title || 'Bookmarks';

  let children = node.children || [];
  let elements = $bookmarksDrawerItems.childNodes;

  while (children.length < elements.length) {
    $bookmarksDrawerItems.removeChild($bookmarksDrawerItems.lastChild);
  }

  children.forEach((child, i) => {
    let bookmark = elements[i];
    if (!bookmark) {
      bookmark = document.createElement('x-bookmark');
      bookmark.dataset.small =
        settings.get(settings.keys.BOOKMARKS_DRAWER_SMALL);
      $bookmarksDrawerItems.appendChild(bookmark);
    }

    bookmark.node = child;
  });
}

function ascend() {
  if (!_isTop()) {
    _stack.pop();
    openNode();

    if (_isTop()) {
      $bookmarksUpButton.setAttribute('hidden', '');
      $bookmarksTopIcon.removeAttribute('hidden');
    }
  }
}

function updateSize(small) {
  let elements = Array.prototype.slice.call($bookmarksDrawerItems.childNodes);
  elements.forEach(element => element.dataset.small = small);
}

function _getCurrentNode() {
  return _stack[_stack.length - 1];
}

function _isTop() {
  return _stack.length === 1;
}

app.bookmarks = {
  openNode,
  ascend,
  updateSize,
};

})(window.app = window.app || {});
