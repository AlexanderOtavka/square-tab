/* globals BookmarksNavigator, BookmarksEditor, Settings, Weather,
           StorageKeys, XBookmarkElement */

class NewTab {
  constructor() {
    throw new TypeError('Static class cannot be instantiated.');
  }

  static get defaultImageUrl() {
    const screenPxWidth = window.screen.availWidth * window.devicePixelRatio;
    const screenPxHeight = window.screen.availHeight * window.devicePixelRatio;
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
    this.$bookmarksDrawerHeader =
      document.querySelector('#bookmarks-drawer .drawer-header');
    this.$bookmarksUpButton = document.querySelector('#bookmarks-up-button');
    this.$bookmarksDrawerItems =
      document.querySelector('#bookmarks-drawer-items');

    const backgroundImageReady = this.loadImage()
      .then(({dataUrl, sourceUrl}) => this.updateImage(dataUrl, sourceUrl));
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
    this.addBookmarksClickListeners();
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
      const {
        now,
        morningBegins,
        dayBegins,
        duskBegins,
        nightBegins,
      } = Weather.getSunInfoMS();

      if (nightBegins < now || now <= morningBegins)
        imageResourceURI += '?night';
      else if (morningBegins < now && now <= dayBegins)
        imageResourceURI += '?morning';
      else if (duskBegins < now && now <= nightBegins)
        imageResourceURI += '?evening';
    }

    chrome.runtime.getBackgroundPage(({EventPage}) => {
      EventPage.fetchAndCacheImage(imageResourceURI);
    });
  }

  static resolveBody() {
    this.$body.removeAttribute('unresolved');
    this.$body.animate([
      {opacity: 0},
      {opacity: 1},
    ], {
      duration: 200,
      easing: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
    });
  }

  static updateTime() {
    const date = new Date();
    const hours = date.getHours() % 12 || 12;
    const minutes = date.getMinutes();

    let minutesStr = String(minutes);
    if (minutesStr.length === 1)
      minutesStr = `0${minutesStr}`;

    this.$time.textContent = `${hours}:${minutesStr}`;

    const MIDNIGHT = 0;
    const NOON = 12 * 60 * 60 * 1000;
    const {now, sunset} = Weather.getSunInfoMS();

    let greeting;
    if (MIDNIGHT < now && now <= NOON)
      greeting = 'Good Morning';
    else if (NOON < now && now <= sunset)
      greeting = 'Good Afternoon';
    else
      greeting = 'Good Evening';

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
      .addListener(value => Weather.updateTempWithUnit(value));
  }

  static updateBookmarkDrawerMode(mode) {
    const TOGGLE = 'bookmarks-drawer-mode-toggle';
    const HOVER = 'bookmarks-drawer-mode-hover';
    const ALWAYS = 'bookmarks-drawer-mode-always';
    const NEVER = 'bookmarks-drawer-mode-never';
    this.closeBookmarks();
    this.$root.classList.remove(TOGGLE, HOVER, ALWAYS, NEVER);
    switch (mode) {
      case Settings.enums.BookmarkDrawerModes.TOGGLE:
        this.$root.classList.add(TOGGLE);
        break;
      case Settings.enums.BookmarkDrawerModes.ALWAYS:
        this.$root.classList.add(ALWAYS);
        break;
      case Settings.enums.BookmarkDrawerModes.HOVER:
        this.$root.classList.add(HOVER);
        break;
      case Settings.enums.BookmarkDrawerModes.NEVER:
        this.$root.classList.add(NEVER);
        break;
      default:
        console.error('Invalid bookmark drawer mode.');
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
    Weather.onDataLoad.addListener(data => {
      const showWeather = data && Settings.get(Settings.keys.SHOW_WEATHER);
      this.updateWeather(showWeather);
    });
  }

  static updateWeather(showWeather) {
    if (showWeather) {
      return Weather.load().then(() => {
        this.$weatherWrapper.hidden = false;
      });
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

  static addBookmarksClickListeners() {
    this.$bookmarksUpButton.addEventListener('click', () =>
      BookmarksNavigator.ascend()
    );
    this.$bookmarksDrawerItems.addEventListener('x-bookmark-click', ev => {
      BookmarksNavigator.openBookmark(ev.detail.nodeId);
    }, true);

    this.$bookmarksDrawerItems.addEventListener('contextmenu', ev => {
      BookmarksEditor.openCtxMenu(
        ev.x, ev.y,
        (ev.target instanceof XBookmarkElement) ? ev.target.node.id : null
      );
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

    this.$bookmarksDrawerHeader.addEventListener(
      'mouseover',
      () => BookmarksNavigator.onHeaderMouseOver()
    );
    this.$bookmarksDrawerHeader.addEventListener(
      'mouseleave',
      () => BookmarksNavigator.hideTooltip()
    );
  }
}

NewTab.main();
