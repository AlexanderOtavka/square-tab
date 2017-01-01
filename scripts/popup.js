/* globals Settings */


class Popup {
  constructor() {
    throw new TypeError('Static class cannot be instantiated.');
  }

  static main() {
    const BOOKMARKS_DRAWER_MODE = 'BOOKMARKS_DRAWER_MODE';
    const BOOKMARKS_DRAWER_SMALL = 'BOOKMARKS_DRAWER_SMALL';
    const SHOW_PHOTO_SOURCE = 'SHOW_PHOTO_SOURCE';
    const BOXED_INFO = 'BOXED_INFO';
    const SHOW_WEATHER = 'SHOW_WEATHER';
    const TEMPERATURE_UNIT = 'TEMPERATURE_UNIT';
    const USE_TIME_OF_DAY_IMAGES = 'USE_TIME_OF_DAY_IMAGES';

    this.bindRadioButtons(BOOKMARKS_DRAWER_MODE,
                          Settings.enums.BookmarkDrawerModes);
    this.bindCheckbox(BOOKMARKS_DRAWER_SMALL);
    this.bindCheckbox(SHOW_PHOTO_SOURCE);
    this.bindCheckbox(BOXED_INFO);
    this.bindCheckbox(SHOW_WEATHER);
    this.bindRadioButtons(TEMPERATURE_UNIT,
                          Settings.enums.TemperatureUnits);
    this.bindCheckbox(USE_TIME_OF_DAY_IMAGES);
  }

  static bindCheckbox(settingKeyName) {
    const $checkbox =
      document.querySelector(`input[type=checkbox][name=${settingKeyName}]`);
    const settingKey = Settings.keys[settingKeyName];

    $checkbox.addEventListener('click', () => {
      const value = $checkbox.checked;
      Settings.set(settingKey, value);
    });

    Settings.onDataChanged(settingKey).addListener(data => {
      $checkbox.checked = data.value;
      $checkbox.disabled = data.activeOverride !== undefined;
    });
  }

  static bindRadioButtons(settingKeyName, values) {
    const buttonsNodelist =
      document.querySelectorAll(`input[type=radio][name=${settingKeyName}]`);
    const buttons = Array.prototype.slice.call(buttonsNodelist);
    const settingKey = Settings.keys[settingKeyName];

    buttons.forEach($button => {
      $button.addEventListener('click', () => {
        if ($button.checked)
          Settings.set(settingKey, values[$button.value]);
      });
    });

    Settings.onDataChanged(settingKey).addListener(data => {
      const valueName = Object.keys(values).find(key =>
        values[key] === data.value
      );
      const $targetButton =
        buttons.find($button => $button.value === valueName);

      if ($targetButton) {
        $targetButton.checked = true;
      } else {
        const $selectedButton = buttons.find($button => $button.checked);
        if ($selectedButton)
          $selectedButton.checked = false;
      }

      const disabled = data.activeOverride !== undefined;
      buttons.forEach($button => {
        $button.disabled = disabled;
      });
    });
  }
}

Popup.main();
