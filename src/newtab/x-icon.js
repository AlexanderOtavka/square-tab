import html from "../html.js"

const $icons = html`
  <svg id="bookmarks" viewBox="0 0 24 24">
    <path d="M17,3H7A2,2 0 0,0 5,5V21L12,18L19,21V5C19,3.89 18.1,3 17,3Z" />
  </svg>

  <svg id="folder" viewBox="0 0 24 24">
    <path
      d="M10,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V8C22,6.89 21.1,6 20,6H12L10,4Z"
    />
  </svg>

  <svg id="folder-up" viewBox="0 0 24 24">
    <path
      d="M20,6A2,2 0 0,1 22,8V18A2,2 0 0,1 20,20H4A2,2 0 0,1 2,18V6A2,2 0 0,1 4,4H10L12,6H20M10.75,13H14V17H16V13H19.25L15,8.75"
    />
  </svg>

  <svg id="close" viewBox="0 0 24 24">
    <path
      d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"
    />
  </svg>
`

export default class XIconElement extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: "open" }).appendChild(html`
      <link rel="stylesheet" href="/public/styles/shared-styles.css" />
      <link rel="stylesheet" href="/public/styles/x-icon.css" />

      <div id="button-click-circle"></div>
    `)

    this._updateIcon()
  }

  attributeChangedCallback(attrName) {
    switch (attrName) {
      case "icon":
        this._updateIcon()
        break
      default:
        break
    }
  }

  get icon() {
    return this.getAttribute("icon") || ""
  }

  set icon(icon) {
    this.setAttribute("icon", icon)
    this._updateIcon()
  }

  get large() {
    return this.hasAttribute("large")
  }

  set large(large) {
    if (large) {
      this.setAttribute("large", "")
    } else {
      this.removeAttribute("large")
    }
  }

  get button() {
    return this.hasAttribute("large")
  }

  set button(button) {
    if (button) {
      this.setAttribute("button", "")
    } else {
      this.removeAttribute("button")
    }
  }

  _updateIcon() {
    const $currentSVG = this.shadowRoot.querySelector("svg")

    if (!$currentSVG || $currentSVG.id !== this.icon) {
      if ($currentSVG) {
        this.shadowRoot.removeChild($currentSVG)
      }

      if (this.icon) {
        const $newSVG = $icons.querySelector(`svg#${this.icon}`)
        if ($newSVG) {
          this.shadowRoot.appendChild($newSVG.cloneNode(true))
        }
      }
    }
  }
}

customElements.define("x-icon", XIconElement)
