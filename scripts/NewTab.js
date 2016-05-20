/* globals Bookmarks, Settings, Weather */
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
    this.$bookmarksEditDialog =
      document.querySelector('#bookmarks-edit-dialog');
    this.$bookmarksEditDialogFavicon =
      document.querySelector('#bookmarks-edit-dialog-favicon');
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
        Bookmarks.updateSize(small);
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
      Bookmarks.ascend()
    );
    this.$bookmarksDrawerItems.addEventListener('x-bookmark-click', ev => {
      Bookmarks.openBookmark(ev.detail.nodeId);
    }, true);

    // Handle bookmarks right click
    this.$bookmarksDrawerItems.addEventListener('x-bookmark-ctx-open', ev => {
      this.openBookmarksCtxMenu(ev.detail.x, ev.detail.y, ev.detail.nodeId);
    }, true);

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

    this.$bookmarksCtxMenuEdit.onclick = () => {
      this.openBookmarksEditDialog(nodeId);
    };

    this.$bookmarksCtxMenuDelete.onclick = () => {
      chrome.bookmarks.getChildren(nodeId, children => {
        if (children) {
          chrome.bookmarks.removeTree(nodeId);
        } else {
          chrome.bookmarks.remove(nodeId);
        }
      });
    };
  }

  static openBookmarksEditDialog(nodeId) {
    this.$bookmarksEditDialog.open();

    chrome.bookmarks.get(nodeId, ([node]) => {
      this.$bookmarksEditDialogName.value = node.title || '';
      if (node.url) {
        this.$bookmarksEditDialogURL.hidden = false;
        this.$bookmarksEditDialogURL.value = node.url;
        this.$bookmarksEditDialogFavicon.src =
          `chrome://favicon/size/16@8x/${node.url}`;
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
      this.$bookmarksEditDialog.close();
    };
  }

  static fixUrl(url) {
    if (url.search('://') === -1) {
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
