/* globals BookmarksNavigator */

// todo: add undo popup

class BookmarksEditor {
  constructor() {
    throw new TypeError('Static class cannot be instantiated.');
  }

  static main() {
    this.$drawer = document.querySelector('#bookmarks-drawer');
    this.$upButton = document.querySelector('#bookmarks-up-button');
    this.$drawerItems = document.querySelector('#bookmarks-drawer-items');
    this.$ctxMenu = document.querySelector('#bookmarks-ctx-menu');
    this.$ctxMenuName = document.querySelector('#bookmarks-ctx-menu-name');
    this.$ctxMenuEdit = document.querySelector('#bookmarks-ctx-menu-edit');
    this.$ctxMenuDelete = document.querySelector('#bookmarks-ctx-menu-delete');
    this.$ctxMenuAddPage =
      document.querySelector('#bookmarks-ctx-menu-add-page');
    this.$ctxMenuAddFolder =
      document.querySelector('#bookmarks-ctx-menu-add-folder');
    this.$editDialog = document.querySelector('#bookmarks-edit-dialog');
    this.$editDialogFavicon =
      document.querySelector('#bookmarks-edit-dialog-favicon');
    this.$editDialogTitle =
      document.querySelector('#bookmarks-edit-dialog-title');
    this.$editDialogName =
      document.querySelector('#bookmarks-edit-dialog-name');
    this.$editDialogURL =
      document.querySelector('#bookmarks-edit-dialog-url');
    this.$editDialogDone =
      document.querySelector('#bookmarks-edit-dialog .dialog-confirm');

    this._resetDragState();

    this.$ctxMenu.addEventListener('x-context-menu-close', () => {
      this.$drawer.classList.remove('ctx-menu-active');
    });

    this.$editDialog.addEventListener('x-dialog-open', () => {
      requestAnimationFrame(() => this.$editDialogName.focus());
    });

    this.$editDialogName.addEventListener('keypress', ev => {
      if (ev.keyCode === 13)
        this.$editDialogDone.click();
    });

    this.$editDialogURL.addEventListener('keypress', ev => {
      if (ev.keyCode === 13)
        this.$editDialogDone.click();
    });

    this.$editDialogURL.addEventListener('change', () => {
      this.$editDialogURL.value = this._fixUrl(this.$editDialogURL.value);
    });
  }

  static onBookmarkDragStart(ev) {
    this._currentDraggedBookmark = ev.target;
    this._currentDraggedBookmarkIndex = Array.prototype.indexOf.call(
      this.$drawerItems.childNodes, ev.target);
    this._currentDraggedOverBookmarkIndex = this._currentDraggedBookmarkIndex;
  }

  static onBookmarkDragOver(ev) {
    const index = Array.prototype.indexOf.call(this.$drawerItems.childNodes,
                                               ev.target);
    this._handleDragOver(ev.target, index, ev.detail.y);
  }

  static onBookmarkDrop(ev) {
    const index = Array.prototype.indexOf.call(this.$drawerItems.childNodes,
                                               ev.target);
    this._handleDrop(ev.target, index, ev.detail);
  }

  static onItemsDragOver(ev) {
    ev.preventDefault();

    if (this._currentDraggedBookmark)
      ev.dataTransfer.dropEffect = 'move';
    else
      ev.dataTransfer.dropEffect = 'copy';

    this.$drawerItems.classList.add('drag-over');

    if (ev.target === this.$drawerItems)
      this._handleDragOver(null, this.$drawerItems.childElementCount, ev.y);
  }

  static onItemsDrop(ev) {
    ev.preventDefault();

    if (ev.target === this.$drawerItems) {
      const bookmarkId = ev.dataTransfer.getData('text/x-bookmark-id') || null;
      const title = ev.dataTransfer.getData('text/plain');
      const url = ev.dataTransfer.getData('text/uri-list') || title;
      const index = this.$drawerItems.childElementCount;
      this._handleDrop(null, index, {bookmarkId, title, url, y: ev.y});
    }
  }

  static onUpButtonDragOver(ev) {
    ev.preventDefault();

    if (this._currentDraggedBookmark)
      ev.dataTransfer.dropEffect = 'move';
    else
      ev.dataTransfer.dropEffect = 'copy';

    const parentId = BookmarksNavigator.parentFolder;
    if (parentId && parentId !== BookmarksNavigator.ROOT_ID)
      this.$upButton.classList.add('expand');
  }

  static onUpButtonDragLeave(ev) {
    if (ev.target === this.$upButton)
      this.$upButton.classList.remove('expand');
  }

  static onUpButtonDrop(ev) {
    ev.preventDefault();
    this.$upButton.classList.remove('expand');

    const parentId = BookmarksNavigator.parentFolder;
    if (parentId && parentId !== BookmarksNavigator.ROOT_ID) {
      const bookmarkId = ev.dataTransfer.getData('text/x-bookmark-id') || null;
      if (bookmarkId) {
        chrome.bookmarks.move(bookmarkId, {parentId});
      } else {
        const title = ev.dataTransfer.getData('text/plain');
        const url = ev.dataTransfer.getData('text/uri-list') || title;
        chrome.bookmarks.create({parentId, title, url});
      }
    }
  }

  static onDragLeave(ev) {
    const rect = this.$drawerItems.getBoundingClientRect();
    if (ev.x < rect.left || ev.x > rect.right ||
        ev.y < rect.top || ev.y > rect.bottom)
      this._returnDragHome();
  }

  static onDragEnd() {
    this._resetDragState();
  }

  static openCtxMenu(x, y, nodeId) {
    this.$drawer.classList.add('ctx-menu-active');

    this.$ctxMenuName.hidden = !nodeId;
    if (nodeId)
      chrome.bookmarks.get(nodeId, ([node]) => {
        this.$ctxMenuName.textContent = BookmarksNavigator.getNodeTitle(node);
      });

    if (nodeId !== BookmarksNavigator.ROOT_ID) {
      this.$ctxMenuAddPage.classList.remove('disabled');
      this.$ctxMenuAddPage.onclick = () => {
        this._openCreateDialog(false, null);
      };

      this.$ctxMenuAddFolder.classList.remove('disabled');
      this.$ctxMenuAddFolder.onclick = () => {
        this._openCreateDialog(true, null);
      };
    } else {
      this.$ctxMenuAddPage.classList.add('disabled');
      this.$ctxMenuAddPage.onclick = () => {};

      this.$ctxMenuAddFolder.classList.add('disabled');
      this.$ctxMenuAddFolder.onclick = () => {};
    }

    if (BookmarksNavigator.nodeIsEditable(nodeId)) {
      this.$ctxMenuEdit.classList.remove('disabled');
      this.$ctxMenuEdit.onclick = () => {
        this._openEditDialog(nodeId);
      };

      this.$ctxMenuDelete.classList.remove('disabled');
      this.$ctxMenuDelete.onclick = () => {
        chrome.bookmarks.getChildren(nodeId, children => {
          if (children)
            chrome.bookmarks.removeTree(nodeId);
          else
            chrome.bookmarks.remove(nodeId);
        });
      };
    } else {
      this.$ctxMenuEdit.classList.add('disabled');
      this.$ctxMenuEdit.onclick = () => {};

      this.$ctxMenuDelete.classList.add('disabled');
      this.$ctxMenuDelete.onclick = () => {};
    }

    requestAnimationFrame(() => this.$ctxMenu.show(x, y));
  }

  /**
   * Add transforms to bookmark elements when something is dragged over.
   *
   * @param {?XBookmarkElement} target The element the mouse is currently over,
   *   or null if the mouse is over empty space.
   * @param {number} targetI The index of the current dragged over bookmark.
   * @param {number} y Y coordinate of the mouse.
   */
  static _handleDragOver(target, targetI, y) {
    const startI = this._currentDraggedBookmarkIndex;
    const isDraggingDown = (startI < targetI);
    const isAtStart = (targetI === startI);

    const nodeId = target ? target.node.id : BookmarksNavigator.currentFolder;
    const targetIsEditable = BookmarksNavigator.nodeIsEditable(nodeId);

    if (target && !isAtStart) {
      const dragged = this._currentDraggedBookmark;
      const draggedIsEditable =
        !dragged || BookmarksNavigator.nodeIsEditable(dragged.node.id);

      if (draggedIsEditable &&
          this._isFolderDrop(target.isFolder, targetIsEditable, isDraggingDown,
                             y, target.getBoundingClientRect()))
        target.classList.add('expand');
      else
        target.classList.remove('expand');
    }

    if (targetI !== this._currentDraggedOverBookmarkIndex && targetIsEditable) {
      this.$drawerItems.classList.remove('no-animate-translate');

      const childNodes = this.$drawerItems.childNodes;
      const oldTargetI = Math.min(this._currentDraggedOverBookmarkIndex,
                                  childNodes.length);

      this._currentDraggedOverBookmarkIndex = targetI;

      if (isAtStart) {
        // Back at start
        if (startI < oldTargetI)
          // When coming out of whitespace, oldTargetI can get too big when
          // incremented, so we ensure it doesn't exceed the length with
          // Math.min().
          for (let i = startI + 1;
               i < Math.min(oldTargetI + 1, childNodes.length);
               i++)
            childNodes[i].classList.remove('translate-up');
        else if (startI > oldTargetI)
          for (let i = oldTargetI; i < startI; i++)
            childNodes[i].classList.remove('translate-down');
      } else if (isDraggingDown) {
        if (oldTargetI < targetI)
          // When in whitespace, targetI can get too big when incremented, so we
          // ensure it doesn't exceed the length with Math.min().
          for (let i = oldTargetI + 1;
               i < Math.min(targetI + 1, childNodes.length);
               i++) {
            childNodes[i].classList.add('translate-up');
            childNodes[i].classList.remove('translate-down');
          }
        else
          // When coming out of whitespace, oldTargetI can get too big when
          // incremented, so we ensure it doesn't exceed the length with
          // Math.min().
          for (let i = targetI + 1;
               i < Math.min(oldTargetI + 1, childNodes.length);
               i++)
            childNodes[i].classList.remove('translate-up');
      } else if (oldTargetI === targetI) {
        // They are dragging upwards in the whitespace below the bookmarks,
        // meaning they are dragging in an external link/other thing
        console.assert(targetI === childNodes.length);
        const lastChild = this.$drawerItems.lastChild;
        if (lastChild)
          lastChild.classList.remove('translate-down');
      } else if (oldTargetI > targetI) {
        for (let i = targetI; i < oldTargetI; i++) {
          childNodes[i].classList.add('translate-down');
          childNodes[i].classList.remove('translate-up');
        }
      } else {
        for (let i = oldTargetI; i < targetI; i++)
          childNodes[i].classList.remove('translate-down');
      }
    }
  }

  /**
   * Move or create bookmarks for drop event within the bookmarks list.
   *
   * @param {?XBookmarkElement} target The bookmark dropped over, or null if
   *   it was dropped over an empty area.
   * @param {number} index The index of the bookmark being dropped on.
   * @param {{bookmarkId: string, title: string, url: string, y: number}} detail
   *   Information about the dragged bookmark/link and the mouse position.
   */
  static _handleDrop(target, index, detail) {
    const targetId = target ? target.node.id : BookmarksNavigator.currentFolder;
    const targetIsEditable = BookmarksNavigator.nodeIsEditable(targetId);

    const draggedElement = this._currentDraggedBookmark;
    const draggedIsEditable = !draggedElement ||
      BookmarksNavigator.nodeIsEditable(draggedElement.node.id);

    if (draggedElement && draggedElement !== target && draggedIsEditable) {
      const startI = this._currentDraggedBookmarkIndex;
      const isDraggingDown = (startI < index);
      const rect = target ? target.getBoundingClientRect() : null;

      if (target &&
          this._isFolderDrop(target.isFolder, targetIsEditable,
                             isDraggingDown, detail.y, rect)) {
        target.classList.remove('expand');
        chrome.bookmarks.move(detail.bookmarkId, {
          parentId: target.node.id,
        });
      } else {
        let indexOffset = 0;
        let beforeElement;
        if (target && this._currentDraggedBookmarkIndex < index) {
          // When we are dragging down, we put it after the current hovered one.
          indexOffset = 1;
          beforeElement = target.nextSibling;
        } else {
          beforeElement = target;
        }

        this.$drawerItems.removeChild(draggedElement);
        this.$drawerItems.insertBefore(draggedElement, beforeElement);

        chrome.bookmarks.move(detail.bookmarkId, {
          parentId: BookmarksNavigator.currentFolder,
          index: index + indexOffset,
        });
      }
    } else if (!draggedElement) {
      if (target &&
          this._isFolderDrop(target.isFolder, targetIsEditable, false,
                             detail.y, target.getBoundingClientRect())) {
        chrome.bookmarks.create({
          parentId: target.node.id,
          title: detail.title,
          url: this._fixUrl(detail.url),
        });
      } else if (BookmarksNavigator.currentFolder !==
                 BookmarksNavigator.ROOT_ID) {
        const beforeElement = this.$drawerItems.childNodes[index];
        const bookmark = document.createElement('x-bookmark');
        this.$drawerItems.insertBefore(bookmark, beforeElement);

        chrome.bookmarks.create({
          parentId: BookmarksNavigator.currentFolder,
          title: detail.title,
          url: this._fixUrl(detail.url),
          index,
        });
      }
    }

    this._resetDragState();
  }

  /**
   * Check if a folder is being hovered over to be dropped into.
   *
   * @param {boolean} isFolder Whether the current hovered bookmark is a folder.
   * @param {boolean} isEditable Whether the current hovered bookmark is
   *   editable.
   * @param {boolean} isDraggingDown Whether they are dragging from below or
   *   above the current hovered bookmark.
   * @param {number} y The Y coordinate of the mouse.
   * @param {ClientRect} rect The bounds of the current hovered bookmark.
   */
  static _isFolderDrop(isFolder, isEditable, isDraggingDown, y, rect) {
    if (isFolder) {
      if (!isEditable)
        return true;

      const deadWidth = 0.3 * rect.height;
      if (isDraggingDown)
        return rect.bottom - deadWidth > y;
      else
        return rect.top + deadWidth < y;
    } else {
      return false;
    }
  }

  static _resetDragState() {
    this._currentDraggedBookmark = null;
    this._currentDraggedBookmarkIndex = Number.MAX_SAFE_INTEGER;

    this.$drawerItems.classList.add('no-animate-translate');

    this._returnDragHome();
  }

  static _returnDragHome() {
    this._currentDraggedOverBookmarkIndex = this._currentDraggedBookmarkIndex;

    this.$drawerItems.classList.remove('drag-over');

    const childNodes = this.$drawerItems.childNodes;
    Array.prototype.slice.call(childNodes).forEach(element => {
      element.classList.remove('translate-up');
      element.classList.remove('translate-down');
    });
  }

  static _openEditDialog(nodeId) {
    this.$editDialog.open();

    this.$editDialogTitle.textContent = 'Edit';

    chrome.bookmarks.get(nodeId, ([{title, url}]) => {
      this.$editDialogName.value = title || '';
      if (url) {
        this.$editDialogURL.hidden = false;
        this.$editDialogURL.value = url;
        this.$editDialogFavicon.src = `chrome://favicon/size/16@8x/${url}`;
      } else {
        this.$editDialogURL.hidden = true;
        this.$editDialogFavicon.src = '/images/folder-outline.svg';
      }
    });

    this.$editDialogDone.onclick = () => {
      chrome.bookmarks.update(nodeId, {
        title: this.$editDialogName.value,
        url: this.$editDialogURL.value,
      });
    };
  }

  static _openCreateDialog(isFolder, nodeId) {
    this.$editDialog.open();
    this.$editDialogTitle.textContent = isFolder ? 'Add Folder' : 'Add Page';
    this.$editDialogName.value = '';
    this.$editDialogURL.value = '';
    this.$editDialogURL.hidden = isFolder;
    this.$editDialogFavicon.src = isFolder ? '/images/folder-outline.svg' :
                                             'chrome://favicon/size/16@8x/';

    this.$editDialogDone.onclick = () => {
      if (!isFolder && !this.$editDialogURL.value)
        return;

      const create = parentId => chrome.bookmarks.create({
        parentId,
        title: this.$editDialogName.value,
        url: this.$editDialogURL.value,
      });

      if (nodeId)
        chrome.bookmarks.get(nodeId, ([node]) => {
          if (node.url)
            create(node.parentId);
          else
            create(node.id);
        });
      else
        create(BookmarksNavigator.currentFolder);

      this.$editDialog.close();
    };
  }

  static _fixUrl(url) {
    if (url && url.search('://') === -1)
      return `http://${url}`;
    else
      return url;
  }
}

BookmarksEditor.main();

window.BookmarksEditor = BookmarksEditor;
