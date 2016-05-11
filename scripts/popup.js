(function (app) {
'use strict';

const {
  settings,
} = app;

const $alwaysShowBookmarks = document.querySelector('#always-show-bookmarks');
const $bookmarksDrawerSmall = document.querySelector('#bookmarks-drawer-small');
const $boxedInfo = document.querySelector('#boxed-info');
const $showWeather = document.querySelector('#show-weather');
const $temperatureUnit = document.querySelector('#temperature-unit');

bindCheckbox($alwaysShowBookmarks, settings.keys.ALWAYS_SHOW_BOOKMARKS);
bindCheckbox($bookmarksDrawerSmall, settings.keys.BOOKMARKS_DRAWER_SMALL);
bindCheckbox($boxedInfo, settings.keys.BOXED_INFO);
bindCheckbox($showWeather, settings.keys.SHOW_WEATHER);
bindRadioButtons($temperatureUnit, settings.keys.TEMPERATURE_UNIT,
                 settings.TemperatureUnits);

function bindCheckbox($wrapper, settingKey) {
  let $checkbox = $wrapper.querySelector('input[type=checkbox]');

  $wrapper.addEventListener('click', () => {
    let value = $checkbox.checked;
    settings.set(settingKey, value);
  });

  settings.onDataChanged(settingKey).addListener(data => {
    $checkbox.checked = data.value;
    $checkbox.disabled = data.override !== undefined;
  });
}

function bindRadioButtons($wrapper, settingKey, values) {
  let buttonsNodelist = $wrapper.querySelectorAll('input[type=radio]');
  let buttons = Array.prototype.slice.call(buttonsNodelist);

  buttons.forEach($button => {
    $button.addEventListener('click', () => {
      if ($button.checked) {
        settings.set(settingKey, values[$button.value]);
      }
    });
  });

  settings.onDataChanged(settingKey).addListener(data => {
    let valueName = Object.keys(values).find(key => values[key] === data.value);
    let $targetButton = buttons.find($button => $button.value === valueName);

    if ($targetButton) {
      $targetButton.checked = true;
    } else {
      let $selectedButton = buttons.find($button => $button.checked);
      if ($selectedButton) {
        $selectedButton.checked = false;
      }
    }

    let disabled = data.override !== undefined;
    buttons.forEach($button => $button.disabled = disabled);
  });
}

})(window.app = window.app || {});
