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

{
  const IMAGE_RESOURCE_URI = 'https://source.unsplash.com/category/nature';
  const IMG_DATA_STORAGE_ID = 'imgData';

  let imageData = localStorage.getItem(IMG_DATA_STORAGE_ID);
  let imageURL;
  if (imageData) {
    imageURL = `data:image/jpg;base64,${imageData}`;
  } else {
    imageURL = IMAGE_RESOURCE_URI;
  }

  document.body.style.backgroundImage = `url("${imageURL}")`;

  fetch(IMAGE_RESOURCE_URI)
    .then(resp => readBlob(resp.body.getReader()))
    .then(blob => encodeUint8Array(blob))
    .then(dataString => localStorage.setItem(IMG_DATA_STORAGE_ID, dataString));
}

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

})(window.app = window.app || {});
