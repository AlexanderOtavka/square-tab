/* globals BookmarksNavigator */
'use strict';

class BookmarksEditor {
  constructor() {
    throw new TypeError('Static class cannot be instantiated.');
  }

  static main() {
    this.$bookmarksDrawerItems =
      document.querySelector('#bookmarks-drawer-items');

    this._resetDragState();
  }

  static onDragStart(ev) {
    this._currentDraggedBookmark = ev.target;
    this._currentDraggedBookmarkIndex = Array.prototype.indexOf.call(
      this.$bookmarksDrawerItems.childNodes, ev.target);
    this._currentDraggedOverBookmarkIndex = this._currentDraggedBookmarkIndex;
  }

  static onDragOver(ev) {
    this.$bookmarksDrawerItems.classList.add('animate-translate');

    if (ev.target === this._currentDraggedBookmark) {
      let childNodes = this.$bookmarksDrawerItems.childNodes;
      let startI = this._currentDraggedBookmarkIndex;
      let oldEndI = this._currentDraggedOverBookmarkIndex;
      this._currentDraggedOverBookmarkIndex = startI;

      if (startI < oldEndI) {
        for (let i = startI + 1; i <= oldEndI; i++) {
          childNodes[i].classList.remove('translate-up');
        }
      } else if (startI > oldEndI) {
        for (let i = oldEndI; i < startI; i++) {
          childNodes[i].classList.remove('translate-down');
        }
      }
    } else if (ev.target !== this._currentDraggedOverBookmark) {
      this._currentDraggedOverBookmark = ev.target;

      let childNodes = this.$bookmarksDrawerItems.childNodes;
      let startI = this._currentDraggedBookmarkIndex;
      let endI = Array.prototype.indexOf.call(childNodes, ev.target);
      let oldEndI = Math.min(this._currentDraggedOverBookmarkIndex,
                             childNodes.length);
      this._currentDraggedOverBookmarkIndex = endI;

      if (startI < endI) {
        if (oldEndI < endI) {
          for (let i = oldEndI + 1; i <= endI; i++) {
            childNodes[i].classList.add('translate-up');
            childNodes[i].classList.remove('translate-down');
          }
        } else {
          for (let i = endI + 1; i <= oldEndI; i++) {
            childNodes[i].classList.remove('translate-up');
          }
        }
      } else {
        if (oldEndI > endI) {
          for (let i = endI; i < oldEndI; i++) {
            childNodes[i].classList.add('translate-down');
            childNodes[i].classList.remove('translate-up');
          }
        } else {
          for (let i = oldEndI; i < endI; i++) {
            childNodes[i].classList.remove('translate-down');
          }
        }
      }
    }
  }

  static onDrop(ev) {
    if (ev.target !== this._currentDraggedBookmark) {
      let index = Array.prototype.indexOf.call(
        this.$bookmarksDrawerItems.childNodes, ev.target);
      let element = this._currentDraggedBookmark;
      let beforeElement = ev.target;

      // When we are dragging down, we put it after the current hovered one.
      if (this._currentDraggedBookmarkIndex < index) {
        console.log('dragging down');
        index++;
        beforeElement = beforeElement.nextSibling;
      }

      if (element) {
        this.$bookmarksDrawerItems.removeChild(element);
        this.$bookmarksDrawerItems.insertBefore(element, beforeElement);

        chrome.bookmarks.move(ev.detail.bookmarkId, {
          parentId: BookmarksNavigator.currentFolder,
          index,
        });
      } else {
        let beforeElement = this.$bookmarksDrawerItems.childNodes[index];
        let bookmark = document.createElement('x-bookmark');
        this.$bookmarksDrawerItems.insertBefore(bookmark, beforeElement);

        chrome.bookmarks.create({
          parentId: BookmarksNavigator.currentFolder,
          title: ev.detail.title,
          url: ev.detail.uri,
          index,
        });
      }
    }

    this._resetDragState();
  }

  static _resetDragState() {
    this._currentDraggedBookmark = null;
    this._currentDraggedOverBookmark = null;
    this._currentDraggedBookmarkIndex = Number.MAX_SAFE_INTEGER;
    this._currentDraggedOverBookmarkIndex = Number.MAX_SAFE_INTEGER;

    this.$bookmarksDrawerItems.classList.remove('animate-translate');

    let childNodes = this.$bookmarksDrawerItems.childNodes;
    Array.prototype.slice.call(childNodes).forEach(element => {
      element.classList.remove('translate-up');
      element.classList.remove('translate-down');
    });
  }
}

BookmarksEditor.main();

window.BookmarksEditor = BookmarksEditor;
