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
    this.$sourceLink = document.querySelector('#source-link');
    this.$time = document.querySelector('#time');
    this.$greeting = document.querySelector('#greeting');
    this.$weatherWrapper = document.querySelector('#weather-wrapper');
    this.$drawerBackdrop = document.querySelector('#drawer-backdrop');
    this.$bookmarksOpenButton =
      document.querySelector('#bookmarks-open-button');
    this.$bookmarksCloseButton =
      document.querySelector('#bookmarks-close-button');
    this.$bookmarksUpButton = document.querySelector('#bookmarks-up-button');
    this.$bookmarksDrawerItems =
      document.querySelector('#bookmarks-drawer-items');

    let backgroundImageReady = this.loadImage()
      .then(({ dataUrl, sourceUrl }) => this.updateImage(dataUrl, sourceUrl));
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
    this.addBookmarksTooltipListeners();
  }

  static loadImage() {
    return new Promise(resolve => {
      const KEYS = [StorageKeys.IMAGE_DATA_URL, StorageKeys.IMAGE_SOURCE_URL];
      chrome.storage.local.get(KEYS, data => {
        resolve({
          dataUrl: data[StorageKeys.IMAGE_DATA_URL],
          sourceUrl: data[StorageKeys.IMAGE_SOURCE_URL],
        });
      });
    });
  }

  static updateImage(dataUrl = this.defaultImageUrl, sourceUrl = dataUrl) {
    this.$backgroundImage.src = dataUrl;
    this.$sourceLink.href = sourceUrl;
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
    Settings.onChanged(Settings.keys.BOOKMARKS_DRAWER_MODE)
      .addListener(value => this.updateBookmarkDrawerMode(value));

    Settings.onChanged(Settings.keys.BOOKMARKS_DRAWER_SMALL)
      .addListener(value => {
        this.updateBookmarkDrawerSmall(value);
        BookmarksNavigator.updateSize(value);
      });

    Settings.onChanged(Settings.keys.SHOW_PHOTO_SOURCE)
      .addListener(value =>
        this.updateShowPhotoSource(value)
      );

    Settings.onChanged(Settings.keys.BOXED_INFO)
      .addListener(value =>
        this.updateBoxedInfo(value)
      );

    Settings.onChanged(Settings.keys.SHOW_WEATHER)
      .addListener(value =>
        this.updateWeather(value)
      );

    Settings.onChanged(Settings.keys.TEMPERATURE_UNIT)
      .addListener(value => Weather.updateTemperatureUnit(value));
  }

  static updateBookmarkDrawerMode(mode) {
    const ALWAYS = 'bookmarks-drawer-mode-always';
    const HOVER = 'bookmarks-drawer-mode-hover';
    this.closeBookmarks();
    this.$root.classList.remove(ALWAYS, HOVER);
    switch (mode) {
      case Settings.enums.BookmarkDrawerModes.ALWAYS:
        this.$root.classList.add(ALWAYS);
        break;
      case Settings.enums.BookmarkDrawerModes.HOVER:
        this.$root.classList.add(HOVER);
        break;
    }
  }

  static updateBookmarkDrawerSmall(drawerSmall) {
    this.$root.classList.toggle('bookmarks-drawer-small', drawerSmall);
  }

  static updateShowPhotoSource(show) {
    this.$root.classList.toggle('show-photo-source', show);
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
    this.$bookmarksOpenButton.addEventListener(
      'click',
      () => this.openBookmarks()
    );
    this.$bookmarksCloseButton.addEventListener(
      'click',
      () => this.closeBookmarks()
    );
    this.$drawerBackdrop.addEventListener(
      'click',
      () => this.closeBookmarks()
    );
  }

  static openBookmarks() {
    this.$root.classList.add('bookmarks-drawer-open');
  }

  static closeBookmarks() {
    this.$root.classList.remove('bookmarks-drawer-open');
  }

  static addBookmarksTooltipListeners() {
    this.$bookmarksDrawerItems.addEventListener(
      'x-bookmark-mouseover',
      ev => BookmarksNavigator.onBookmarkMouseOver(ev),
      true
    );
    this.$bookmarksDrawerItems.addEventListener(
      'x-bookmark-mouseleave',
      () => BookmarksNavigator.hideTooltip(),
      true
    );

    this.$bookmarksUpButton.addEventListener(
      'mouseover',
      () => BookmarksNavigator.onUpButtonMouseOver()
    );
    this.$bookmarksUpButton.addEventListener(
      'mouseleave',
      () => BookmarksNavigator.hideTooltip()
    );
  }
}

NewTab.main();
