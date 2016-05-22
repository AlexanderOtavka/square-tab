/* globals BookmarksNavigator, BookmarksEditor, Settings, Weather */
'use strict';

class NewTab {
  constructor() {
    throw new TypeError('Static class cannot be instantiated.');
  }

  static get DEFAULT_IMAGE_URL() {
    let screenPxWidth = window.screen.availWidth * window.devicePixelRatio;
    let screenPxHeight = window.screen.availHeight * window.devicePixelRatio;
    return 'https://source.unsplash.com/category/nature/' +
           `${screenPxWidth}x${screenPxHeight}/`;
  }

  static main() {
    this.$root = document.documentElement;
    this.$body = document.body;
    this.$backgroundImage = document.querySelector('#background-image');
    this.$time = document.querySelector('#time');
    this.$greeting = document.querySelector('#greeting');
    this.$weatherWrapper = document.querySelector('#weather-wrapper');
    this.$bookmarksOpenButton =
      document.querySelector('#bookmarks-open-button');
    this.$bookmarksCloseButton =
      document.querySelector('#bookmarks-close-button');
    this.$bookmarksUpButton = document.querySelector('#bookmarks-up-button');
    this.$bookmarksDrawerItems =
      document.querySelector('#bookmarks-drawer-items');
    this.$drawerBackdrop = document.querySelector('#drawer-backdrop');
    this.$bookmarksCtxMenu = document.querySelector('#bookmarks-ctx-menu');
    this.$bookmarksCtxMenuEdit =
      document.querySelector('#bookmarks-ctx-menu-edit');
    this.$bookmarksCtxMenuDelete =
      document.querySelector('#bookmarks-ctx-menu-delete');
    this.$bookmarksCtxMenuAddPage =
      document.querySelector('#bookmarks-ctx-menu-add-page');
    this.$bookmarksCtxMenuAddFolder =
      document.querySelector('#bookmarks-ctx-menu-add-folder');
    this.$bookmarksEditDialog =
      document.querySelector('#bookmarks-edit-dialog');
    this.$bookmarksEditDialogFavicon =
      document.querySelector('#bookmarks-edit-dialog-favicon');
    this.$bookmarksEditDialogTitle =
      document.querySelector('#bookmarks-edit-dialog-title');
    this.$bookmarksEditDialogName =
      document.querySelector('#bookmarks-edit-dialog-name');
    this.$bookmarksEditDialogURL =
      document.querySelector('#bookmarks-edit-dialog-url');
    this.$bookmarksEditDialogDone =
      document.querySelector('#bookmarks-edit-dialog .dialog-confirm');

    const STORAGE_KEY_IMAGE_DATA_URL = 'imageDataURL';

    // Disable the right click menu
    this.$root.addEventListener('contextmenu', ev => ev.preventDefault(), true);

    // Load cached image
    let backgroundImageReady = new Promise(resolve => {
      chrome.storage.local.get(
        STORAGE_KEY_IMAGE_DATA_URL,
        ({ [STORAGE_KEY_IMAGE_DATA_URL]: uri }) => resolve(uri)
      );
    })
      .then(uri => this.updateImage(uri));

    // Don't show anything until the settings and background image are ready
    Promise.all([Settings.loaded, backgroundImageReady]).then(() =>
      this.resolveBody()
    );

    // Handle changes to settings
    Settings.onChanged(Settings.keys.ALWAYS_SHOW_BOOKMARKS)
      .addListener(show => this.updateBookmarkDrawerLock(show));

    Settings.onChanged(Settings.keys.BOOKMARKS_DRAWER_SMALL)
      .addListener(small => {
        this.updateBookmarkDrawerSmall(small);
        BookmarksNavigator.updateSize(small);
      });

    Settings.onChanged(Settings.keys.BOXED_INFO)
      .addListener(boxed =>
        this.updateBoxedInfo(boxed)
      );

    Settings.onChanged(Settings.keys.SHOW_WEATHER)
      .addListener(show =>
        this.updateWeather(show)
      );

    Settings.onChanged(Settings.keys.TEMPERATURE_UNIT)
      .addListener(unit => Weather.updateTemperatureUnit(unit));

    // Update weather whenever cache changes
    Weather.onDataLoad.addListener(() => {
      let showWeather = Settings.get(Settings.keys.SHOW_WEATHER);
      this.updateWeather(showWeather);
    });

    // Fetch and cache a new image in the background
    Settings.loaded.then(() => {
      let imageResourceURI = this.DEFAULT_IMAGE_URL;

      if (Settings.get(Settings.keys.USE_TIME_OF_DAY_IMAGES)) {
        let timeOfDay = this.getImageTimeOfDay();
        if (timeOfDay) {
          imageResourceURI += `?${timeOfDay}`;
        }
      }

      chrome.runtime.getBackgroundPage(({ EventPage }) => {
        EventPage.fetchAndCacheImage(imageResourceURI,
                                     STORAGE_KEY_IMAGE_DATA_URL);
      });
    });

    // Handle bookmarks navigation
    this.$bookmarksUpButton.addEventListener('click', () =>
      BookmarksNavigator.ascend()
    );
    this.$bookmarksDrawerItems.addEventListener('x-bookmark-click', ev => {
      BookmarksNavigator.openBookmark(ev.detail.nodeId);
    }, true);

    // Handle bookmarks right click
    this.$bookmarksDrawerItems.addEventListener('x-bookmark-ctx-open', ev => {
      this.openBookmarksCtxMenu(ev.detail.x, ev.detail.y, ev.detail.nodeId);
    }, true);
    this.$bookmarksDrawerItems.addEventListener('contextmenu', ev => {
      ev.preventDefault();
      this.openBookmarksCtxMenu(ev.x, ev.y, null);
    });

    // Handle bookmark drag/drop events
    this.$bookmarksDrawerItems.addEventListener(
      'x-bookmark-drag-start',
      ev => BookmarksEditor.onBookmarkDragStart(ev),
      true
    );
    this.$bookmarksDrawerItems.addEventListener(
      'x-bookmark-drag-over',
      ev => BookmarksEditor.onBookmarkDragOver(ev),
      true
    );
    this.$bookmarksDrawerItems.addEventListener(
      'x-bookmark-drop',
      ev => BookmarksEditor.onBookmarkDrop(ev),
      true
    );
    this.$bookmarksDrawerItems.addEventListener(
      'dragover',
      ev => BookmarksEditor.onItemsDragOver(ev)
    );
    this.$bookmarksDrawerItems.addEventListener(
      'drop',
      ev => BookmarksEditor.onItemsDrop(ev)
    );
    this.$bookmarksDrawerItems.addEventListener(
      'dragleave',
      ev => BookmarksEditor.onDragLeave(ev),
      true
    );
    this.$bookmarksDrawerItems.addEventListener(
      'dragend',
      ev => BookmarksEditor.onDragEnd(ev),
      true
    );

    // Update the clock immediately, then once every second forever
    this.updateTime();
    setInterval(() => this.updateTime(), 1000);

    // Handle opening and closing the bookmarks drawer
    this.$bookmarksOpenButton.addEventListener('click', () =>
      this.openBookmarks()
    );
    this.$bookmarksCloseButton.addEventListener('click', () =>
      this.closeBookmarks()
    );
    this.$drawerBackdrop.addEventListener('click', () =>
      this.closeBookmarks()
    );

    this.$bookmarksEditDialogURL.addEventListener('change', () => {
      this.$bookmarksEditDialogURL.value =
        this.fixUrl(this.$bookmarksEditDialogURL.value);
    });
  }

  static openBookmarksCtxMenu(x, y, nodeId) {
    this.$bookmarksCtxMenu.show(x, y);

    this.$bookmarksCtxMenuAddPage.classList.remove('disabled');
    this.$bookmarksCtxMenuAddPage.onclick = () => {
      this.openBookmarksCreateDialog(false, nodeId);
    };

    this.$bookmarksCtxMenuAddFolder.classList.remove('disabled');
    this.$bookmarksCtxMenuAddFolder.onclick = () => {
      this.openBookmarksCreateDialog(true, nodeId);
    };

    if (nodeId) {
      chrome.bookmarks.get(nodeId, ([{ url }]) => {
        if (url) {
          this.$bookmarksCtxMenuAddPage.classList.add('disabled');
          this.$bookmarksCtxMenuAddPage.onclick = () => {};

          this.$bookmarksCtxMenuAddFolder.classList.add('disabled');
          this.$bookmarksCtxMenuAddFolder.onclick = () => {};
        }
      });

      this.$bookmarksCtxMenuEdit.classList.remove('disabled');
      this.$bookmarksCtxMenuEdit.onclick = () => {
        this.openBookmarksEditDialog(nodeId);
      };

      this.$bookmarksCtxMenuDelete.classList.remove('disabled');
      this.$bookmarksCtxMenuDelete.onclick = () => {
        chrome.bookmarks.getChildren(nodeId, children => {
          if (children) {
            chrome.bookmarks.removeTree(nodeId);
          } else {
            chrome.bookmarks.remove(nodeId);
          }
        });
      };
    } else {
      this.$bookmarksCtxMenuEdit.classList.add('disabled');
      this.$bookmarksCtxMenuEdit.onclick = () => {};

      this.$bookmarksCtxMenuDelete.classList.add('disabled');
      this.$bookmarksCtxMenuDelete.onclick = () => {};
    }
  }

  static openBookmarksEditDialog(nodeId) {
    this.$bookmarksEditDialog.open();

    this.$bookmarksEditDialogTitle.textContent = 'Edit';

    chrome.bookmarks.get(nodeId, ([{ title, url }]) => {
      this.$bookmarksEditDialogName.value = title || '';
      if (url) {
        this.$bookmarksEditDialogURL.hidden = false;
        this.$bookmarksEditDialogURL.value = url;
        this.$bookmarksEditDialogFavicon.src =
          `chrome://favicon/size/16@8x/${url}`;
      } else {
        this.$bookmarksEditDialogURL.hidden = true;
        this.$bookmarksEditDialogFavicon.src = '/images/folder-outline.svg';
      }
    });

    this.$bookmarksEditDialogDone.onclick = () => {
      chrome.bookmarks.update(nodeId, {
        title: this.$bookmarksEditDialogName.value,
        url: this.$bookmarksEditDialogURL.value,
      });
    };
  }

  static openBookmarksCreateDialog(isFolder, nodeId) {
    this.$bookmarksEditDialog.open();
    this.$bookmarksEditDialogTitle.textContent = isFolder ?
      'Add Folder' : 'Add Page';
    this.$bookmarksEditDialogName.value = '';
    this.$bookmarksEditDialogURL.value = '';
    this.$bookmarksEditDialogURL.hidden = isFolder;
    this.$bookmarksEditDialogFavicon.src = isFolder ?
      '/images/folder-outline.svg' : 'chrome://favicon/size/16@8x/';

    this.$bookmarksEditDialogDone.onclick = () => {
      if (!isFolder && !this.$bookmarksEditDialogURL.value) {
        return;
      }

      let create = parentId => chrome.bookmarks.create({
        parentId,
        title: this.$bookmarksEditDialogName.value,
        url: this.$bookmarksEditDialogURL.value,
      });

      if (nodeId) {
        chrome.bookmarks.get(nodeId, ([node]) => {
          if (node.url) {
            create(node.parentId);
          } else {
            create(node.id);
          }
        });
      } else {
        create(BookmarksNavigator.currentFolder);
      }

      this.$bookmarksEditDialog.close();
    };
  }

  static fixUrl(url) {
    if (url && url.search('://') === -1) {
      url = `http://${url}`;
    }

    return url;
  }

  static getImageTimeOfDay() {
    let hour = new Date().getHours();
    if (hour < 5 || 22 <= hour) {
      // 10pm - 5am
      return 'night';
    } else if (5 <= hour && hour < 10) {
      // 5am - 10am
      return 'morning';
    } else if (18 <= hour && hour < 22) {
      // 6pm - 10pm
      return 'evening';
    }
  }

  static updateImage(uri = this.DEFAULT_IMAGE_URL) {
    this.$backgroundImage.src = uri;
  }

  static updateTime() {
    let date = new Date();
    let hours = date.getHours();
    let minutes = date.getMinutes();

    let minutesStr = String(minutes);
    if (minutesStr.length < 2) {
      minutesStr = `0${minutesStr}`;
    }

    this.$time.textContent = `${hours % 12 || 12}:${minutesStr}`;

    let greeting;
    if (hours >= 0 && hours < 12) {
      greeting = 'Good Morning';
    } else if (hours >= 12 && hours < 18) {
      greeting = 'Good Afternoon';
    } else {
      greeting = 'Good Evening';
    }

    this.$greeting.textContent = greeting;
  }

  static openBookmarks() {
    this.$root.classList.add('bookmarks-drawer-open');
  }

  static closeBookmarks() {
    this.$root.classList.remove('bookmarks-drawer-open');
  }

  static updateBookmarkDrawerLock(alwaysShowBookmarks) {
    this.closeBookmarks();
    this.$root.classList.toggle('bookmarks-drawer-locked-open',
                                alwaysShowBookmarks);
  }

  static updateBookmarkDrawerSmall(drawerSmall) {
    this.$root.classList.toggle('bookmarks-drawer-small', drawerSmall);
  }

  static updateBoxedInfo(boxedInfo) {
    this.$root.classList.toggle('boxed-info', boxedInfo);
  }

  static updateWeather(showWeather) {
    if (showWeather) {
      return Weather.load().then(() => this.$weatherWrapper.hidden = false);
    } else {
      this.$weatherWrapper.hidden = true;
      return Promise.resolve();
    }
  }

  static resolveBody() {
    this.$body.removeAttribute('unresolved');
    this.$body.animate([
        { opacity: 0 },
        { opacity: 1 },
      ], {
        duration: 200,
        easing: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
      });
  }
}

NewTab.main();
