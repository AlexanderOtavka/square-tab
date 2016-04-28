'use strict';

const $time = document.querySelector('#time');
const $greeting = document.querySelector('#greeting');
const $bookmarksDrawer = document.querySelector('#bookmarks-drawer');
const $bookmarksOpenButton = document.querySelector('#bookmarks-open-button');
const $bookmarksCloseButton = document.querySelector('#bookmarks-close-button');
const $drawerBackdrop = document.querySelector('#drawer-backdrop');

updateTime();
setInterval(updateTime, 1000);

$bookmarksOpenButton.addEventListener('click', openBookmarks);
$bookmarksCloseButton.addEventListener('click', closeBookmarks);
$drawerBackdrop.addEventListener('click', closeBookmarks);

chrome.bookmarks.getTree(tree => {
  console.log(tree);
});

function updateTime() {
  let date = new Date();
  let hours = date.getHours();
  let minutes = date.getMinutes();
  let seconds = date.getSeconds();

  let minutesStr = String(minutes);
  if (minutesStr.length < 2) {
    minutesStr = `0${minutesStr}`;
  }

  $time.textContent = `${hours % 12}:${minutesStr}`;

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
