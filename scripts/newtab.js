import StorageKeys from "../modules/StorageKeys.js"
import * as Surprise from "../modules/Surprise.js"
import * as Settings from "../modules/Settings.js"
import * as Weather from "../modules/Weather.js"
import * as BookmarksNavigator from "../modules/BookmarksNavigator.js"
import * as BookmarksEditor from "../modules/BookmarksEditor.js"

class NewTab {
  constructor() {
    throw new TypeError("Static class cannot be instantiated.")
  }

  static getImageUrl(search = "") {
    const screenPxWidth = window.screen.availWidth * window.devicePixelRatio
    const screenPxHeight = window.screen.availHeight * window.devicePixelRatio
    return (
      `https://source.unsplash.com/${screenPxWidth}x${screenPxHeight}/` +
      `?nature,${search}`
    )
  }

  static main() {
    this.$root = document.documentElement
    this.$body = document.body
    this.$backgroundImage = document.querySelector("#background-image")
    this.$surpriseLink = document.querySelector("#surprise-link")
    this.$unsplashLink = document.querySelector("#unsplash-link")
    this.$sourceLink = document.querySelector("#source-link")
    this.$time = document.querySelector("#time")
    this.$greeting = document.querySelector("#greeting")
    this.$weatherWrapper = document.querySelector("#weather-wrapper")
    this.$drawerBackdrop = document.querySelector("#drawer-backdrop")
    this.$bookmarksOpenButton = document.querySelector("#bookmarks-open-button")
    this.$bookmarksCloseButton = document.querySelector(
      "#bookmarks-close-button"
    )
    this.$bookmarksDrawerHeader = document.querySelector(
      "#bookmarks-drawer .drawer-header"
    )
    this.$bookmarksUpButton = document.querySelector("#bookmarks-up-button")
    this.$bookmarksDrawerItems = document.querySelector(
      "#bookmarks-drawer-items"
    )

    const backgroundImageReady = Settings.loaded
      .then(() => {
        if (Settings.get(Settings.keys.SURPRISE)) {
          return { dataUrl: Surprise.currentImageData.url }
        } else {
          return this.loadImage()
        }
      })
      .then(({ dataUrl, sourceUrl }) => this.updateImage(dataUrl, sourceUrl))

    this.fetchAndCacheImage()

    Promise.all([
      Settings.loaded,
      Weather.cacheLoaded,
      backgroundImageReady
    ]).then(() => this.resolveBody())

    this.updateTime()
    setInterval(() => this.updateTime(), 1000)

    this.disableDefaultRightClick()
    this.addSettingsChangeListeners()
    this.addWeatherChangeListeners()
    this.addGlobalDragDropListeners()
    this.addBookmarksDragDropListeners()
    this.addBookmarksClickListeners()
    this.addBookmarksDrawerListeners()
    this.addBookmarksTooltipListeners()

    if (Surprise.isTime()) {
      this.$surpriseLink.hidden = false
    }

    this.initialSurprise = false

    this.$surpriseLink.addEventListener("click", () => {
      Settings.loaded.then(() => {
        const isSurprise = !Settings.get(Settings.keys.SURPRISE)
        Settings.set(Settings.keys.SURPRISE, isSurprise)

        if (isSurprise) {
          this.updateImage(Surprise.initialImageData.url)
          this.initialSurprise = true
        } else {
          this.updateImage("")
          this.updateImage()
          this.initialSurprise = false
        }
      })
    })

    Settings.onChanged(Settings.keys.SURPRISE).addListener(surprise => {
      if (surprise) {
        this.$surpriseLink.textContent = "Let her go, Anakin"
        this.$unsplashLink.hidden = true
      } else {
        this.$surpriseLink.textContent = "A surprise, to be sure..."
        this.$unsplashLink.hidden = false
      }
    })
  }

  static loadImage() {
    return new Promise(resolve => {
      chrome.storage.local.get(
        [StorageKeys.IMAGE_DATA_URL, StorageKeys.IMAGE_SOURCE_URL],
        data => {
          resolve({
            dataUrl: data[StorageKeys.IMAGE_DATA_URL],
            sourceUrl: data[StorageKeys.IMAGE_SOURCE_URL]
          })
        }
      )
    })
  }

  static updateImage(dataUrl = this.getImageUrl(), sourceUrl = dataUrl) {
    this.$backgroundImage.src = dataUrl
    this.$sourceLink.href = sourceUrl
  }

  static fetchAndCacheImage() {
    Settings.loaded
      .then(() => {
        if (Settings.get(Settings.keys.USE_TIME_OF_DAY_IMAGES)) {
          return Weather.getSunInfoMS().then(
            ({ now, morningBegins, dayBegins, duskBegins, nightBegins }) => {
              if (nightBegins < now || now <= morningBegins) {
                return this.getImageUrl("night")
              } else if (morningBegins < now && now <= dayBegins) {
                return this.getImageUrl("morning")
              } else if (duskBegins < now && now <= nightBegins) {
                return this.getImageUrl("evening")
              } else {
                return this.getImageUrl()
              }
            }
          )
        } else {
          return this.getImageUrl()
        }
      })
      .then(imageResourceURI => {
        chrome.runtime.getBackgroundPage(({ EventPage }) => {
          EventPage.fetchAndCacheImage(imageResourceURI)
        })
      })
  }

  static resolveBody() {
    this.$body.removeAttribute("unresolved")
    this.$body.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: 200,
      easing: "cubic-bezier(0.215, 0.61, 0.355, 1)"
    })
  }

  static updateTime() {
    const date = new Date()
    const hours = date.getHours()
    const minutes = date.getMinutes()

    let minutesStr = String(minutes)
    if (minutesStr.length === 1) {
      minutesStr = `0${minutesStr}`
    }

    Settings.loaded.then(() => {
      const hoursStr = String(
        Settings.get(Settings.keys.TWENTY_FOUR_HOUR_TIME)
          ? hours
          : hours % 12 || 12
      )
      this.$time.textContent = `${hoursStr}:${minutesStr}`

      if (this.initialSurprise) {
        this.$greeting.textContent = Surprise.initialImageData.greeting
      } else if (Settings.get(Settings.keys.SURPRISE)) {
        this.$greeting.textContent = Surprise.currentImageData.greeting
      } else {
        Weather.getSunInfoMS().then(({ now, duskBegins, morningBegins }) => {
          const MIDNIGHT = 0
          const NOON = 12 * 60 * 60 * 1000

          if (MIDNIGHT < now && now <= morningBegins) {
            this.$greeting.textContent = "Hello, Night Owl"
          } else if (morningBegins < now && now <= NOON) {
            this.$greeting.textContent = "Good Morning"
          } else if (NOON < now && now <= duskBegins) {
            this.$greeting.textContent = "Good Afternoon"
          } else {
            this.$greeting.textContent = "Good Evening"
          }
        })
      }
    })
  }

  static disableDefaultRightClick() {
    this.$root.addEventListener("contextmenu", ev => ev.preventDefault(), true)
  }

  static addSettingsChangeListeners() {
    Settings.onChanged(Settings.keys.BOOKMARKS_DRAWER_MODE).addListener(value =>
      this.updateBookmarkDrawerMode(value)
    )

    Settings.onChanged(Settings.keys.BOOKMARKS_DRAWER_POSITION).addListener(
      value => this.updateBookmarkDrawerPosition(value)
    )

    Settings.onChanged(Settings.keys.BOOKMARKS_DRAWER_SMALL).addListener(
      value => {
        this.updateBookmarkDrawerSmall(value)
        BookmarksNavigator.updateSize(value)
      }
    )

    Settings.onChanged(Settings.keys.SHOW_PHOTO_SOURCE).addListener(value =>
      this.updateShowPhotoSource(value)
    )

    Settings.onChanged(Settings.keys.BOXED_INFO).addListener(value =>
      this.updateBoxedInfo(value)
    )

    Settings.onChanged(Settings.keys.SHOW_WEATHER).addListener(value =>
      this.updateWeather(value)
    )

    Settings.onChanged(Settings.keys.TEMPERATURE_UNIT).addListener(value =>
      Weather.updateTempWithUnit(value)
    )
  }

  static updateBookmarkDrawerMode(mode) {
    const TOGGLE = "bookmarks-drawer-mode-toggle"
    const HOVER = "bookmarks-drawer-mode-hover"
    const ALWAYS = "bookmarks-drawer-mode-always"
    const NEVER = "bookmarks-drawer-mode-never"
    this.closeBookmarks()
    this.$root.classList.remove(TOGGLE, HOVER, ALWAYS, NEVER)
    switch (mode) {
      case Settings.enums.BookmarkDrawerModes.TOGGLE:
        this.$root.classList.add(TOGGLE)
        break
      case Settings.enums.BookmarkDrawerModes.ALWAYS:
        this.$root.classList.add(ALWAYS)
        break
      case Settings.enums.BookmarkDrawerModes.HOVER:
        this.$root.classList.add(HOVER)
        break
      case Settings.enums.BookmarkDrawerModes.NEVER:
        this.$root.classList.add(NEVER)
        break
      default:
        console.error("Invalid bookmark drawer mode.")
    }
  }

  static updateBookmarkDrawerPosition(position) {
    const RIGHT = "bookmarks-drawer-position-right"
    const LEFT = "bookmarks-drawer-position-left"
    this.$root.classList.remove(RIGHT, LEFT)
    switch (position) {
      case Settings.enums.BookmarkDrawerPositions.RIGHT:
        this.$root.classList.add(RIGHT)
        break
      case Settings.enums.BookmarkDrawerPositions.LEFT:
        this.$root.classList.add(LEFT)
        break
      default:
        console.error("Invalid bookmark drawer position")
    }
  }

  static updateBookmarkDrawerSmall(drawerSmall) {
    this.$root.classList.toggle("bookmarks-drawer-small", drawerSmall)
  }

  static updateShowPhotoSource(show) {
    this.$root.classList.toggle("show-photo-source", show)
  }

  static updateBoxedInfo(boxedInfo) {
    this.$root.classList.toggle("boxed-info", boxedInfo)
  }

  static addWeatherChangeListeners() {
    Weather.onDataLoad.addListener(data => {
      const showWeather = data && Settings.get(Settings.keys.SHOW_WEATHER)
      this.updateWeather(showWeather)
    })
  }

  static updateWeather(showWeather) {
    if (showWeather) {
      return Weather.load().then(() => {
        this.$weatherWrapper.hidden = false
      })
    } else {
      this.$weatherWrapper.hidden = true
      return Promise.resolve()
    }
  }

  static addGlobalDragDropListeners() {
    let removeClassTimeout

    window.addEventListener("dragover", () => {
      this.$root.classList.add("dragover")

      clearTimeout(removeClassTimeout)
      removeClassTimeout = setTimeout(() => {
        this.$root.classList.remove("dragover")
      }, 100)
    })
  }

  static addBookmarksDragDropListeners() {
    this.$bookmarksDrawerItems.addEventListener(
      "x-bookmark-drag-start",
      ev => BookmarksEditor.onBookmarkDragStart(ev),
      true
    )
    this.$bookmarksDrawerItems.addEventListener(
      "x-bookmark-drag-over",
      ev => BookmarksEditor.onBookmarkDragOver(ev),
      true
    )
    this.$bookmarksDrawerItems.addEventListener(
      "x-bookmark-drop",
      ev => BookmarksEditor.onBookmarkDrop(ev),
      true
    )

    this.$bookmarksDrawerItems.addEventListener("dragover", ev =>
      BookmarksEditor.onItemsDragOver(ev)
    )
    this.$bookmarksDrawerItems.addEventListener("drop", ev =>
      BookmarksEditor.onItemsDrop(ev)
    )

    this.$bookmarksUpButton.addEventListener("dragover", ev =>
      BookmarksEditor.onUpButtonDragOver(ev)
    )
    this.$bookmarksUpButton.addEventListener("dragleave", ev =>
      BookmarksEditor.onUpButtonDragLeave(ev)
    )
    this.$bookmarksUpButton.addEventListener("drop", ev =>
      BookmarksEditor.onUpButtonDrop(ev)
    )

    this.$bookmarksDrawerItems.addEventListener(
      "dragleave",
      ev => BookmarksEditor.onDragLeave(ev),
      true
    )
    this.$bookmarksDrawerItems.addEventListener(
      "dragend",
      ev => BookmarksEditor.onDragEnd(ev),
      true
    )
  }

  static addBookmarksClickListeners() {
    this.$bookmarksUpButton.addEventListener("click", () => {
      BookmarksNavigator.ascend()
    })

    this.$bookmarksDrawerItems.addEventListener(
      "x-bookmark-click",
      ev => {
        BookmarksNavigator.openBookmark(ev.detail.nodeId)
      },
      true
    )

    this.$bookmarksDrawerHeader.addEventListener("contextmenu", ev => {
      let nodeId
      if (ev.target === this.$bookmarksUpButton) {
        nodeId = BookmarksNavigator.getParentFolder()
      } else {
        nodeId = BookmarksNavigator.getCurrentFolder()
      }

      BookmarksEditor.openCtxMenu(ev.x, ev.y, nodeId)
    })

    this.$bookmarksDrawerItems.addEventListener("contextmenu", ev => {
      if (ev.target !== this.$bookmarksDrawerItems) {
        return
      }
      BookmarksEditor.openCtxMenu(ev.x, ev.y, null)
    })

    this.$bookmarksDrawerItems.addEventListener(
      "x-bookmark-ctx-menu",
      ev => {
        BookmarksEditor.openCtxMenu(ev.detail.x, ev.detail.y, ev.target.node.id)
      },
      true
    )
  }

  static addBookmarksDrawerListeners() {
    this.$bookmarksOpenButton.addEventListener("click", () =>
      this.openBookmarks()
    )
    this.$bookmarksCloseButton.addEventListener("click", () =>
      this.closeBookmarks()
    )
    this.$drawerBackdrop.addEventListener("click", () => this.closeBookmarks())
  }

  static openBookmarks() {
    this.$root.classList.add("bookmarks-drawer-open")
  }

  static closeBookmarks() {
    this.$root.classList.remove("bookmarks-drawer-open")
  }

  static addBookmarksTooltipListeners() {
    this.$bookmarksDrawerItems.addEventListener(
      "x-bookmark-mouseover",
      ev => BookmarksNavigator.onBookmarkMouseOver(ev),
      true
    )
    this.$bookmarksDrawerItems.addEventListener(
      "x-bookmark-mouseleave",
      () => BookmarksNavigator.hideTooltip(),
      true
    )

    this.$bookmarksDrawerHeader.addEventListener("mouseover", () =>
      BookmarksNavigator.onHeaderMouseOver()
    )
    this.$bookmarksDrawerHeader.addEventListener("mouseleave", () =>
      BookmarksNavigator.hideTooltip()
    )
  }
}

NewTab.main()
