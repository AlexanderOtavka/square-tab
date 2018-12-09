import { BehaviorSubject } from "rxjs"
import { distinctUntilChanged, map } from "rxjs/operators"

import * as Surprise from "./Surprise"

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

const subjects = {}
storageKeysArray.forEach(storageKey => {
  subjects[storageKey] = new BehaviorSubject({
    value: undefined,
    overrides: []
  })
})

Object.keys(overrides)
  .filter(name => storageKeysArray.includes(name))
  .forEach(storageKey => {
    if (storageKey in overrides) {
      onChanged(storageKey).subscribe(overrides[storageKey])
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
  const valueMapper = createValueMapper(storageKey)
  return valueMapper(subjects[storageKey].getValue())
}

export function getData(storageKey) {
  const dataMapper = createDataMapper(storageKey)
  return dataMapper(subjects[storageKey].getValue())
}

export function set(storageKey, value) {
  console.assert(storageKeysArray.indexOf(storageKey) !== -1)
  chrome.storage.sync.set({ [storageKey]: value })
}

export function onChanged(storageKey) {
  return subjects[storageKey].pipe(
    map(createValueMapper(storageKey)),
    distinctUntilChanged()
  )
}

export function onDataChanged(storageKey) {
  return subjects[storageKey].pipe(
    map(createDataMapper(storageKey)),
    distinctUntilChanged(
      (a, b) =>
        a.value === b.value && !arraysShallowEqual(a.overrides, b.overrides)
    )
  )
}

function createDataMapper(storageKey) {
  return ({ value = defaults[storageKey], overrides }) => ({
    value,
    overrides,
    activeOverride: getActiveOverride(overrides)
  })
}

function createValueMapper(storageKey) {
  return ({ value = defaults[storageKey], overrides }) =>
    hasActiveOverride(overrides) ? getActiveOverride(overrides) : value
}

function getActiveOverride(overrides) {
  return overrides.find(ovr => ovr !== undefined)
}

function hasActiveOverride(overrides) {
  return overrides.some(x => x !== undefined)
}

function setValue(storageKey, newValue) {
  subjects[storageKey].next({
    ...subjects[storageKey].getValue(),
    value: newValue
  })
}

function setOverride(storageKey, priority, newOverride) {
  const oldData = subjects[storageKey].getValue()
  subjects[storageKey].next({
    ...oldData,
    overrides: oldData.overrides.map((oldOverride, i) =>
      i === priority ? newOverride : oldOverride
    )
  })
}

function unsetOverride(storageKey, priority) {
  setOverride(storageKey, priority, undefined)
}

function arraysShallowEqual(a, b) {
  const len = Math.max(a.length, b.length)
  for (let i = 0; i < len; i++) {
    if (a[i] !== b[i]) {
      return true
    }
  }

  return false
}
