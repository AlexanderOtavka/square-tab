(function (app) {
'use strict';

const { bookmarksManager, encodeUint8Array, readBlob } = app;

const $time = document.querySelector('#time');
const $greeting = document.querySelector('#greeting');
const $bookmarksOpenButton = document.querySelector('#bookmarks-open-button');
const $bookmarksCloseButton = document.querySelector('#bookmarks-close-button');
const $bookmarksUpButton = document.querySelector('#bookmarks-up-button');
const $bookmarksDrawerItems = document.querySelector('#bookmarks-drawer-items');
const $drawerBackdrop = document.querySelector('#drawer-backdrop');

const STORAGE_KEY_IMAGE_DATA = 'imgData';
const STORAGE_KEY_ALWAYS_SHOW_BOOKMARKS = 'alwaysShowBookmarks';

const IMAGE_RESOURCE_URI = 'https://source.unsplash.com/category/nature';

chrome.storage.local.get(
  STORAGE_KEY_IMAGE_DATA,
  ({ [STORAGE_KEY_IMAGE_DATA]: imageData }) => {
    let imageURL;
    if (imageData) {
      imageURL = `data:image/jpg;base64,${imageData}`;
    } else {
      imageURL = IMAGE_RESOURCE_URI;
    }

    document.documentElement.style.setProperty('--background-image',
                                               `url("${imageURL}")`);
  }
);

fetch(IMAGE_RESOURCE_URI)
  .then(resp => readBlob(resp.body.getReader()))
  .then(blob => {
    chrome.storage.local.set({
      [STORAGE_KEY_IMAGE_DATA]: encodeUint8Array(blob),
    });
  });

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && STORAGE_KEY_ALWAYS_SHOW_BOOKMARKS in changes) {
    let newValue = changes[STORAGE_KEY_ALWAYS_SHOW_BOOKMARKS].newValue;
    updateBookmarkDrawerLock(newValue);
  }
});

chrome.storage.sync.get(
  STORAGE_KEY_ALWAYS_SHOW_BOOKMARKS,
  ({ [STORAGE_KEY_ALWAYS_SHOW_BOOKMARKS]: alwaysShowBookmarks = false }) => {
    updateBookmarkDrawerLock(alwaysShowBookmarks);
  });

$bookmarksUpButton.addEventListener('click', () => {
  bookmarksManager.ascend();
});

$bookmarksDrawerItems.addEventListener('bookmark-clicked', event => {
  bookmarksManager.openNode(event.detail.node);
}, true);

updateTime();
setInterval(updateTime, 1000);

$bookmarksOpenButton.addEventListener('click', openBookmarks);
$bookmarksCloseButton.addEventListener('click', closeBookmarks);
$drawerBackdrop.addEventListener('click', closeBookmarks);

function updateTime() {
  let date = new Date();
  let hours = date.getHours();
  let minutes = date.getMinutes();

  let minutesStr = String(minutes);
  if (minutesStr.length < 2) {
    minutesStr = `0${minutesStr}`;
  }

  $time.textContent = `${hours % 12 || 12}:${minutesStr}`;

  let greeting;
  if (hours >= 0 && hours < 12) {
    greeting = 'Good Morning';
  } else if (hours >= 12 && hours < 18) {
    greeting = 'Good Afternoon';
  } else {
    greeting = 'Good Evening';
  }

  $greeting.textContent = greeting;
}

function openBookmarks() {
  document.body.classList.add('bookmarks-drawer-open');
}

function closeBookmarks() {
  document.body.classList.remove('bookmarks-drawer-open');
}

function updateBookmarkDrawerLock(alwaysShowBookmarks) {
  document.body.classList.toggle('bookmarks-drawer-locked-open',
                                 alwaysShowBookmarks);
}

})(window.app = window.app || {});
