/* globals Settings, StorageKeys */


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
        if (area === 'local' && change)
          this._handleWeatherDataLoad(change.newValue);
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

      if (navigator.geolocation)
        chrome.storage.local.get(
          StorageKeys.WEATHER_DATA,
          ({ [StorageKeys.WEATHER_DATA]: data }) =>
            this._handleWeatherDataLoad(data)
        );
      else
        return Promise.reject(new Error('Geolocation is not supported.'));
    }

    return this._initialLoad;
  }

  static updateTemperatureUnit(unit) {
    if (this._data) {
      // Ensure against XSS with the cast to Number
      const temperatureC = Number(this._data.main.temp);
      switch (unit) {
      case Settings.enums.TemperatureUnits.CELCIUS:
        this.$temperature.innerHTML = `${Math.round(temperatureC)} &deg;C`;
        break;
      case Settings.enums.TemperatureUnits.FAHRENHEIT:
        {
          const temperatureF = Math.round(((temperatureC * 9) / 5) + 32);
          this.$temperature.innerHTML = `${temperatureF} &deg;F`;
        }
        break;
      default:
        this.$temperature.innerHTML = '';
      }
    }
  }

  static _handleWeatherDataLoad(dataString) {
    const data = JSON.parse(dataString || 'null');
    if (data && Date.now() < data.expiration) {
      this._onInitialLoad();
      this.onDataLoad.dispatch(data);

      const PRECACHE_THRESHOLD = 60 * 60 * 1000;  // 1 hour
      const timeUntilDataExpires = data.expiration - Date.now();
      if (timeUntilDataExpires > PRECACHE_THRESHOLD)
        return;  // don't fetch new data in background
    }

    this._fetchAndCacheWeatherData();
  }

  static _updateWeather(weatherData) {
    const iconCode = weatherData.weather[0].id;
    const description = weatherData.weather[0].description
      // convert description to Title Case
      .replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() +
                                txt.substr(1).toLowerCase());

    const DAY_MS = 1000 * 60 * 60 * 24;
    const tzOffset = new Date().getTimezoneOffset() * 60 * 1000;
    const now = (Date.now() - tzOffset) % DAY_MS;
    const sunset = ((weatherData.sys.sunset * 1000) - tzOffset) % DAY_MS;
    const sunrise = ((weatherData.sys.sunrise * 1000) - tzOffset) % DAY_MS;
    const isDay = (sunrise < now && now < sunset);
    const dayNightSuffix = isDay ? 'day' : 'night';

    const imageName = this._getImageName(iconCode, dayNightSuffix);
    this.$weatherIcon.src = `/images/weather/${imageName}.png`;
    this.$weatherIcon.alt = description;
    this.$weatherIcon.title = description;

    this.updateTemperatureUnit(Settings.get(Settings.keys.TEMPERATURE_UNIT));
  }

  static _fetchAndCacheWeatherData() {
    chrome.runtime.getBackgroundPage(({ EventPage }) => {
      EventPage.fetchAndCacheWeatherData();
    });
  }

  static _getImageName(iconCode, dayNightSuffix) {
    const major = Math.floor(iconCode / 100);
    const minor = iconCode % 100;
    const middleDigit = Math.floor(minor / 10);

    // codes listed at: http://openweathermap.org/weather-conditions
    switch (major) {
    case 2:
      if (minor === 12)
        return 'thunderstorm-heavy';
      else
        return 'thunderstorm';
    case 3:
      return 'rain-light';
    case 5:
      return 'rain';
    case 6:
      return 'snow';
    case 7:
      return `atmosphere-${dayNightSuffix}`;
    case 8:
      if (minor === 0)
        return `clear-${dayNightSuffix}`;
      else if (minor === 1)
        return `partly-cloudy-${dayNightSuffix}`;
      else
        return 'cloudy';
    case 9:
      if (middleDigit === 0)
        return 'extreme';
      else
        // todo: change to windy icon
        return `clear-${dayNightSuffix}`;
    default:
      console.error('Invalid weather icon code.');
      return `clear-${dayNightSuffix}`;
    }
  }
}

Weather.main();

window.Weather = Weather;
