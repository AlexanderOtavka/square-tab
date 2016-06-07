/* globals Settings */
'use strict';

class Popup {
  constructor() {
    throw new TypeError('Static class cannot be instantiated.');
  }

  static main() {
    const $bookmarksDrawerMode =
      document.querySelector('#bookmarks-drawer-mode');
    const $bookmarksDrawerSmall =
      document.querySelector('#bookmarks-drawer-small');
    const $boxedInfo = document.querySelector('#boxed-info');
    const $showWeather = document.querySelector('#show-weather');
    const $temperatureUnit = document.querySelector('#temperature-unit');
    const $todImages = document.querySelector('#tod-images');

    this.bindRadioButtons($bookmarksDrawerMode,
                          Settings.keys.BOOKMARKS_DRAWER_MODE,
                          Settings.enums.BookmarkDrawerModes);
    this.bindCheckbox($bookmarksDrawerSmall,
                      Settings.keys.BOOKMARKS_DRAWER_SMALL);
    this.bindCheckbox($boxedInfo, Settings.keys.BOXED_INFO);
    this.bindCheckbox($showWeather, Settings.keys.SHOW_WEATHER);
    this.bindRadioButtons($temperatureUnit, Settings.keys.TEMPERATURE_UNIT,
                          Settings.enums.TemperatureUnits);
    this.bindCheckbox($todImages, Settings.keys.USE_TIME_OF_DAY_IMAGES);
  }

  static bindCheckbox($wrapper, settingKey) {
    let $checkbox = $wrapper.querySelector('input[type=checkbox]');

    $wrapper.addEventListener('click', () => {
      let value = $checkbox.checked;
      Settings.set(settingKey, value);
    });

    Settings.onDataChanged(settingKey).addListener(data => {
      $checkbox.checked = data.value;
      $checkbox.disabled = data.activeOverride !== undefined;
    });
  }

  static bindRadioButtons($wrapper, settingKey, values) {
    let buttonsNodelist = $wrapper.querySelectorAll('input[type=radio]');
    let buttons = Array.prototype.slice.call(buttonsNodelist);

    buttons.forEach($button => {
      $button.addEventListener('click', () => {
        if ($button.checked) {
          Settings.set(settingKey, values[$button.value]);
        }
      });
    });

    Settings.onDataChanged(settingKey).addListener(data => {
      let valueName = Object.keys(values).find(key =>
        values[key] === data.value
      );
      let $targetButton = buttons.find($button => $button.value === valueName);

      if ($targetButton) {
        $targetButton.checked = true;
      } else {
        let $selectedButton = buttons.find($button => $button.checked);
        if ($selectedButton) {
          $selectedButton.checked = false;
        }
      }

      let disabled = data.activeOverride !== undefined;
      buttons.forEach($button => $button.disabled = disabled);
    });
  }
}

Popup.main();
