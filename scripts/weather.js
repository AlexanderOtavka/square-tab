(function (app) {
'use strict';

const $weatherIcon = document.querySelector('#weather-icon');
const $temperature = document.querySelector('#temperature');
const { settings } = app;

const STORAGE_KEY_WEATHER_DATA = 'weatherData';

let isLoaded = false;
let temperatureC;

function load() {
  if (!isLoaded) {
    isLoaded = true;

    if (navigator.geolocation) {
      chrome.storage.local.get(
        STORAGE_KEY_WEATHER_DATA,
        ({ [STORAGE_KEY_WEATHER_DATA]: jsonWeatherData }) => {
          let data = JSON.parse(jsonWeatherData);
          _updateWeather(data);
        }
      );

      navigator.geolocation.getCurrentPosition(position => {
        const WEATHER_RESOURCE =
          'http://api.openweathermap.org/data/2.5/weather';
        const API_KEY = '55c2586d12873c5d39e99b0dea411dc2';
        let lat = position.coords.latitude;
        let long = position.coords.longitude;
        let qry = `lat=${lat}&lon=${long}&APPID=${API_KEY}&units=metric`;

        fetch(`${WEATHER_RESOURCE}?${qry}`, {
          method: 'GET',
          mode: 'cors',
          cache: 'default',
        })
          .then(response => {
            if (response.ok) {
              return response.json();
            } else {
              throw new TypeError(
                `Weather request failed with status: ${response.status}`
              );
            }
          })
          .then(data => {
            _updateWeather(data);
            chrome.storage.local.set({
              [STORAGE_KEY_WEATHER_DATA]: JSON.stringify(data),
            });
          });
      });
    } else {
      console.error('Geolocation is not supported!');
    }
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

  temperatureC = Math.round(weatherData.main.temp);

  let date = new Date();
  let hours = date.getHours();
  let isNight = false;
  if (hours < 4 || hours >= 20) {
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

  let unit = settings.get(settings.keys.TEMPERATURE_UNIT);
  updateTemperatureUnit(unit);
}

function updateTemperatureUnit(unit) {
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

app.weather = { load, updateTemperatureUnit };

})(window.app = window.app || {});
