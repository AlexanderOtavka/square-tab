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

  static onBookmarkDragStart(ev) {
    this._currentDraggedBookmark = ev.target;
    this._currentDraggedBookmarkIndex = Array.prototype.indexOf.call(
      this.$bookmarksDrawerItems.childNodes, ev.target);
    this._currentDraggedOverBookmarkIndex = this._currentDraggedBookmarkIndex;
  }

  static onBookmarkDragOver(ev) {
    let index = Array.prototype.indexOf.call(
      this.$bookmarksDrawerItems.childNodes, ev.target);
    this._handleDragOver(index);
  }

  static onBookmarkDrop(ev) {
    let index = Array.prototype.indexOf.call(
      this.$bookmarksDrawerItems.childNodes, ev.target);
    this._handleDrop(ev.detail, index, ev.target);
  }

  static onItemsDragOver(ev) {
    ev.preventDefault();
    ev.dataTransfer.dropEffect = 'move';

    this.$bookmarksDrawerItems.classList.add('drag-over');

    if (ev.target === this.$bookmarksDrawerItems) {
      this._handleDragOver(this.$bookmarksDrawerItems.childElementCount);
    }
  }

  static onItemsDrop(ev) {
    ev.preventDefault();

    if (ev.target === this.$bookmarksDrawerItems) {
      let bookmarkId = ev.dataTransfer.getData('text/x-bookmark-id') || null;
      let title = ev.dataTransfer.getData('text/plain');
      let url = ev.dataTransfer.getData('text/uri-list') || title;
      let index = this.$bookmarksDrawerItems.childElementCount;
      this._handleDrop({ bookmarkId, title, url }, index, null);
    }
  }

  static onDragLeave(ev) {
    let rect = this.$bookmarksDrawerItems.getBoundingClientRect();
    if (ev.x < rect.left || ev.x > rect.right ||
        ev.y < rect.top || ev.y > rect.bottom) {
      this._returnDragHome();
    }
  }

  static onDragEnd() {
    this._resetDragState();
  }

  static _handleDragOver(targetI) {
    if (targetI !== this._currentDraggedOverBookmarkIndex) {
      this.$bookmarksDrawerItems.classList.remove('no-animate-translate');

      let childNodes = this.$bookmarksDrawerItems.childNodes;
      let startI = this._currentDraggedBookmarkIndex;
      let oldTargetI = Math.min(this._currentDraggedOverBookmarkIndex,
                                childNodes.length);

      this._currentDraggedOverBookmarkIndex = targetI;

      if (targetI === startI) {
        if (startI < oldTargetI) {
          startI++;
          oldTargetI++;

          for (let i = startI; i < oldTargetI; i++) {
            childNodes[i].classList.remove('translate-up');
          }
        } else if (startI > oldTargetI) {
          for (let i = oldTargetI; i < startI; i++) {
            childNodes[i].classList.remove('translate-down');
          }
        }
      } else {
        if (startI < targetI) {
          targetI++;
          oldTargetI++;

          if (oldTargetI < targetI) {
            // When in whitespace, targetI can get too big when ++'d, so we
            // snap it back down to avoid index-out-of-bounds problems.
            if (targetI > childNodes.length) {
              targetI = childNodes.length;
            }

            for (let i = oldTargetI; i < targetI; i++) {
              childNodes[i].classList.add('translate-up');
              childNodes[i].classList.remove('translate-down');
            }
          } else {
            // When coming out of whitespace, oldTargetI can get too big when
            // ++'d, so we snap it back down to avoid index-out-of-bounds
            // problems.
            if (oldTargetI > childNodes.length) {
              oldTargetI = childNodes.length;
            }

            for (let i = targetI; i < oldTargetI; i++) {
              childNodes[i].classList.remove('translate-up');
            }
          }
        } else {
          if (oldTargetI === targetI) {
            // They are dragging upwards in the whitespace below the bookmarks,
            // meaning they are dragging in an external link/other thing
            console.assert(targetI === childNodes.length);
            let lastChild = this.$bookmarksDrawerItems.lastChild;
            if (lastChild) {
              lastChild.classList.remove('translate-down');
            }
          } else if (oldTargetI > targetI) {
            for (let i = targetI; i < oldTargetI; i++) {
              childNodes[i].classList.add('translate-down');
              childNodes[i].classList.remove('translate-up');
            }
          } else {
            for (let i = oldTargetI; i < targetI; i++) {
              childNodes[i].classList.remove('translate-down');
            }
          }
        }
      }
    }
  }

  static _handleDrop(detail, index, beforeElement) {
    let element = this._currentDraggedBookmark;

    if (!element || element !== beforeElement) {
      // When we are dragging down, we put it after the current hovered one.
      if (this._currentDraggedBookmarkIndex < index) {
        index++;
        beforeElement = beforeElement.nextSibling;
      }

      if (element) {
        this.$bookmarksDrawerItems.removeChild(element);
        this.$bookmarksDrawerItems.insertBefore(element, beforeElement);

        chrome.bookmarks.move(detail.bookmarkId, {
          parentId: BookmarksNavigator.currentFolder,
          index,
        });
      } else {
        let beforeElement = this.$bookmarksDrawerItems.childNodes[index];
        let bookmark = document.createElement('x-bookmark');
        this.$bookmarksDrawerItems.insertBefore(bookmark, beforeElement);

        chrome.bookmarks.create({
          parentId: BookmarksNavigator.currentFolder,
          title: detail.title,
          url: detail.url,
          index,
        });
      }
    }

    this._resetDragState();
  }

  static _resetDragState() {
    this._currentDraggedBookmark = null;
    this._currentDraggedBookmarkIndex = Number.MAX_SAFE_INTEGER;

    this.$bookmarksDrawerItems.classList.add('no-animate-translate');

    this._returnDragHome();
  }

  static _returnDragHome() {
    this._currentDraggedOverBookmarkIndex = this._currentDraggedBookmarkIndex;

    this.$bookmarksDrawerItems.classList.remove('drag-over');

    let childNodes = this.$bookmarksDrawerItems.childNodes;
    Array.prototype.slice.call(childNodes).forEach(element => {
      element.classList.remove('translate-up');
      element.classList.remove('translate-down');
    });
  }
}

BookmarksEditor.main();

window.BookmarksEditor = BookmarksEditor;
