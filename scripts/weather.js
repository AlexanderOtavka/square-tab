(function (app) {
'use strict';
const STORAGE_KEY_WEATHER_DATA = 'weatherData';
function displayWeather(){
  if (navigator.geolocation) {
    chrome.storage.local.get(
      STORAGE_KEY_WEATHER_DATA,
      ({ [STORAGE_KEY_WEATHER_DATA]: weatherData }) => {
        let jsonWeatherData = JSON.parse(weatherData);
        useWeatherData(jsonWeatherData);
      }
    );
    navigator.geolocation.getCurrentPosition(getWeather);
  } else {
    alert("Geolocation is not supported by this browser!");
  }
}

function useWeatherData(weatherData) {
  const temperature = Math.round(((weatherData.main.temp * 9) / 5) + 31);
  let main = weatherData.weather[0].main.toUpperCase();
  let description = weatherData.weather[0].description.toUpperCase();

  let date = new Date();
  let hours = date.getHours();

  if (hours >= 18 && (description === "SCATTERED CLOUDS" || description === "BROKEN CLOUDS" || main === "CLEAR")) {
    if (description === "SCATTERED CLOUDS" || "BROKEN CLOUDS") {
      document.getElementById("weather-icon").src="../images/partly-cloudy-night.png";
    }
    if (main === "CLEAR") {
      document.getElementById("weather-icon").src="../images/clear-night.png";
    }
  } else {
    if (description === "SCATTERED CLOUDS") {
      document.getElementById("weather-icon").src="../images/partly-cloudy.png";
    } else if (main === "CLOUDS") {
      document.getElementById("weather-icon").src="../images/cloudy.png";
    } else if (main === "MIST") {
      document.getElementById("weather-icon").src="../images/cloudy.png";
    } else if (main === "RAIN") {
      document.getElementById("weather-icon").src="../images/rain.png";
    } else if(main === "CLEAR") {
      document.getElementById("weather-icon").src="../images/clear.png";
    } else {
      document.getElementById("weather-icon").src="#";
    }
  }
  document.getElementById("temperature").innerHTML = temperature + " °F";
}

function getWeather(position) {
  const API_KEY = "55c2586d12873c5d39e99b0dea411dc2";
  const LAT = position.coords.latitude;
  const LONG = position.coords.longitude;

  const INIT = {
    method: 'GET',
    mode: 'cors',
    cache: 'default',
  };

  let url = "http://api.openweathermap.org/data/2.5/weather?";
  const FINAL_URL = url + "&lat=" + LAT + "&lon=" + LONG + "&APPID=" + API_KEY + "&units=metric";
  fetch(FINAL_URL, INIT)
    .then(
      function(response) {
      if (response.status !== 200) {
        console.warn('Looks like there was a problem. Status Code: ' +
          response.status);
        return;
      }
      response.json().then(function(data) {
        useWeatherData(data);
        chrome.storage.local.set({
          [STORAGE_KEY_WEATHER_DATA]: JSON.stringify(data),
        });
      });
    }
  );
}
app.displayWeather = displayWeather;
})(window.app = window.app || {});
