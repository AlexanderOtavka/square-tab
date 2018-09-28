import * as Surprise from "./Surprise.js"

export const enums = {
  TemperatureUnits: {
    CELSIUS: "c",
    FAHRENHEIT: "f"
  },
  BookmarkDrawerModes: {
    TOGGLE: "toggle",
    HOVER: "hover",
    ALWAYS: "always",
    NEVER: "never"
  },
  BookmarkDrawerPositions: {
    RIGHT: "right",
    LEFT: "left"
  }
}

export const keys = {
  BOOKMARKS_DRAWER_MODE: "bookmarkDrawerMode",
  BOOKMARKS_DRAWER_POSITION: "bookmarkDrawerPosition",
  BOOKMARKS_DRAWER_SMALL: "bookmarksDrawerSmall",
  SHOW_PHOTO_SOURCE: "showPhotoSource",
  BOXED_INFO: "boxedInfo",
  TWENTY_FOUR_HOUR_TIME: "24hourTime",
  SHOW_WEATHER: "showWeather",
  TEMPERATURE_UNIT: "temperatureUnit",
  USE_TIME_OF_DAY_IMAGES: "useTimeOfDayImages",
  SURPRISE: "surprise"
}

/** The default values of each setting if they are not saved in storage. */
const defaults = {
  [keys.BOOKMARKS_DRAWER_MODE]: enums.BookmarkDrawerModes.TOGGLE,
  [keys.BOOKMARKS_DRAWER_POSITION]: enums.BookmarkDrawerPositions.RIGHT,
  [keys.BOOKMARKS_DRAWER_SMALL]: true,
  [keys.SHOW_PHOTO_SOURCE]: true,
  [keys.BOXED_INFO]: true,
  [keys.TWENTY_FOUR_HOUR_TIME]: false,
  [keys.SHOW_WEATHER]: true,
  [keys.TEMPERATURE_UNIT]: enums.TemperatureUnits.FAHRENHEIT,
  [keys.USE_TIME_OF_DAY_IMAGES]: false,
  [keys.SURPRISE]: false
}

/** Listeners attached to particular settings that set or unset overrides. */
const overrides = {
  startup: chromeVersion => {
    if (!Surprise.isTime()) {
      setOverride(keys.SURPRISE, 0, false)
    } else {
      unsetOverride(keys.SURPRISE, 0)
    }
  },

  [keys.BOOKMARKS_DRAWER_MODE]: value => {
    if (
      value === enums.BookmarkDrawerModes.TOGGLE ||
      value === enums.BookmarkDrawerModes.NEVER
    ) {
      setOverride(keys.BOOKMARKS_DRAWER_SMALL, 0, false)
    } else {
      unsetOverride(keys.BOOKMARKS_DRAWER_SMALL, 0)
    }
  },

  [keys.SHOW_WEATHER]: value => {
    if (!value) {
      setOverride(keys.TEMPERATURE_UNIT, 0, null)
    } else {
      unsetOverride(keys.TEMPERATURE_UNIT, 0)
    }
  }
}

const storageKeysArray = Object.keys(keys).map(keyName => keys[keyName])

const data = {}
storageKeysArray.forEach(storageKey => {
  data[storageKey] = {
    value: undefined,
    overrides: [],
    basicListener: new chrome.Event(),
    dataListener: new chrome.Event()
  }

  if (storageKey in overrides) {
    onChanged(storageKey).addListener(overrides[storageKey])
  }
})

export const loaded = new Promise(resolve => {
  chrome.storage.sync.get(storageKeysArray, data => resolve(data))
}).then(data => {
  storageKeysArray.forEach(storageKey => {
    setValue(storageKey, data[storageKey], true)
  })

  const chromeVersion = Number(
    navigator.userAgent.match(/Chrom(?:e|ium)\/([0-9]+)/)[1]
  )
  overrides.startup(chromeVersion)
})

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync") {
    Object.keys(changes).forEach(storageKey => {
      setValue(storageKey, changes[storageKey].newValue)
    })
  }
})

export function get(storageKey) {
  console.assert(storageKeysArray.indexOf(storageKey) !== -1)
  const override = getActiveOverride(storageKey)
  if (override !== undefined) {
    return override
  } else if (data[storageKey].value !== undefined) {
    return data[storageKey].value
  } else {
    return defaults[storageKey]
  }
}

export function getData(storageKey) {
  console.assert(storageKeysArray.indexOf(storageKey) !== -1)
  const d = data[storageKey]
  let value = d.value
  if (value === undefined) {
    value = defaults[storageKey]
  }

  const activeOverride = getActiveOverride(storageKey)

  return { value, overrides: d.overrides.slice(), activeOverride }
}

export function set(storageKey, value) {
  console.assert(storageKeysArray.indexOf(storageKey) !== -1)
  chrome.storage.sync.set({ [storageKey]: value })
}

export function onChanged(storageKey) {
  console.assert(storageKeysArray.indexOf(storageKey) !== -1)
  return data[storageKey].basicListener
}

export function onDataChanged(storageKey) {
  console.assert(storageKeysArray.indexOf(storageKey) !== -1)
  return data[storageKey].dataListener
}

function getActiveOverride(storageKey) {
  return data[storageKey].overrides.find(ovr => ovr !== undefined)
}

function setValue(storageKey, newValue, forceNotify = false) {
  const PROP_NAME = "value"
  setDataProperty(storageKey, PROP_NAME, newValue, forceNotify)
}

function setOverride(storageKey, priority, newOverride, forceNotify = false) {
  const PROP_NAME = "overrides"
  const overrides = data[storageKey].overrides.slice()
  overrides[priority] = newOverride
  setDataProperty(storageKey, PROP_NAME, overrides, forceNotify)
}

function unsetOverride(storageKey, priority) {
  setOverride(storageKey, priority, undefined)
}

function setDataProperty(storageKey, property, value, forceNotify) {
  let oldData
  let oldOverriddenValue
  if (forceNotify) {
    oldData = { value: undefined, overrides: [] }
    oldOverriddenValue = undefined
  } else {
    oldData = getData(storageKey)
    oldOverriddenValue = get(storageKey)
  }

  const dataItem = data[storageKey]
  dataItem[property] = value

  const newData = getData(storageKey)
  if (newData.value !== oldData.value || overridesChanged(newData, oldData)) {
    dataItem.dataListener.dispatch(newData, oldData)
  }

  const newOverriddenValue = get(storageKey)
  if (newOverriddenValue !== oldOverriddenValue) {
    dataItem.basicListener.dispatch(newOverriddenValue, oldOverriddenValue)
  }
}

function overridesChanged(newData, oldData) {
  const len = Math.max(newData.overrides.length, oldData.overrides.length)
  for (let i = 0; i < len; i++) {
    if (newData.overrides[i] !== oldData.overrides[i]) {
      return true
    }
  }

  return false
}
