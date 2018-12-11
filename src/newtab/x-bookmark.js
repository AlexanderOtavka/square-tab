import html from "../util/html"
import folderOutlineUri from "./folder-outline.svg"

function addEventListeners(object, listeners) {
  for (const eventName of Object.keys(listeners)) {
    object.addEventListener(eventName, listeners[eventName])
  }
}

function removeEventListeners(object, listeners) {
  for (const eventName of Object.keys(listeners)) {
    object.removeEventListener(eventName, listeners[eventName])
  }
}

export default class XBookmarkElement extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: "open" }).appendChild(html`
      <link rel="stylesheet" href="/public/styles/shared-styles.css" />
      <link rel="stylesheet" href="/public/styles/x-bookmark.css" />

      <a id="link">
        <img id="image" />
        <div id="name"></div>
      </a>
    `)

    this.$link = this.shadowRoot.querySelector("#link")
    this.$image = this.shadowRoot.querySelector("#image")
    this.$name = this.shadowRoot.querySelector("#name")

    this._node = null
    this._eventListeners = {
      click: () => this.onClick(),
      contextmenu: ev => this.onCtxMenu(ev),
      dragstart: ev => this.onDragStart(ev),
      dragover: ev => this.onDragOver(ev),
      dragenter: ev => this.onDragOver(ev),
      dragleave: ev => this.onDragLeave(ev),
      dragend: ev => this.onDragEnd(ev),
      drop: ev => this.onDrop(ev),
      mouseover: ev => this.onMouseOver(ev),
      mouseleave: ev => this.onMouseLeave(ev)
    }
  }

  connectedCallback() {
    this.setAttribute("draggable", "true")
    addEventListeners(this, this._eventListeners)
  }

  disconnectedCallback() {
    removeEventListeners(this, this._eventListeners)
  }

  attributeChangedCallback(attrName) {
    switch (attrName) {
      case "small":
        this._updateTooltip()
        break
      default:
        break
    }
  }

  get node() {
    return this._node
  }

  set node(node) {
    this._node = node
    this._updateImage()
    this._updateTooltip()

    this.$link.href = this.url
    this.$name.textContent = this.name
  }

  get name() {
    return this.node ? this.node.title || this.node.url || "" : ""
  }

  get url() {
    return this.node ? this.node.url || "#" : "#"
  }

  get isFolder() {
    return !this.node.url
  }

  get small() {
    return this.hasAttribute("small")
  }

  set small(small) {
    if (small) {
      this.setAttribute("small", "")
    } else {
      this.removeAttribute("small")
    }
  }

  onClick() {
    const nodeId = this.node.id
    requestAnimationFrame(() =>
      this.dispatchEvent(
        new CustomEvent("x-bookmark-click", {
          detail: { nodeId }
        })
      )
    )
  }

  onCtxMenu(ev) {
    ev.preventDefault()
    this.dispatchEvent(
      new CustomEvent("x-bookmark-ctx-menu", {
        detail: { x: ev.x, y: ev.y }
      })
    )
  }

  onDragStart(ev) {
    requestAnimationFrame(() => this.classList.add("dragging"))

    ev.dataTransfer.setDragImage(this, ev.offsetX, ev.offsetY)
    ev.dataTransfer.setData("text/x-bookmark-id", this.node.id)

    this.dispatchEvent(new CustomEvent("x-bookmark-drag-start"))
  }

  onDragOver(ev) {
    ev.preventDefault()
    ev.dataTransfer.dropEffect = "move"

    this.dispatchEvent(
      new CustomEvent("x-bookmark-drag-over", {
        detail: { y: ev.y }
      })
    )
  }

  onDragLeave() {
    this.classList.remove("expand")
  }

  onDragEnd() {
    requestAnimationFrame(() => this.classList.remove("dragging"))
  }

  onDrop(ev) {
    ev.preventDefault()

    const bookmarkId = ev.dataTransfer.getData("text/x-bookmark-id") || null
    const title = ev.dataTransfer.getData("text/plain")
    const url = ev.dataTransfer.getData("text/uri-list") || title
    this.dispatchEvent(
      new CustomEvent("x-bookmark-drop", {
        detail: { bookmarkId, title, url, y: ev.y }
      })
    )
  }

  onMouseOver() {
    this.dispatchEvent(new CustomEvent("x-bookmark-mouseover"))
  }

  onMouseLeave() {
    this.dispatchEvent(new CustomEvent("x-bookmark-mouseleave"))
  }

  _updateImage() {
    if (this.node && !this.node.url) {
      this.$image.src = folderOutlineUri
    } else {
      this.$image.src = `chrome://favicon/size/16@8x/${this.url}`
    }
  }

  _updateTooltip() {
    if (this.small) {
      this.title = ""
    } else {
      this.title = this.name
    }
  }
}

customElements.define("x-bookmark", XBookmarkElement)
