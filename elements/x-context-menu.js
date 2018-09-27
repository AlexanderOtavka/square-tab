import html from "../modules/html.js"

export default class XContextMenuElement extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: "open" }).appendChild(html`
      <link rel="stylesheet" href="/styles/shared-styles.css" />
      <link rel="stylesheet" href="/elements/x-context-menu.css" />

      <div id="wrapper">
        <slot></slot>
      </div>
    `)

    this.$wrapper = this.shadowRoot.querySelector("#wrapper")

    this.addEventListener("click", () => this.hide())
    this.addEventListener("contextmenu", ev => {
      ev.preventDefault()
      this.hide()
    })
  }

  show(x, y) {
    this.setAttribute("visible", "")
    this.$wrapper.style.width = "auto"
    this.$wrapper.style.height = "auto"

    requestAnimationFrame(() => {
      const windowRect = this.getBoundingClientRect()
      const menuRect = this.$wrapper.getBoundingClientRect()

      const MARGIN = 4

      let transformX = x
      let transformY = y
      const rightSideSpace = windowRect.width - transformX - MARGIN
      const bottomSideSpace = windowRect.height - transformY - MARGIN
      if (menuRect.width > rightSideSpace) {
        transformX -= menuRect.width
      }
      if (menuRect.height > bottomSideSpace) {
        transformY -= menuRect.height
      }

      if (transformX < MARGIN) {
        transformX = MARGIN
      }
      if (transformY < MARGIN) {
        transformY = MARGIN
      }

      const maxWidth = windowRect.width - MARGIN * 2
      const maxHeight = windowRect.height - MARGIN * 2
      if (menuRect.width > maxWidth) {
        this.$wrapper.style.width = `${maxWidth}px`
      }
      if (menuRect.height > maxHeight) {
        this.$wrapper.style.height = `${maxHeight}px`
      }

      // since the wrapper is attached to the right side of the screen
      const adjustedX = transformX + menuRect.width - windowRect.width
      this.$wrapper.style.transform = `translate(${adjustedX}px, ${transformY}px)`
    })
  }

  hide() {
    this.removeAttribute("visible")
    this.dispatchEvent(new CustomEvent("x-context-menu-close"))
  }
}

customElements.define("x-context-menu", XContextMenuElement)
