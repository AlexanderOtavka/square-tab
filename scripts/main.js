(function (app) {
'use strict';

const { bookmarksManager } = app;

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

/**
 * Encode Uint8Array to base64 string.
 */
function encodeUint8Array(input) {
  // I don't know how this works; taken from:
  // https://stackoverflow.com/questions/11089732/display-image-from-blob-using-
  // javascript-and-websockets/11092371#11092371

  const KEY_STR = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz' +
                  '0123456789+/=';
  let output = '';
  let chr1, chr2, chr3, enc1, enc2, enc3, enc4;
  let i = 0;

  while (i < input.length) {
    chr1 = input[i++];
    chr2 = i < input.length ? input[i++] : Number.NaN;
    chr3 = i < input.length ? input[i++] : Number.NaN;

    /* jshint -W016 */
    enc1 = chr1 >> 2;
    enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
    enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
    enc4 = chr3 & 63;
    /* jshint +W016 */

    if (isNaN(chr2)) {
      enc3 = enc4 = 64;
    } else if (isNaN(chr3)) {
      enc4 = 64;
    }

    output += KEY_STR.charAt(enc1) + KEY_STR.charAt(enc2) +
              KEY_STR.charAt(enc3) + KEY_STR.charAt(enc4);
  }

  return output;
}

function readBlob(reader, blobs = []) {
  return reader.read().then(({ done, value }) => {
    if (!done) {
      blobs.push(value);
      return readBlob(reader, blobs);
    } else {
      let size = blobs.reduce((sum, blob) => sum + blob.length, 0);

      let fullBlob = new Uint8Array(size);
      let lastIndex = 0;
      blobs.forEach(blob => {
        fullBlob.set(blob, lastIndex);
        lastIndex += blob.length;
      });

      return fullBlob;
    }
  });
}

})(window.app = window.app || {});
