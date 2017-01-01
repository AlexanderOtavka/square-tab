/* globals Settings, StorageKeys */
'use strict';

class Weather {
  constructor() {
    throw new TypeError('Static class cannot be instantiated.');
  }

  static main() {
    this.$weatherIcon = document.querySelector('#weather-icon');
    this.$temperature = document.querySelector('#temperature');

    this.onDataLoad = new chrome.Event();

    this._loadCalled = false;
    this._onInitialLoad = null;
    this._initialLoad = new Promise(resolve => {
      this._onInitialLoad = resolve;
    });

    chrome.storage.onChanged.addListener(
      ({ [StorageKeys.WEATHER_DATA]: change }, area) => {
        if (area === 'local' && change) {
          this._handleWeatherDataLoad(change.newValue);
        }
      }
    );

    this.onDataLoad.addListener(data => {
      this._data = data;
      this._updateWeather(data);
    });
  }

  static load() {
    if (!this._loadCalled) {
      this._loadCalled = true;

      if (navigator.geolocation) {
        chrome.storage.local.get(
          StorageKeys.WEATHER_DATA,
          ({ [StorageKeys.WEATHER_DATA]: data }) =>
            this._handleWeatherDataLoad(data)
        );
      } else {
        return Promise.reject(new Error('Geolocation is not supported.'));
      }
    }

    return this._initialLoad;
  }

  static updateTemperatureUnit(unit) {
    if (this._data) {
      // Ensure against XSS with the cast to Number
      let temperatureC = Number(this._data.main.temp);
      switch (unit) {
        case Settings.enums.TemperatureUnits.CELCIUS:
          this.$temperature.innerHTML = `${Math.round(temperatureC)} &deg;C`;
          break;
        case Settings.enums.TemperatureUnits.FAHRENHEIT:
          let temperatureF = Math.round(((temperatureC * 9) / 5) + 32);
          this.$temperature.innerHTML = `${temperatureF} &deg;F`;
          break;
        default:
          this.$temperature.innerHTML = '';
      }
    }
  }

  static _handleWeatherDataLoad(dataString) {
    let data = JSON.parse(dataString || 'null');
    if (data && Date.now() < data.expiration) {
      this._onInitialLoad();
      this.onDataLoad.dispatch(data);

      const PRECACHE_THRESHOLD = 60 * 60 * 1000;  // 1 hour
      let timeUntilDataExpires = data.expiration - Date.now();
      if (timeUntilDataExpires > PRECACHE_THRESHOLD) {
        return;  // don't fetch new data in background
      }
    }

    this._fetchAndCacheWeatherData();
  }

  static _updateWeather(weatherData) {
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

    const DAY_MS = 1000 * 60 * 60 * 24;
    let tzOffset = new Date().getTimezoneOffset() * 60 * 1000;
    let now = (Date.now() - tzOffset) % DAY_MS;
    let sunset = (weatherData.sys.sunset * 1000 - tzOffset) % DAY_MS;
    let sunrise = (weatherData.sys.sunrise * 1000 - tzOffset) % DAY_MS;

    let isNight = (now < sunrise || sunset < now);

    if (main === CLOUDS) {
      if (description === S_CLOUDS || description === B_CLOUDS) {
        if (isNight) {
          this.$weatherIcon.src = '../images/weather/partly-cloudy-night.png';
        } else {
          this.$weatherIcon.src = '../images/weather/partly-cloudy.png';
        }
      } else {
        this.$weatherIcon.src = '../images/weather/cloudy.png';
      }
    } else if (main === RAIN) {
      if (description === L_RAIN) {
        this.$weatherIcon.src = '../images/weather/little-rain.png';
      } else {
        this.$weatherIcon.src = '../images/weather/rain.png';
      }
    } else if (main === CLEAR) {
      if (isNight) {
        this.$weatherIcon.src = '../images/weather/clear-night.png';
      } else {
        this.$weatherIcon.src = '../images/weather/clear.png';
      }
    } else if (main === MIST) {
      if (isNight) {
        this.$weatherIcon.src = '../images/weather/fog-night.png';
      } else {
        this.$weatherIcon.src = '../images/weather/fog-day.png';
      }
    } else if (main === STORM) {
      this.$weatherIcon.src = '../images/weather/storm.png';
    } else if (main === EXTREME) {
      this.$weatherIcon.src = '../images/weather/warning.png';
    } else if (main === SNOW) {
      this.$weatherIcon.src = '../images/weather/snow.png';
    } else {
      this.$weatherIcon.src = '';
    }

    this.updateTemperatureUnit(Settings.get(Settings.keys.TEMPERATURE_UNIT));
  }

  static _fetchAndCacheWeatherData() {
    chrome.runtime.getBackgroundPage(({ EventPage }) => {
      EventPage.fetchAndCacheWeatherData();
    });
  }
}

Weather.main();

window.Weather = Weather;
