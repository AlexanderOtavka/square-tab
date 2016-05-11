(function (app) {
'use strict';

const {
  settings,
} = app;

const $weatherIcon = document.querySelector('#weather-icon');
const $temperature = document.querySelector('#temperature');

const STORAGE_KEY_WEATHER_DATA = 'weatherData';

let _loadCalled = false;
let onDataLoad = new chrome.Event();
let _data;

let _onInitialLoad;
let _initialLoad = new Promise(resolve => {
  _onInitialLoad = resolve;
});

chrome.storage.onChanged.addListener(
  ({ [STORAGE_KEY_WEATHER_DATA]: change }, area) => {
    if (area === 'local' && change) {
      _handleWeatherDataLoad(change.newValue);
    }
  }
);

onDataLoad.addListener(data => {
  _data = data;
  _updateWeather(data);
});

function load() {
  if (!_loadCalled) {
    _loadCalled = true;

    if (navigator.geolocation) {
      chrome.storage.local.get(
        STORAGE_KEY_WEATHER_DATA,
        ({ [STORAGE_KEY_WEATHER_DATA]: data }) => _handleWeatherDataLoad(data)
      );
    } else {
      return Promise.reject(new Error('Geolocation is not supported.'));
    }
  }

  return _initialLoad;
}

function _handleWeatherDataLoad(dataString) {
  let data = JSON.parse(dataString || 'null');
  if (data && Date.now() < data.expiration) {
    _onInitialLoad();
    onDataLoad.dispatch(data);
  } else {
    _fetchAndCacheWeatherData();
  }
}

function _updateWeather(weatherData) {
  const S_CLOUDS = 'SCATTERED CLOUDS';
  const B_CLOUDS = 'BROKEN CLOUDS';
  const L_RAIN = 'LIGHT RAIN';
  const RAIN = 'RAIN';
  const CLEAR = 'CLEAR';
  const MIST = 'MIST';
  const STORM = 'STORM';
  const EXTREME = 'EXTREME';
  const CLOUDS = 'CLOUDS';
  const SNOW = 'SNOW';

  let main = weatherData.weather[0].main.toUpperCase();
  let description = weatherData.weather[0].description.toUpperCase();

  let date = new Date();
  let hours = date.getHours();
  let minutes = date.getMinutes() / 60;
  let currentTime = hours + minutes;

  let timerise = weatherData.sys.sunrise * 1000;
  let timeset = weatherData.sys.sunset * 1000;

  let sunset = new Date(timeset);
  let sunsetHour = sunset.getHours();
  let sunsetMinute = sunset.getMinutes() / 60;
  let sunsetTime = sunsetHour + sunsetMinute;

  let sunrise = new Date(timerise);
  let sunriseHour = sunrise.getHours();
  let sunriseMinute = sunrise.getMinutes() / 60;
  let sunriseTime = sunriseHour + sunriseMinute;

  let isNight = false;
  if (currentTime > sunsetTime || currentTime < sunriseTime) {
    isNight = true;
  }

  if (main === CLOUDS) {
    if (description === S_CLOUDS || description === B_CLOUDS) {
      if (isNight) {
        $weatherIcon.src = '../images/weather/partly-cloudy-night.png';
      } else {
        $weatherIcon.src = '../images/weather/partly-cloudy.png';
      }
    } else {
      $weatherIcon.src = '../images/weather/cloudy.png';
    }
  } else if (main === RAIN) {
    if (description === L_RAIN) {
      $weatherIcon.src = '../images/weather/little-rain.png';
    } else {
      $weatherIcon.src = '../images/weather/rain.png';
    }
  } else if (main === CLEAR) {
    if (isNight) {
      $weatherIcon.src = '../images/weather/clear-night.png';
    } else {
      $weatherIcon.src = '../images/weather/clear.png';
    }
  } else if (main === MIST) {
    if (isNight) {
      $weatherIcon.src = '../images/weather/fog-night.png';
    } else {
      $weatherIcon.src = '../images/weather/fog-day.png';
    }
  } else if (main === STORM) {
    $weatherIcon.src = '../images/weather/storm.png';
  } else if (main === EXTREME) {
    $weatherIcon.src = '../images/weather/warning.png';
  } else if (main === SNOW) {
    $weatherIcon.src = '../images/weather/snow.png';
  } else {
    $weatherIcon.src = '';
  }

  updateTemperatureUnit(settings.get(settings.keys.TEMPERATURE_UNIT));
}

function _fetchAndCacheWeatherData() {
  chrome.runtime.getBackgroundPage(eventPage => {
    eventPage.fetchAndCacheWeatherData(STORAGE_KEY_WEATHER_DATA);
  });
}

function updateTemperatureUnit(unit) {
  if (_data) {
    let temperatureC = Math.round(_data.main.temp);
    switch (unit) {
      case settings.TemperatureUnits.CELCIUS:
        $temperature.textContent = `${temperatureC} °C`;
        break;
      case settings.TemperatureUnits.FAHRENHEIT:
        let temperatureF = Math.round(((temperatureC * 9) / 5) + 32);
        $temperature.textContent = `${temperatureF} °F`;
        break;
      default:
        $temperature.textContent = '';
    }
  }
}

app.weather = { load, updateTemperatureUnit, onDataLoad };

})(window.app = window.app || {});
