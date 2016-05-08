(function (app) {
'use strict';

const $weatherIcon = document.querySelector('#weather-icon');
const $temperature = document.querySelector('#temperature');
const { settings } = app;

let tempF;
let tempC;

const STORAGE_KEY_WEATHER_DATA = 'weatherData';

function display() {
  if (navigator.geolocation) {

    chrome.storage.local.get(
      STORAGE_KEY_WEATHER_DATA,
      ({ [STORAGE_KEY_WEATHER_DATA]: weatherData }) => {
        let jsonWeatherData = JSON.parse(weatherData);
        tempF = Math.round(((jsonWeatherData.main.temp * 9) / 5) + 31);
        tempC = Math.round(jsonWeatherData.main.temp);
        useWeatherData(jsonWeatherData);
      }
    );
    navigator.geolocation.getCurrentPosition(getWeather);
  } else {
    console.error('Geolocation is not supported by this browser!');
  }

}

function useWeatherData(weatherData) {
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
  }else if (main === SNOW) {
    $weatherIcon.src = '../images/weather/snow.png';
  } else {
    $weatherIcon.src = '';
  }

  let useC = settings.get(settings.keys.USE_CELCIUS);

  console.log('first?');
  if (useC) {
    $temperature.textContent = `${tempC} C`;
  } else {
    $temperature.textContent = `${tempF} F`;
  }

}

function getWeather(position) {
  const API_KEY = '55c2586d12873c5d39e99b0dea411dc2';
  const LAT = position.coords.latitude;
  const LONG = position.coords.longitude;

  const INIT = {
    method: 'GET',
    mode: 'cors',
    cache: 'default',
  };

  let url = 'http://api.openweathermap.org/data/2.5/weather?';
  const FINAL_URL =
    `${url}&lat=${LAT}&lon=${LONG}&APPID=${API_KEY}&units=metric`;
  fetch(FINAL_URL, INIT)
    .then(response => {
      if (response.status !== 200) {
        console.warn(
          `Looks like there was a problem. Status Code: ${response.status}`);
        return;
      }

      response.json().then(data => {
        console.log('assigned');
        tempF = Math.round(((data.main.temp * 9) / 5) + 31);
        tempC = Math.round(data.main.temp);
        console.log(tempF);
        useWeatherData(data);
        chrome.storage.local.set({
          [STORAGE_KEY_WEATHER_DATA]: JSON.stringify(data),
        });
      });
    });
}

function updateTemperatureUnit(useCelsius) {
  if (useCelsius) {
    console.log('second?');
    $temperature.textContent = `${tempC} °C`;
  } else {
    $temperature.textContent = `${tempF} °F`;
  }
}

app.weather = { display, updateTemperatureUnit };

})(window.app = window.app || {});
