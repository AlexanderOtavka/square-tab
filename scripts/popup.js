(function (app) {
'use strict';

const {
  settings,
} = app;

const $alwaysShowBookmarks = document.querySelector('#always-show-bookmarks');
const $alwaysShowBookmarksCB =
  document.querySelector('#always-show-bookmarks input[type=checkbox]');
const $bookmarksDrawerSmall = document.querySelector('#bookmarks-drawer-small');
const $bookmarksDrawerSmallCB =
  document.querySelector('#bookmarks-drawer-small input[type=checkbox]');
const $about = document.querySelector('#about');

$alwaysShowBookmarks.addEventListener('click', () => {
  let alwaysShowBookmarks = $alwaysShowBookmarksCB.checked;
  settings.set(settings.keys.ALWAYS_SHOW_BOOKMARKS, alwaysShowBookmarks);
});

settings.addDataChangeListener(settings.keys.ALWAYS_SHOW_BOOKMARKS, data => {
  $alwaysShowBookmarksCB.checked = data.value;
});

$bookmarksDrawerSmall.addEventListener('click', () => {
  let bookmarksDrawerSmall = $bookmarksDrawerSmallCB.checked;
  settings.set(settings.keys.BOOKMARKS_DRAWER_SMALL, bookmarksDrawerSmall);
});

settings.addDataChangeListener(settings.keys.BOOKMARKS_DRAWER_SMALL, data => {
  $bookmarksDrawerSmallCB.checked = data.value;
  let disabled = data.override !== undefined;
  $bookmarksDrawerSmall.classList.toggle('disabled', disabled);
});

$about.addEventListener('click', () => {
  chrome.tabs.create({ url: $about.href });
});

})(window.app = window.app || {});
