'use strict';

function fetchAndCacheImage(resourceURI, storageKey) {
  fetch(resourceURI)
    .then(resp => _readBlob(resp.body.getReader()))
    .then(blob => {
      chrome.storage.local.set({
        [storageKey]: _encodeUint8Array(blob),
      });
    });
}

function _readBlob(reader, blobs = []) {
  return reader.read().then(({ done, value }) => {
    if (!done) {
      blobs.push(value);
      return _readBlob(reader, blobs);
    } else {
      let size = blobs.reduce((sum, blob) => sum + blob.length, 0);
      let fullBlob = new Uint8Array(size);
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
function _encodeUint8Array(input) {
  // I don't know how this works; taken from:
  // https://stackoverflow.com/questions/11089732/display-image-from-blob-using-
  // javascript-and-websockets/11092371#11092371

  const KEY_STR = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz' +
                  '0123456789+/=';
  let output = '';
  let chr1, chr2, chr3, enc1, enc2, enc3, enc4;
  let i = 0;

  while (i < input.length) {
    chr1 = input[i++];
    chr2 = i < input.length ? input[i++] : Number.NaN;
    chr3 = i < input.length ? input[i++] : Number.NaN;

    /* jshint -W016 */
    enc1 = chr1 >> 2;
    enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
    enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
    enc4 = chr3 & 63;
    /* jshint +W016 */

    if (isNaN(chr2)) {
      enc3 = enc4 = 64;
    } else if (isNaN(chr3)) {
      enc4 = 64;
    }

    output += KEY_STR.charAt(enc1) + KEY_STR.charAt(enc2) +
              KEY_STR.charAt(enc3) + KEY_STR.charAt(enc4);
  }

  return output;
}

window.fetchAndCacheImage = fetchAndCacheImage;
