(function (app) {
'use strict';

const {
  bookmarksManager,
  weather,
  settings,
} = app;

const $root = document.documentElement;
const $body = document.body;
const $backgroundImage = document.querySelector('#background-image');
const $time = document.querySelector('#time');
const $greeting = document.querySelector('#greeting');
const $bookmarksOpenButton = document.querySelector('#bookmarks-open-button');
const $bookmarksCloseButton = document.querySelector('#bookmarks-close-button');
const $bookmarksUpButton = document.querySelector('#bookmarks-up-button');
const $bookmarksDrawerItems = document.querySelector('#bookmarks-drawer-items');
const $drawerBackdrop = document.querySelector('#drawer-backdrop');
const $weatherWrapper = document.querySelector('#weather-wrapper');

const STORAGE_KEY_IMAGE_DATA = 'imgData';

let screenPxWidth = window.screen.availWidth * window.devicePixelRatio;
let screenPxHeight = window.screen.availHeight * window.devicePixelRatio;
let imageResourceURI = 'https://source.unsplash.com/category/nature/' +
                       `${screenPxWidth}x${screenPxHeight}`;

// Load cached image
let backgroundImageReady = new Promise(resolve => {
  chrome.storage.local.get(
    STORAGE_KEY_IMAGE_DATA,
    ({ [STORAGE_KEY_IMAGE_DATA]: imageData }) => resolve(imageData)
  );
})
  .then(imageData => {
    let imageURL;
    if (imageData) {
      imageURL = `data:image/jpg;base64,${imageData}`;
    } else {
      imageURL = imageResourceURI;
    }

    $backgroundImage.src = imageURL;
  });

// Don't show anything until the settings and background image are ready
Promise.all([settings.loaded, backgroundImageReady])
  .then(() => {
    $body.removeAttribute('unresolved');
    $body.animate([
        { opacity: 0 },
        { opacity: 1 },
      ], {
        duration: 200,
        easing: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
      });
  });

// Handle changes to settings
settings.onChanged(settings.keys.ALWAYS_SHOW_BOOKMARKS)
  .addListener(updateBookmarkDrawerLock);
settings.onChanged(settings.keys.BOOKMARKS_DRAWER_SMALL)
  .addListener(updateBookmarkDrawerSmall);
settings.onChanged(settings.keys.BOXED_INFO).addListener(updateBoxedInfo);
settings.onChanged(settings.keys.SHOW_WEATHER).addListener(updateWeather);
settings.onChanged(settings.keys.TEMPERATURE_UNIT)
  .addListener(weather.updateTemperatureUnit);

// Update weather whenever cache changes
weather.onDataLoad.addListener(() => {
  updateWeather(settings.get(settings.keys.SHOW_WEATHER));
});

// Fetch and cache a new image in the background
chrome.runtime.getBackgroundPage(eventPage => {
  eventPage.fetchAndCacheImage(imageResourceURI, STORAGE_KEY_IMAGE_DATA);
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
  $root.classList.add('bookmarks-drawer-open');
}

function closeBookmarks() {
  $root.classList.remove('bookmarks-drawer-open');
}

function updateBookmarkDrawerLock(alwaysShowBookmarks) {
  $root.classList.remove('bookmarks-drawer-open');
  $root.classList.toggle('bookmarks-drawer-locked-open', alwaysShowBookmarks);
}

function updateBookmarkDrawerSmall(drawerSmall) {
  $root.classList.toggle('bookmarks-drawer-small', drawerSmall);
  bookmarksManager.updateSize(drawerSmall);
}

function updateBoxedInfo(boxedInfo) {
  $root.classList.toggle('boxed-info', boxedInfo);
}

function updateWeather(showWeather) {
  if (showWeather) {
    return weather.load().then(() => $weatherWrapper.hidden = false);
  } else {
    $weatherWrapper.hidden = true;
    return Promise.resolve();
  }
}

})(window.app = window.app || {});
