(function (app) {
'use strict';

const {
  settings,
} = app;

const $alwaysShowBookmarks = document.querySelector('#always-show-bookmarks');
const $alwaysShowBookmarksCB =
  document.querySelector('#always-show-bookmarks input[type=checkbox]');
const $about = document.querySelector('#about');

$alwaysShowBookmarks.addEventListener('click', () => {
  let alwaysShowBookmarks = $alwaysShowBookmarksCB.checked;
  settings.set(settings.keys.ALWAYS_SHOW_BOOKMARKS, alwaysShowBookmarks);
});

settings.addChangeListener(settings.keys.ALWAYS_SHOW_BOOKMARKS, value => {
  updateCheckbox(value);
});

$about.addEventListener('click', () => {
  chrome.tabs.create({ url: $about.href });
});

function updateCheckbox(alwaysShowBookmarks) {
  $alwaysShowBookmarksCB.checked = alwaysShowBookmarks;
}

})(window.app = window.app || {});
