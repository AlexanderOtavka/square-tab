

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
      BookmarkDrawerModes: {
        TOGGLE: 'toggle',
        HOVER: 'hover',
        ALWAYS: 'always',
        NEVER: 'never',
      },
    };
  }

  static get keys() {
    return {
      BOOKMARKS_DRAWER_MODE: 'bookmarkDrawerMode',
      BOOKMARKS_DRAWER_SMALL: 'bookmarksDrawerSmall',
      SHOW_PHOTO_SOURCE: 'showPhotoSource',
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
      [this.keys.BOOKMARKS_DRAWER_MODE]: this.enums.BookmarkDrawerModes.TOGGLE,
      [this.keys.BOOKMARKS_DRAWER_SMALL]: true,
      [this.keys.SHOW_PHOTO_SOURCE]: true,
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
      startup: chromeVersion => {},

      [this.keys.BOOKMARKS_DRAWER_MODE]: value => {
        if (value === this.enums.BookmarkDrawerModes.TOGGLE ||
            value === this.enums.BookmarkDrawerModes.NEVER)
          this._setOverride(this.keys.BOOKMARKS_DRAWER_SMALL, 0, false);
        else
          this._unsetOverride(this.keys.BOOKMARKS_DRAWER_SMALL, 0);
      },

      [this.keys.SHOW_WEATHER]: value => {
        if (!value)
          this._setOverride(this.keys.TEMPERATURE_UNIT, 0, null);
        else
          this._unsetOverride(this.keys.TEMPERATURE_UNIT, 0);
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
        overrides: [],
        basicListener: new chrome.Event(),
        dataListener: new chrome.Event(),
      };

      if (storageKey in this._overrides)
        this.onChanged(storageKey).addListener(this._overrides[storageKey]);
    });

    this.loaded = new Promise(resolve => {
      chrome.storage.sync.get(this._storageKeysArray, data => resolve(data));
    })
      .then(data => {
        this._storageKeysArray.forEach(storageKey => {
          this._setValue(storageKey, data[storageKey], true);
        });

        const chromeVersion =
          Number(navigator.userAgent.match(/Chrom(?:e|ium)\/([0-9]+)/)[1]);
        this._overrides.startup(chromeVersion);
      });

    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'sync')
        Object.keys(changes).forEach(storageKey => {
          this._setValue(storageKey, changes[storageKey].newValue);
        });
    });
  }

  static get(storageKey) {
    console.assert(this._storageKeysArray.indexOf(storageKey) !== -1);
    const override = this._getActiveOverride(storageKey);
    if (override !== undefined)
      return override;
    else if (this._data[storageKey].value !== undefined)
      return this._data[storageKey].value;
    else
      return this._defaults[storageKey];
  }

  static getData(storageKey) {
    console.assert(this._storageKeysArray.indexOf(storageKey) !== -1);
    const d = this._data[storageKey];
    let value = d.value;
    if (value === undefined)
      value = this._defaults[storageKey];


    const activeOverride = this._getActiveOverride(storageKey);

    return {value, overrides: d.overrides.slice(), activeOverride};
  }

  static set(storageKey, value) {
    console.assert(this._storageKeysArray.indexOf(storageKey) !== -1);
    chrome.storage.sync.set({[storageKey]: value});
  }

  static onChanged(storageKey) {
    console.assert(this._storageKeysArray.indexOf(storageKey) !== -1);
    return this._data[storageKey].basicListener;
  }

  static onDataChanged(storageKey) {
    console.assert(this._storageKeysArray.indexOf(storageKey) !== -1);
    return this._data[storageKey].dataListener;
  }

  static _getActiveOverride(storageKey) {
    return this._data[storageKey].overrides.find(ovr => ovr !== undefined);
  }

  static _setValue(storageKey, newValue, forceNotify = false) {
    const PROP_NAME = 'value';
    this._setDataProperty(storageKey, PROP_NAME, newValue, forceNotify);
  }

  static _setOverride(storageKey, priority, newOverride, forceNotify = false) {
    const PROP_NAME = 'overrides';
    const overrides = this._data[storageKey].overrides.slice();
    overrides[priority] = newOverride;
    this._setDataProperty(storageKey, PROP_NAME, overrides, forceNotify);
  }

  static _unsetOverride(storageKey, priority) {
    this._setOverride(storageKey, priority, undefined);
  }

  static _setDataProperty(storageKey, property, value, forceNotify) {
    let oldData;
    let oldOverriddenValue;
    if (forceNotify) {
      oldData = {value: undefined, overrides: []};
      oldOverriddenValue = undefined;
    } else {
      oldData = this.getData(storageKey);
      oldOverriddenValue = this.get(storageKey);
    }

    const dataItem = this._data[storageKey];
    dataItem[property] = value;

    const newData = this.getData(storageKey);
    if (newData.value !== oldData.value ||
        this._overridesChanged(newData, oldData))
      dataItem.dataListener.dispatch(newData, oldData);


    const newOverriddenValue = this.get(storageKey);
    if (newOverriddenValue !== oldOverriddenValue)
      dataItem.basicListener.dispatch(newOverriddenValue, oldOverriddenValue);
  }

  static _overridesChanged(newData, oldData) {
    const len = Math.max(newData.overrides.length, oldData.overrides.length);
    for (let i = 0; i < len; i++)
      if (newData.overrides[i] !== oldData.overrides[i])
        return true;


    return false;
  }
}

Settings.main();

window.Settings = Settings;
