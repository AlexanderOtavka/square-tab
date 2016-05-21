/* globals Settings */
'use strict';

class BookmarksNavigator {
  constructor() {
    throw new TypeError('Static class cannot be instantiated.');
  }

  static main() {
    this.$bookmarksTitle = document.querySelector('#bookmarks-drawer .title');
    this.$bookmarksUpButton = document.querySelector('#bookmarks-up-button');
    this.$bookmarksDrawerItems =
      document.querySelector('#bookmarks-drawer-items');

    const ROOT_ID = '0';
    const BOOKMARKS_BAR_ID = '1';
    this._stack = [ROOT_ID, BOOKMARKS_BAR_ID];

    this.openBookmark(this.currentFolder);

    chrome.bookmarks.onCreated.addListener((id, node) => {
      if (node.parentId === this.currentFolder) {
        this._createElement(node);
      }
    });

    chrome.bookmarks.onRemoved.addListener((id, { parentId, index }) => {
      if (parentId === this.currentFolder) {
        this._deleteElementByIndex(index);
      } else if (this._stack.indexOf(id) !== -1) {
        this._stack.splice(this._stack.indexOf(id));
        this.openBookmark(this.currentFolder);
      }
    });

    chrome.bookmarks.onMoved.addListener((id, moveInfo) => {
      if (moveInfo.parentId === this.currentFolder &&
          moveInfo.oldParentId === this.currentFolder) {
        let element = this.$bookmarksDrawerItems.childNodes[moveInfo.oldIndex];
        if (element.node.id === id) {
          this.$bookmarksDrawerItems.removeChild(element);

          let beforeElement =
            this.$bookmarksDrawerItems.childNodes[moveInfo.index];
          console.assert(beforeElement ? (beforeElement.node.id !== id) : true);
          this.$bookmarksDrawerItems.insertBefore(element, beforeElement);
        }
      } else if (moveInfo.parentId === this.currentFolder) {
        chrome.bookmarks.get(id, node => {
          this._createElement(node);
        });
      } else if (moveInfo.oldParentId === this.currentFolder) {
        this._deleteElementByIndex(moveInfo.oldIndex);
      } else if (this._stack.indexOf(id) !== -1) {
        this._generateStackFrom(id).then(stack => {
          this._stack = stack;
          this.openBookmark(this.currentFolder);
        });
      }
    });

    chrome.bookmarks.onChanged.addListener((id, changes) => {
      let element = this._elements.find(element => element.node.id === id);
      if (element) {
        element.node = Object.assign(element.node, changes);
      }
    });

    chrome.bookmarks.onChildrenReordered.addListener(id => {
      if (id === this.currentFolder) {
        this.openBookmark(this.currentFolder);
      }
    });
  }

  static openBookmark(id) {
    if (id !== this.currentFolder) {
      this._stack.push(id);
    }

    this._updateUpButton();

    chrome.bookmarks.get(id, ([node]) => {
      if (!node.url) {
        this.$bookmarksTitle.textContent = node.title || 'BookmarksNavigator';

        chrome.bookmarks.getChildren(id, children => {
          let elements = this.$bookmarksDrawerItems.childNodes;

          while (children.length < elements.length) {
            this.$bookmarksDrawerItems.removeChild(
              this.$bookmarksDrawerItems.lastChild
            );
          }

          children.forEach((child, i) => {
            let bookmark = elements[i];
            if (!bookmark) {
              this._createElement(child);
            } else {
              bookmark.node = child;
            }
          });
        });
      }
    });
  }

  static ascend() {
    if (!this._isTop) {
      this._stack.pop();
      this.openBookmark(this.currentFolder);
    }
  }

  static updateSize(small) {
    this._elements.forEach(element => element.small = small);
  }

  static get currentFolder() {
    return this._stack[this._stack.length - 1];
  }

  static get _isTop() {
    return this._stack.length === 1;
  }

  static get _elements() {
    return Array.prototype.slice.call(this.$bookmarksDrawerItems.childNodes);
  }

  static _createElement(node) {
    let beforeElement = this.$bookmarksDrawerItems.childNodes[node.index];
    let bookmark = document.createElement('x-bookmark');
    bookmark.small = Settings.get(Settings.keys.BOOKMARKS_DRAWER_SMALL);
    bookmark.node = node;
    this.$bookmarksDrawerItems.insertBefore(bookmark, beforeElement);
  }

  static _deleteElementByIndex(index) {
    let element = this.$bookmarksDrawerItems.childNodes[index];
    this.$bookmarksDrawerItems.removeChild(element);
  }

  static _generateStackFrom(id, stack = []) {
    return new Promise(resolve => {
      stack.splice(0, 0, id);
      chrome.bookmarks.get(id, ([node]) => {
        if (node.parentId) {
          resolve(this._generateStackFrom(node.parentId, stack));
        } else {
          resolve(stack);
        }
      });
    });
  }

  static _updateUpButton() {
    if (this._isTop) {
      this.$bookmarksUpButton.icon = 'folder';
      this.$bookmarksUpButton.button = false;
    } else {
      this.$bookmarksUpButton.icon = 'folder-up';
      this.$bookmarksUpButton.button = true;
    }
  }
}

BookmarksNavigator.main();

window.BookmarksNavigator = BookmarksNavigator;
