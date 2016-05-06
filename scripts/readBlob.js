(function (app) {
'use strict';

function readBlob(reader, blobs = []) {
  return reader.read().then(({ done, value }) => {
    if (!done) {
      blobs.push(value);
      return readBlob(reader, blobs);
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

app.readBlob = readBlob;

})(window.app = window.app || {});
