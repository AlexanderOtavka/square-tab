(function () {
'use strict';

const $alwaysShowBookmarks = document.querySelector('#always-show-bookmarks');
const $alwaysShowBookmarksCB =
  document.querySelector('#always-show-bookmarks input[type=checkbox]');

const STORAGE_KEY_ALWAYS_SHOW_BOOKMARKS = 'alwaysShowBookmarks';

$alwaysShowBookmarks.addEventListener('click', () => {
  let alwaysShowBookmarks = $alwaysShowBookmarksCB.checked;
  chrome.storage.sync.set({
    [STORAGE_KEY_ALWAYS_SHOW_BOOKMARKS]: alwaysShowBookmarks,
  });
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && STORAGE_KEY_ALWAYS_SHOW_BOOKMARKS in changes) {
    updateCheckbox(changes[STORAGE_KEY_ALWAYS_SHOW_BOOKMARKS].newValue);
  }
});

chrome.storage.sync.get(
  STORAGE_KEY_ALWAYS_SHOW_BOOKMARKS,
  ({ [STORAGE_KEY_ALWAYS_SHOW_BOOKMARKS]: alwaysShowBookmarks = false }) => {
    updateCheckbox(alwaysShowBookmarks);
  });

function updateCheckbox(alwaysShowBookmarks) {
  $alwaysShowBookmarksCB.checked = alwaysShowBookmarks;
}

})();
