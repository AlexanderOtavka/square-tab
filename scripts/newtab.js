(function (app) {
'use strict';

const { bookmarksManager, encodeUint8Array, readBlob, displayWeather } = app;

const $root = document.documentElement;
const $body = document.body;
const $time = document.querySelector('#time');
const $greeting = document.querySelector('#greeting');
const $bookmarksOpenButton = document.querySelector('#bookmarks-open-button');
const $bookmarksCloseButton = document.querySelector('#bookmarks-close-button');
const $bookmarksUpButton = document.querySelector('#bookmarks-up-button');
const $bookmarksDrawerItems = document.querySelector('#bookmarks-drawer-items');
const $drawerBackdrop = document.querySelector('#drawer-backdrop');

const STORAGE_KEY_IMAGE_DATA = 'imgData';
const STORAGE_KEY_ALWAYS_SHOW_BOOKMARKS = 'alwaysShowBookmarks';
const WINDOW_HEIGHT = window.screen.availHeight;
const WINDOW_WIDTH = window.screen.availWidth;
const PIXEL_RATIO = window.devicePixelRatio;
const IMAGE_RESOURCE_URI = 'https://source.unsplash.com/category/nature/' +
                           `${WINDOW_WIDTH * PIXEL_RATIO}x${WINDOW_HEIGHT * PIXEL_RATIO}`;
console.log(IMAGE_RESOURCE_URI);

// Load settings
chrome.storage.sync.get(
  STORAGE_KEY_ALWAYS_SHOW_BOOKMARKS,
  ({ [STORAGE_KEY_ALWAYS_SHOW_BOOKMARKS]: alwaysShowBookmarks = false }) => {
    updateBookmarkDrawerLock(alwaysShowBookmarks);
    displayWeather();

    // Don't show anything until the settings have loaded
    $body.removeAttribute('unresolved');
  });

// Handle settings updates
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && STORAGE_KEY_ALWAYS_SHOW_BOOKMARKS in changes) {
    let newValue = changes[STORAGE_KEY_ALWAYS_SHOW_BOOKMARKS].newValue;
    updateBookmarkDrawerLock(newValue);
  }
});

// Load cached image
chrome.storage.local.get(
  STORAGE_KEY_IMAGE_DATA,
  ({ [STORAGE_KEY_IMAGE_DATA]: imageData }) => {
    let imageURL;
    if (imageData) {
      imageURL = `data:image/jpg;base64,${imageData}`;
    } else {
      imageURL = IMAGE_RESOURCE_URI;
    }

    $root.style.setProperty('--background-image', `url("${imageURL}")`);
  }
);

// Fetch and cache a new image
fetch(IMAGE_RESOURCE_URI)
  .then(resp => readBlob(resp.body.getReader()))
  .then(blob => {
    chrome.storage.local.set({
      [STORAGE_KEY_IMAGE_DATA]: encodeUint8Array(blob),
    });
  });

// Handle bookmarks up navigation
$bookmarksUpButton.addEventListener('click', () => {
  bookmarksManager.ascend();
});

// Handle bookmarks down navigation
$bookmarksDrawerItems.addEventListener('bookmark-clicked', event => {
  bookmarksManager.openNode(event.detail.node);
}, true);

// Update the clock immediately, then once every second forever
updateTime();
setInterval(updateTime, 1000);

// Handle opening and closing the bookmarks drawer
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
  $body.classList.add('bookmarks-drawer-open');
}

function closeBookmarks() {
  $body.classList.remove('bookmarks-drawer-open');
}

function updateBookmarkDrawerLock(alwaysShowBookmarks) {
  $body.classList.remove('bookmarks-drawer-open');
  $body.classList.toggle('bookmarks-drawer-locked-open', alwaysShowBookmarks);
}

})(window.app = window.app || {});
