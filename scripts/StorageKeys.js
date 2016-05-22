'use strict';

class StorageKeys {
  constructor() {
    throw new TypeError('Static class cannot be instantiated.');
  }

  static get WEATHER_DATA() {
    return 'weatherData';
  }

  static get IMAGE_DATA_URL() {
    return 'imageDataURL';
  }
}

window.StorageKeys = StorageKeys;
