(function (app) {
'use strict';

const {
  settings,
} = app;

const $alwaysShowBookmarks = document.querySelector('#always-show-bookmarks');
const $bookmarksDrawerSmall = document.querySelector('#bookmarks-drawer-small');
const $boxedInfo = document.querySelector('#boxed-info');
const $about = document.querySelector('#about');

bindCheckbox($alwaysShowBookmarks, settings.keys.ALWAYS_SHOW_BOOKMARKS);
bindCheckbox($bookmarksDrawerSmall, settings.keys.BOOKMARKS_DRAWER_SMALL);
bindCheckbox($boxedInfo, settings.keys.BOXED_INFO);

// About link
$about.addEventListener('click', () => {
  chrome.tabs.create({ url: $about.href });
});

function bindCheckbox($wrapper, settingKey) {
  const $checkbox = $wrapper.querySelector('input[type=checkbox]');

  $wrapper.addEventListener('click', () => {
    let value = $checkbox.checked;
    settings.set(settingKey, value);
  });

  settings.addDataChangeListener(settingKey, data => {
    $checkbox.checked = data.value;
    $checkbox.disabled = data.override !== undefined;
  });
}

})(window.app = window.app || {});
