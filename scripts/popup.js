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
  $alwaysShowBookmarksCB.checked = value;
});

const $showWeather = document.querySelector('#show-weather');
const $showWeatherCB =
  document.querySelector('#show-weather input[type=checkbox]');

$showWeather.addEventListener('click', () => {
  let showWeather = $showWeatherCB.checked;
  settings.set(settings.keys.SHOW_WEATHER, showWeather);
});

settings.addChangeListener(settings.keys.SHOW_WEATHER, value => {
  $showWeatherCB.checked = value;
});

const $useCelsius = document.querySelector('#use-celsius');
const $useCelsiusCB =
  document.querySelector('#use-celsius input[type=checkbox]');

$useCelsius.addEventListener('click', () => {
  let useCelsius = $useCelsiusCB.checked;
  settings.set(settings.keys.USE_CELSIUS, useCelsius);
});

settings.addChangeListener(settings.keys.USE_CELSIUS, value => {
  $useCelsiusCB.checked = value;
});

$about.addEventListener('click', () => {
  chrome.tabs.create({ url: $about.href });
});

})(window.app = window.app || {});
