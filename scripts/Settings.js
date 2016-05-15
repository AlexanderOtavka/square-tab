'use strict';

class Settings {
  constructor() {
    throw new TypeError('Static class cannot be instantiated.');
  }

  static get enums() {
    return {
      TemperatureUnits: {
        CELCIUS: 'c',
        FAHRENHEIT: 'f',
      },
    };
  }

  static get keys() {
    return {
      ALWAYS_SHOW_BOOKMARKS: 'alwaysShowBookmarks',
      BOOKMARKS_DRAWER_SMALL: 'bookmarksDrawerSmall',
      BOXED_INFO: 'boxedInfo',
      SHOW_WEATHER: 'showWeather',
      TEMPERATURE_UNIT: 'temperatureUnit',
      USE_TIME_OF_DAY_IMAGES: 'useTimeOfDayImages',
    };
  }

  /**
   * The default values of each setting if they are not saved in storage.
   */
  static get _defaults() {
    return {
      [this.keys.ALWAYS_SHOW_BOOKMARKS]: false,
      [this.keys.BOOKMARKS_DRAWER_SMALL]: true,
      [this.keys.BOXED_INFO]: true,
      [this.keys.SHOW_WEATHER]: true,
      [this.keys.TEMPERATURE_UNIT]: this.enums.TemperatureUnits.FAHRENHEIT,
      [this.keys.USE_TIME_OF_DAY_IMAGES]: false,
    };
  }

  /**
   * Listeners attached to particular settings that set or unset overrides.
   */
  static get _overrides() {
    return {
      [this.keys.ALWAYS_SHOW_BOOKMARKS]: value => {
        if (!value) {
          this._setOverride(this.keys.BOOKMARKS_DRAWER_SMALL, false);
        } else {
          this._unsetOverride(this.keys.BOOKMARKS_DRAWER_SMALL);
        }
      },

      [this.keys.SHOW_WEATHER]: value => {
        if (!value) {
          this._setOverride(this.keys.TEMPERATURE_UNIT, null);
        } else {
          this._unsetOverride(this.keys.TEMPERATURE_UNIT);
        }
      },
    };
  }

  static main() {
    this._storageKeysArray = Object.keys(this.keys).map(keyName =>
      this.keys[keyName]
    );

    this._data = {};
    this._storageKeysArray.forEach(storageKey => {
      this._data[storageKey] = {
        value: undefined,
        override: undefined,
        basicListener: new chrome.Event(),
        dataListener: new chrome.Event(),
      };

      if (storageKey in this._overrides) {
        this.onChanged(storageKey).addListener(this._overrides[storageKey]);
      }
    });

    this.loaded = new Promise(resolve => {
      chrome.storage.sync.get(this._storageKeysArray, data => resolve(data));
    })
      .then(data => {
        this._storageKeysArray.forEach(storageKey => {
          this._setValue(storageKey, data[storageKey], true);
        });
      });

    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'sync') {
        Object.keys(changes).forEach(storageKey => {
          this._setValue(storageKey, changes[storageKey].newValue);
        });
      }
    });
  }

  static get(storageKey) {
    console.assert(this._storageKeysArray.indexOf(storageKey) !== -1);
    if (this._data[storageKey].override !== undefined) {
      return this._data[storageKey].override;
    } else if (this._data[storageKey].value !== undefined) {
      return this._data[storageKey].value;
    } else {
      return this._defaults[storageKey];
    }
  }

  static getData(storageKey) {
    console.assert(this._storageKeysArray.indexOf(storageKey) !== -1);
    let d = this._data[storageKey];
    let value = d.value;
    if (value === undefined) {
      value = this._defaults[storageKey];
    }

    return { value, override: d.override };
  }

  static set(storageKey, value) {
    console.assert(this._storageKeysArray.indexOf(storageKey) !== -1);
    chrome.storage.sync.set({ [storageKey]: value });
  }

  static onChanged(storageKey) {
    console.assert(this._storageKeysArray.indexOf(storageKey) !== -1);
    return this._data[storageKey].basicListener;
  }

  static onDataChanged(storageKey) {
    console.assert(this._storageKeysArray.indexOf(storageKey) !== -1);
    return this._data[storageKey].dataListener;
  }

  static _setValue(storageKey, newValue, forceNotify = false) {
    const PROP_NAME = 'value';
    this._setDataProperty(storageKey, PROP_NAME, newValue, forceNotify);
  }

  static _setOverride(storageKey, newOverride, forceNotify = false) {
    const PROP_NAME = 'override';
    this._setDataProperty(storageKey, PROP_NAME, newOverride, forceNotify);
  }

  static _unsetOverride(storageKey) {
    this._setOverride(storageKey, undefined);
  }

  static _setDataProperty(storageKey, property, value, forceNotify) {
    let oldData;
    let oldOverriddenValue;
    if (!forceNotify) {
      oldData = this.getData(storageKey);
      oldOverriddenValue = this.get(storageKey);
    } else {
      oldData = { value: undefined, override: undefined };
      oldOverriddenValue = undefined;
    }

    let dataItem = this._data[storageKey];
    dataItem[property] = value;

    let newData = this.getData(storageKey);
    if (newData.value !== oldData.value ||
        newData.override !== oldData.override) {
      dataItem.dataListener.dispatch(newData, oldData);
    }

    let newOverriddenValue = this.get(storageKey);
    if (newOverriddenValue !== oldOverriddenValue) {
      dataItem.basicListener.dispatch(newOverriddenValue, oldOverriddenValue);
    }
  }
}

Settings.main();

window.Settings = Settings;
