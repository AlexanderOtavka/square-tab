/* globals BookmarksNavigator, BookmarksEditor, Settings, Weather,
           StorageKeys */
'use strict';

class NewTab {
  constructor() {
    throw new TypeError('Static class cannot be instantiated.');
  }

  static get defaultImageUrl() {
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
    this.$sourceLink = document.querySelector('#source-link');

    let backgroundImageReady = this.loadImage()
      .then(uri => this.updateImage(uri));
    Settings.loaded.then(() => this.fetchAndCacheImage());

    Promise.all([Settings.loaded, backgroundImageReady]).then(() =>
      this.resolveBody()
    );

    this.updateTime();
    setInterval(() => this.updateTime(), 1000);

    this.disableDefaultRightClick();
    this.addSettingsChangeListeners();
    this.addWeatherChangeListeners();
    this.addBookmarksDragDropListeners();
    this.addBookmarksNavigationListeners();
    this.addBookmarksRightClickListeners();
    this.addBookmarksDrawerListeners();
  }

  static loadImage() {
    return new Promise(resolve => {
      chrome.storage.local.get(
        StorageKeys.IMAGE_DATA_URL,
        ({ [StorageKeys.IMAGE_DATA_URL]: uri }) => resolve(uri)
      );
    });
  }

  static updateImage(uri = this.defaultImageUrl) {
    this.$backgroundImage.src = uri;
    this.$sourceLink.href = uri;
  }

  static fetchAndCacheImage() {
    let imageResourceURI = this.defaultImageUrl;

    if (Settings.get(Settings.keys.USE_TIME_OF_DAY_IMAGES)) {
      let timeOfDay = this.getImageTimeOfDay();
      if (timeOfDay) {
        imageResourceURI += `?${timeOfDay}`;
      }
    }

    chrome.runtime.getBackgroundPage(({ EventPage }) => {
      EventPage.fetchAndCacheImage(imageResourceURI);
    });
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

  static disableDefaultRightClick() {
    this.$root.addEventListener('contextmenu', ev => ev.preventDefault(), true);
  }

  static addSettingsChangeListeners() {
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

  static addWeatherChangeListeners() {
    Weather.onDataLoad.addListener(() => {
      let showWeather = Settings.get(Settings.keys.SHOW_WEATHER);
      this.updateWeather(showWeather);
    });
  }

  static updateWeather(showWeather) {
    if (showWeather) {
      return Weather.load().then(() => this.$weatherWrapper.hidden = false);
    } else {
      this.$weatherWrapper.hidden = true;
      return Promise.resolve();
    }
  }

  static addBookmarksDragDropListeners() {
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

    this.$bookmarksUpButton.addEventListener(
      'dragover',
      ev => BookmarksEditor.onUpButtonDragOver(ev)
    );
    this.$bookmarksUpButton.addEventListener(
      'dragleave',
      ev => BookmarksEditor.onUpButtonDragLeave(ev)
    );
    this.$bookmarksUpButton.addEventListener(
      'drop',
      ev => BookmarksEditor.onUpButtonDrop(ev)
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
  }

  static addBookmarksNavigationListeners() {
    this.$bookmarksUpButton.addEventListener('click', () =>
      BookmarksNavigator.ascend()
    );
    this.$bookmarksDrawerItems.addEventListener('x-bookmark-click', ev => {
      BookmarksNavigator.openBookmark(ev.detail.nodeId);
    }, true);
  }

  static addBookmarksRightClickListeners() {
    this.$bookmarksDrawerItems.addEventListener('x-bookmark-ctx-open', ev => {
      BookmarksEditor.openCtxMenu(ev.detail.x, ev.detail.y, ev.detail.nodeId);
    }, true);
    this.$bookmarksDrawerItems.addEventListener('contextmenu', ev => {
      ev.preventDefault();
      BookmarksEditor.openCtxMenu(ev.x, ev.y, null);
    });
  }

  static addBookmarksDrawerListeners() {
    this.$bookmarksOpenButton.addEventListener('click', () =>
      this.openBookmarks()
    );
    this.$bookmarksCloseButton.addEventListener('click', () =>
      this.closeBookmarks()
    );
    this.$drawerBackdrop.addEventListener('click', () =>
      this.closeBookmarks()
    );
  }

  static openBookmarks() {
    this.$root.classList.add('bookmarks-drawer-open');
  }

  static closeBookmarks() {
    this.$root.classList.remove('bookmarks-drawer-open');
  }
}

NewTab.main();
