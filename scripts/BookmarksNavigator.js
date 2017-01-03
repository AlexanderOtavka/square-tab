/* globals Settings */

class BookmarksNavigator {
  constructor() {
    throw new TypeError('Static class cannot be instantiated.');
  }

  static get currentFolder() {
    return this._stack[this._stack.length - 1];
  }

  static get parentFolder() {
    return (this._stack.length > 1) ?
      this._stack[this._stack.length - 2] : null;
  }

  static main() {
    this.$header = document.querySelector('#bookmarks-drawer .drawer-header');
    this.$upButton = document.querySelector('#bookmarks-up-button');
    this.$title = document.querySelector('#bookmarks-drawer .title');
    this.$drawerItems = document.querySelector('#bookmarks-drawer-items');
    this.$drawerTooltip = document.querySelector('#bookmarks-drawer-tooltip');

    const ROOT_ID = '0';
    const BOOKMARKS_BAR_ID = '1';
    this._stack = [ROOT_ID, BOOKMARKS_BAR_ID];

    this.openBookmark(this.currentFolder);

    chrome.bookmarks.onCreated.addListener((id, node) => {
      if (node.parentId === this.currentFolder)
        this._createOrUpdateElement(node);
    });

    chrome.bookmarks.onRemoved.addListener((id, {parentId, index}) => {
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
        const element = this.$drawerItems.childNodes[moveInfo.oldIndex];
        if (element.node.id === id) {
          this.$drawerItems.removeChild(element);

          const beforeElement =
            this.$drawerItems.childNodes[moveInfo.index];
          console.assert(beforeElement ? (beforeElement.node.id !== id) : true);
          this.$drawerItems.insertBefore(element, beforeElement);
        }
      } else if (moveInfo.parentId === this.currentFolder) {
        chrome.bookmarks.get(id, ([node]) => {
          this._createOrUpdateElement(node);
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
      const element = this._elements.find(el => el.node.id === id);
      if (element)
        element.node = Object.assign(element.node, changes);
    });

    chrome.bookmarks.onChildrenReordered.addListener(id => {
      if (id === this.currentFolder)
        this.openBookmark(this.currentFolder);
    });
  }

  static onBookmarkMouseOver(ev) {
    if (Settings.get(Settings.keys.BOOKMARKS_DRAWER_SMALL))
      this.$drawerTooltip.show(ev.target, ev.target.name);
  }

  static onUpButtonMouseOver() {
    if (Settings.get(Settings.keys.BOOKMARKS_DRAWER_SMALL))
      this.$drawerTooltip.show(this.$header, this.$title.title);
  }

  static hideTooltip() {
    this.$drawerTooltip.hide();
  }

  static openBookmark(id) {
    if (id !== this.currentFolder)
      this._stack.push(id);

    this._updateUpButton();

    chrome.bookmarks.get(id, ([node]) => {
      if (!node.url) {
        const title = node.title || 'Bookmarks';
        this.$title.textContent = title;
        this.$title.title = title;

        chrome.bookmarks.getChildren(id, children => {
          const elements = this.$drawerItems.childNodes;

          while (children.length < elements.length)
            this.$drawerItems.removeChild(
              this.$drawerItems.lastChild
            );


          children.forEach((child, i) => {
            const bookmark = elements[i];
            if (!bookmark)
              this._createOrUpdateElement(child);
            else
              bookmark.node = child;
          });

          const $hoveredBookmark =
            this.$drawerItems.querySelector('x-bookmark:hover');
          if ($hoveredBookmark)
            this.$drawerTooltip.name = $hoveredBookmark.name;
          else if (document.querySelector('#bookmarks-up-button:hover'))
            this.$drawerTooltip.name = title;
          else
            this.hideTooltip();
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
    this._elements.forEach(element => {
      element.small = small;
    });
  }

  static get _isTop() {
    return this._stack.length === 1;
  }

  static get _elements() {
    return Array.prototype.slice.call(this.$drawerItems.childNodes);
  }

  static _createOrUpdateElement(node) {
    const beforeElement = this.$drawerItems.childNodes[node.index];
    let bookmark;
    if (beforeElement &&
        (!beforeElement.node || beforeElement.node.id === node.id)) {
      bookmark = beforeElement;
    } else {
      bookmark = document.createElement('x-bookmark');
      this.$drawerItems.insertBefore(bookmark, beforeElement);
    }

    bookmark.small = Settings.get(Settings.keys.BOOKMARKS_DRAWER_SMALL);
    bookmark.node = node;
  }

  static _deleteElementByIndex(index) {
    const element = this.$drawerItems.childNodes[index];
    this.$drawerItems.removeChild(element);
  }

  static _generateStackFrom(id, stack = []) {
    return new Promise(resolve => {
      stack.splice(0, 0, id);
      chrome.bookmarks.get(id, ([node]) => {
        if (node.parentId)
          resolve(this._generateStackFrom(node.parentId, stack));
        else
          resolve(stack);
      });
    });
  }

  static _updateUpButton() {
    if (this._isTop) {
      this.$upButton.icon = 'folder';
      this.$upButton.button = false;
    } else {
      this.$upButton.icon = 'folder-up';
      this.$upButton.button = true;
    }
  }
}

BookmarksNavigator.main();

window.BookmarksNavigator = BookmarksNavigator;
