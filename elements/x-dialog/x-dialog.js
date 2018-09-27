class XDialogElement extends HTMLElement {
  static register() {
    this.$tmpl = document.currentScript.ownerDocument.querySelector("template")
    document.registerElement("x-dialog", this)
  }

  createdCallback() {
    this.createShadowRoot().appendChild(
      document.importNode(XDialogElement.$tmpl.content, true)
    )

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
    const buttonIsConfirm = ev.target.classList.contains("dialog-confirm")
    const buttonIsCancel = ev.target.classList.contains("dialog-cancel")
    if (dialogIsCloseable && (buttonIsConfirm || buttonIsCancel)) {
      if (buttonIsConfirm) {
        this.dispatchEvent(new CustomEvent("x-dialog-confirm"))
      }

      requestAnimationFrame(() => this.close())
    }
  }
}

XDialogElement.register()
