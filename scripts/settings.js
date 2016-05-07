(function (app) {
'use strict';

let keys = {
  ALWAYS_SHOW_BOOKMARKS: 'alwaysShowBookmarks',
};

let _defaults = {
  [keys.ALWAYS_SHOW_BOOKMARKS]: false,
};

let _storageKeysArray = Object.keys(keys).map(keyName => keys[keyName]);

let _data = {};
_storageKeysArray.forEach(storageKey => {
  _data[storageKey] = {
    value: null,
    listeners: [],
  };
});

let loaded = new Promise(resolve => {
  chrome.storage.sync.get(_storageKeysArray, data => {
    let defaults = Object.assign({}, _defaults);
    resolve(Object.assign(defaults, data));
  });
});

loaded.then(data => {
  _storageKeysArray.forEach(storageKey => {
    updateData(storageKey, data[storageKey], null);
  });
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync') {
    Object.keys(changes).forEach(storageKey => {
      let change = changes[storageKey];
      updateData(storageKey, change.newValue, change.oldValue);
    });
  }
});

let settings = {
  keys,
  loaded,

  get(storageKey) {
    return _data[storageKey].value;
  },

  set(storageKey, value) {
    chrome.storage.sync.set({ [storageKey]: value });
  },

  addChangeListener(storageKey, callback) {
    _data[storageKey].listeners.push(callback);
  },
};

window.$$$data = _data;

function updateData(storageKey, newValue, oldValue) {
  _data[storageKey].value = newValue;
  _data[storageKey].listeners.forEach(listener => {
    listener(newValue, oldValue);
  });
}

app.settings = settings;

})(window.app = window.app || {});
