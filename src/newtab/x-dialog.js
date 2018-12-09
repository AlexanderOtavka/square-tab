// import "../x-icon/x-icon.js"
import html from "../html.js"

export default class XDialogElement extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: "open" }).appendChild(html`
      <link rel="stylesheet" href="/public/styles/shared-styles.css" />
      <link rel="stylesheet" href="/public/styles/x-dialog.css" />

      <section id="box">
        <header id="header" class="toolbar">
          <slot name="title"></slot>
          <x-icon id="close-button" icon="close" large button></x-icon>
        </header>
        <slot name="content"></slot>
        <footer id="footer" class="row">
          <slot name="cancel"></slot> <slot name="confirm"></slot>
        </footer>
      </section>

      <div id="backdrop"></div>
    `)

    this.$closeButton = this.shadowRoot.querySelector("#close-button")
    this.$footer = this.shadowRoot.querySelector("#footer")
    this.$backdrop = this.shadowRoot.querySelector("#backdrop")

    this.$closeButton.addEventListener("click", () => this.close())
    this.$footer.addEventListener("click", ev => this.onFooterClick(ev))
    this.$backdrop.addEventListener("click", () => this.close())
  }

  open() {
    this.setAttribute("open", "")
    this.dispatchEvent(new CustomEvent("x-dialog-open"))
  }

  close() {
    this.removeAttribute("open")
    this.dispatchEvent(new CustomEvent("x-dialog-close"))
  }

  onFooterClick(ev) {
    const dialogIsCloseable = !ev.target.classList.contains("dialog-no-close")
    const buttonIsConfirm = ev.target.getAttribute("slot") === "confirm"
    const buttonIsCancel = ev.target.getAttribute("slot") === "cancel"
    if (dialogIsCloseable && (buttonIsConfirm || buttonIsCancel)) {
      if (buttonIsConfirm) {
        this.dispatchEvent(new CustomEvent("x-dialog-confirm"))
      }

      requestAnimationFrame(() => this.close())
    }
  }
}

customElements.define("x-dialog", XDialogElement)
