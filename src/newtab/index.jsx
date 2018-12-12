import React from "react"
import { render } from "react-dom"

import "../shared-styles.css"

import Page from "./Page"
import createWeatherStore from "./createWeatherStore"

// Disable default right click
window.addEventListener("contextmenu", ev => ev.preventDefault(), true)

// Control the global dragover class
let removeClassTimeout
window.addEventListener("dragover", () => {
  document.body.classList.add("dragover")

  clearTimeout(removeClassTimeout)
  removeClassTimeout = setTimeout(() => {
    document.body.classList.remove("dragover")
  }, 100)
})

const weatherStore = createWeatherStore()

render(
  <Page weatherStore={weatherStore} />,
  document.getElementById("react-root")
)
