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
    this.$bookmarksOpenButton =
      document.querySelector('#bookmarks-open-button');
    this.$bookmarksCloseButton =
      document.querySelector('#bookmarks-close-button');
    this.$bookmarksUpButton = document.querySelector('#bookmarks-up-button');
    this.$bookmarksDrawerItems =
      document.querySelector('#bookmarks-drawer-items');
    this.$drawerBackdrop = document.querySelector('#drawer-backdrop');
    this.$weatherWrapper = document.querySelector('#weather-wrapper');

    const STORAGE_KEY_IMAGE_DATA_URL = 'imageDataURL';

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

      chrome.runtime.getBackgroundPage(eventPage => {
        eventPage.fetchAndCacheImage(imageResourceURI,
                                     STORAGE_KEY_IMAGE_DATA_URL);
      });
    });

    // Handle bookmarks navigation
    this.$bookmarksUpButton.addEventListener('click', () =>
      Bookmarks.ascend()
    );
    this.$bookmarksDrawerItems.addEventListener('bookmark-clicked', ev => {
      Bookmarks.openNode(ev.detail.node);
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
