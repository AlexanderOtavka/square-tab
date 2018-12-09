import * as Surprise from "../modules/Surprise.js"
import * as Settings from "../modules/Settings.js"

bindRadioButtons("BOOKMARKS_DRAWER_MODE", Settings.enums.BookmarkDrawerModes)
bindRadioButtons(
  "BOOKMARKS_DRAWER_POSITION",
  Settings.enums.BookmarkDrawerPositions
)
bindCheckbox("BOOKMARKS_DRAWER_SMALL")
bindCheckbox("SHOW_PHOTO_SOURCE")
bindCheckbox("BOXED_INFO")
bindCheckbox("TWENTY_FOUR_HOUR_TIME")
bindCheckbox("SHOW_WEATHER")
bindRadioButtons("TEMPERATURE_UNIT", Settings.enums.TemperatureUnits)
bindCheckbox("USE_TIME_OF_DAY_IMAGES")
bindCheckbox("SURPRISE")

if (Surprise.isTime()) {
  document.querySelector("#surprise-container").hidden = false
}

function bindCheckbox(settingKeyName) {
  const $checkbox = document.querySelector(
    `input[type=checkbox][name=${settingKeyName}]`
  )
  const settingKey = Settings.keys[settingKeyName]

  $checkbox.addEventListener("click", () => {
    const value = $checkbox.checked
    Settings.set(settingKey, value)
  })

  Settings.onDataChanged(settingKey).subscribe(data => {
    $checkbox.checked = data.value
    $checkbox.disabled = data.activeOverride !== undefined
  })
}

function bindRadioButtons(settingKeyName, values) {
  const buttonsNodelist = document.querySelectorAll(
    `input[type=radio][name=${settingKeyName}]`
  )
  const buttons = Array.prototype.slice.call(buttonsNodelist)
  const settingKey = Settings.keys[settingKeyName]

  buttons.forEach($button => {
    $button.addEventListener("click", () => {
      if ($button.checked) {
        Settings.set(settingKey, values[$button.value])
      }
    })
  })

  Settings.onDataChanged(settingKey).subscribe(data => {
    const valueName = Object.keys(values).find(
      key => values[key] === data.value
    )
    const $targetButton = buttons.find($button => $button.value === valueName)

    if ($targetButton) {
      $targetButton.checked = true
    } else {
      const $selectedButton = buttons.find($button => $button.checked)
      if ($selectedButton) {
        $selectedButton.checked = false
      }
    }

    const disabled = data.activeOverride !== undefined
    buttons.forEach($button => {
      $button.disabled = disabled
    })
  })
}
