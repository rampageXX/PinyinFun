/*
 * lib/recordings.js — sounds recorded on the device itself.
 *
 * Nine letters cannot be synthesised correctly. Seven of them because the flat
 * reading is not a Mandarin syllable at all, so no 汉字 and no pronunciation
 * database has it; the other two because their characters are rare or absent.
 * The only fix is a human voice.
 *
 * Dropping MP3s into audio/overrides/ works, but it means a laptop, a file
 * manager and a redeploy. Recording straight into the iPad does not, and the
 * voice she would rather hear is in the room anyway.
 *
 * Recordings live in IndexedDB rather than localStorage because they are blobs
 * and localStorage is a string store with a few megabytes to its name. They are
 * device-local by nature: clearing the browser's data removes them, and they do
 * not travel to another iPad. That is worth saying out loud in 家长.
 */

const REC_DB_NAME = 'pinyin_recordings';
const REC_STORE = 'clips';

let recDbPromise = null;
const recordingUrls = {};      // audio path -> blob: URL, for resolveSrc

function recordingsSupported() {
  return typeof indexedDB !== 'undefined' &&
         typeof MediaRecorder !== 'undefined' &&
         !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

function openRecordingDb() {
  if (recDbPromise) return recDbPromise;
  recDbPromise = new Promise(function (resolve, reject) {
    if (typeof indexedDB === 'undefined') { reject(new Error('no indexedDB')); return; }
    const req = indexedDB.open(REC_DB_NAME, 1);
    req.onupgradeneeded = function () {
      const db = req.result;
      if (!db.objectStoreNames.contains(REC_STORE)) db.createObjectStore(REC_STORE);
    };
    req.onsuccess = function () { resolve(req.result); };
    req.onerror = function () { reject(req.error); };
  });
  return recDbPromise;
}

function recStore(mode) {
  return openRecordingDb().then(function (db) {
    return db.transaction(REC_STORE, mode).objectStore(REC_STORE);
  });
}

function saveRecording(path, blob) {
  return recStore('readwrite').then(function (store) {
    return new Promise(function (resolve, reject) {
      const req = store.put(blob, path);
      req.onsuccess = function () {
        // Point playback at it straight away, and drop the cached <audio> for
        // the old file or the next tap would replay the synthesised one.
        if (recordingUrls[path]) URL.revokeObjectURL(recordingUrls[path]);
        recordingUrls[path] = URL.createObjectURL(blob);
        forgetAudio(path);
        resolve(recordingUrls[path]);
      };
      req.onerror = function () { reject(req.error); };
    });
  });
}

function deleteRecording(path) {
  return recStore('readwrite').then(function (store) {
    return new Promise(function (resolve, reject) {
      const req = store.delete(path);
      req.onsuccess = function () {
        if (recordingUrls[path]) URL.revokeObjectURL(recordingUrls[path]);
        delete recordingUrls[path];
        forgetAudio(path);
        resolve(true);
      };
      req.onerror = function () { reject(req.error); };
    });
  });
}

/* Called once at boot: every recording becomes a blob: URL that resolveSrc
   can hand back synchronously, so nothing else has to learn about promises. */
function loadRecordings() {
  if (typeof indexedDB === 'undefined') return Promise.resolve(0);
  return recStore('readonly').then(function (store) {
    return new Promise(function (resolve) {
      const out = {};
      const req = store.openCursor();
      req.onsuccess = function () {
        const cur = req.result;
        if (!cur) {
          Object.keys(out).forEach(function (k) {
            recordingUrls[k] = URL.createObjectURL(out[k]);
          });
          resolve(Object.keys(out).length);
          return;
        }
        out[cur.key] = cur.value;
        cur.continue();
      };
      req.onerror = function () { resolve(0); };
    });
  }).catch(function () { return 0; });
}

function recordingUrl(path) {
  return recordingUrls[path] || null;
}

function hasRecording(path) {
  return !!recordingUrls[path];
}

function recordedCount() {
  return Object.keys(recordingUrls).length;
}

/*
 * Record until stop() is called on the returned handle. Resolves with the blob
 * once the recorder has flushed, which is not the same moment the tracks stop —
 * stopping early loses the tail of the sound.
 */
function startRecording() {
  return navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
    const chunks = [];
    const rec = new MediaRecorder(stream);
    rec.addEventListener('dataavailable', function (e) {
      if (e.data && e.data.size) chunks.push(e.data);
    });
    const done = new Promise(function (resolve) {
      rec.addEventListener('stop', function () {
        stream.getTracks().forEach(function (t) { t.stop(); });
        resolve(new Blob(chunks, { type: rec.mimeType || 'audio/webm' }));
      });
    });
    rec.start();
    return { stop: function () { if (rec.state !== 'inactive') rec.stop(); return done; } };
  });
}
