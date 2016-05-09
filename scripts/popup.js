(function (app) {
'use strict';

const {
  settings,
} = app;

const $alwaysShowBookmarks = document.querySelector('#always-show-bookmarks');
const $alwaysShowBookmarksCB = $alwaysShowBookmarks.querySelector('input');
const $bookmarksDrawerSmall = document.querySelector('#bookmarks-drawer-small');
const $bookmarksDrawerSmallCB = $bookmarksDrawerSmall.querySelector('input');
const $boxedInfo = document.querySelector('#boxed-info');
const $boxedInfoCB = $boxedInfo.querySelector('input');
const $about = document.querySelector('#about');

// Always show bookmarks
$alwaysShowBookmarks.addEventListener('click', () => {
  let value = $alwaysShowBookmarksCB.checked;
  settings.set(settings.keys.ALWAYS_SHOW_BOOKMARKS, value);
});

settings.addDataChangeListener(settings.keys.ALWAYS_SHOW_BOOKMARKS, data => {
  $alwaysShowBookmarksCB.checked = data.value;
  $alwaysShowBookmarksCB.disabled = data.override !== undefined;
});

// Bookmarks drawer small
$bookmarksDrawerSmall.addEventListener('click', () => {
  let value = $bookmarksDrawerSmallCB.checked;
  settings.set(settings.keys.BOOKMARKS_DRAWER_SMALL, value);
});

settings.addDataChangeListener(settings.keys.BOOKMARKS_DRAWER_SMALL, data => {
  $bookmarksDrawerSmallCB.checked = data.value;
  $bookmarksDrawerSmallCB.disabled = data.override !== undefined;
});

// Boxed info
$boxedInfo.addEventListener('click', () => {
  let value = $boxedInfoCB.checked;
  settings.set(settings.keys.BOXED_INFO, value);
});

settings.addDataChangeListener(settings.keys.BOXED_INFO, data => {
  $boxedInfoCB.checked = data.value;
  $boxedInfoCB.disabled = data.override !== undefined;
});

// About link
$about.addEventListener('click', () => {
  chrome.tabs.create({ url: $about.href });
});

})(window.app = window.app || {});
