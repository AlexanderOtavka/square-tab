/* globals StorageKeys */

class EventPage {
  constructor() {
    throw new TypeError('Static class cannot be instantiated.');
  }

  static main() {
    chrome.runtime.onInstalled.addListener(() => {
      chrome.storage.local.clear(() => {
        this.fetchAndCacheImage('https://source.unsplash.com/category/nature/');
        this.fetchAndCacheWeatherData();
      });
    });
  }

  static fetchAndCacheImage(resourceURI) {
    console.log(new Date(), 'fetching image');
    return fetch(resourceURI)
      .then(resp => {
        const photoNotFoundRE = /photo-1446704477871-62a4972035cd/;
        if (resp.ok && !photoNotFoundRE.test(resp.url))
          return this._readBlob(resp.body.getReader())
            .then(blob => {
              const contentType = resp.headers.get('content-type');
              const data = this._encodeUint8Array(blob);
              const dataUrl = `data:${contentType};base64,${data}`;
              chrome.storage.local.set({
                [StorageKeys.IMAGE_DATA_URL]: dataUrl,
                [StorageKeys.IMAGE_SOURCE_URL]: resp.url,
              });
            });
        else
          throw new Error('Image failed to fetch.');
      });
  }

  static fetchAndCacheWeatherData() {
    return new Promise(resolve => {
      navigator.geolocation.getCurrentPosition(position => resolve(position));
    })
      .then(position => {
        const WEATHER_RESOURCE =
          'http://api.openweathermap.org/data/2.5/weather';
        const API_KEY = '4b01c1eb7285f479b7352292b26d38ce';
        const lat = position.coords.latitude;
        const long = position.coords.longitude;

        // For some reason, the leading & needs to be there
        const qry = `&lat=${lat}&lon=${long}&APPID=${API_KEY}&units=metric`;

        console.log(new Date(), 'fetching weather data');
        return fetch(`${WEATHER_RESOURCE}?${qry}`, {
          method: 'GET',
          mode: 'cors',
          cache: 'default',
        });
      })
      .then(response => {
        if (response.ok)
          return response.json();
        else
          throw new Error('Weather request failed with status: ' +
                          `${response.status}`);
      })
      .then(data => {
        const HOUR_MS = 60 * 60 * 1000;
        const DATA_HARD_LIFETIME_MS = 2 * HOUR_MS;
        const DATA_FRESH_LIFETIME_MS = 0.5 * HOUR_MS;
        const SUN_DATA_LIFETIME_MS = 20 * 24 * HOUR_MS;

        data.hardExpiration = Date.now() + DATA_HARD_LIFETIME_MS;
        data.freshExpiration = Date.now() + DATA_FRESH_LIFETIME_MS;
        data.sunExpiration = Date.now() + SUN_DATA_LIFETIME_MS;

        chrome.storage.local.set({
          [StorageKeys.WEATHER_DATA]: JSON.stringify(data),
        });
      });
  }

  static _readBlob(reader, blobs = []) {
    return reader.read().then(({done, value}) => {
      if (!done) {
        blobs.push(value);
        return this._readBlob(reader, blobs);
      } else {
        const size = blobs.reduce((sum, blob) => sum + blob.length, 0);
        const fullBlob = new Uint8Array(size);
        let lastIndex = 0;
        blobs.forEach(blob => {
          fullBlob.set(blob, lastIndex);
          lastIndex += blob.length;
        });

        return fullBlob;
      }
    });
  }

  /**
   * Encode Uint8Array to base64 string.
   */
  static _encodeUint8Array(input) {
    // I don't know how this works; taken from:
    // https://stackoverflow.com/questions/11089732/display-image-from-blob-using-javascript-and-websockets/11092371#11092371

    const KEY_STR = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz' +
                    '0123456789+/=';
    let output = '';
    let chr1;
    let chr2;
    let chr3;
    let enc1;
    let enc2;
    let enc3;
    let enc4;
    let i = 0;

    while (i < input.length) {
      chr1 = input[i++];
      chr2 = i < input.length ? input[i++] : Number.NaN;
      chr3 = i < input.length ? input[i++] : Number.NaN;

      /* eslint-disable no-bitwise */
      enc1 = chr1 >> 2;
      enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
      enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
      enc4 = chr3 & 63;
      /* eslint-enable no-bitwise */

      if (isNaN(chr2))
        enc3 = enc4 = 64;
      else if (isNaN(chr3))
        enc4 = 64;

      output += KEY_STR.charAt(enc1) + KEY_STR.charAt(enc2) +
                KEY_STR.charAt(enc3) + KEY_STR.charAt(enc4);
    }

    return output;
  }
}

EventPage.main();

window.EventPage = EventPage;
