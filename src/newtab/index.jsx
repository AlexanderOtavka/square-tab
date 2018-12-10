import React from "react"
import { render } from "react-dom"

import "../shared-styles.css"

import Page from "./Page"
import createWeatherStore from "./createWeatherStore"

const weatherStore = createWeatherStore()

render(
  <Page weatherStore={weatherStore} />,
  document.getElementById("react-root")
)
