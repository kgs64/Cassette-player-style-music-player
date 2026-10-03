(() => {
  // work/archive.js
  var DRAWERS = ["A01", "A02", "B01", "B02", "C01", "C02"];
  var DRAWER_CAPACITY = 96;
  function albumKey(t) {
    return `${t.artist || "UNKNOWN ARTIST"}${t.album || "LOCAL TAPES"}`;
  }
  function fingerprint(file, duration) {
    return [file.name, file.size, file.lastModified || 0, Math.round(duration * 100)].join("|");
  }
  function assignSlot(tracks, track) {
    const used = new Set(tracks.filter((t) => t.cabinetSlot).map((t) => `${t.cabinetSlot.drawer}:${t.cabinetSlot.index}`));
    const related = tracks.filter((t) => albumKey(t) === albumKey(track) && t.cabinetSlot);
    const preferred = [.../* @__PURE__ */ new Set([...related.map((t) => t.cabinetSlot.drawer), ...DRAWERS])];
    for (const drawer of preferred) for (let index = 0; index < DRAWER_CAPACITY; index++) if (!used.has(`${drawer}:${index}`)) return { drawer, index };
    throw new Error("ARCHIVE FULL");
  }
  function normalizeTrack(t) {
    return { ...t, id: String(t.id || t.trackId || crypto.randomUUID()), title: t.title || "UNTITLED", artist: t.artist || "UNKNOWN ARTIST", album: t.album || "LOCAL TAPES", audioBlob: t.audioBlob || t.blob || null, sourceRequired: !(t.audioBlob || t.blob), createdAt: t.createdAt || Date.now() };
  }
  var ArchiveDB = class {
    constructor(name = "CASSETTE_WORLD_DB") {
      this.db = null;
      this.failure = null;
      this.name = name;
    }
    async open() {
      if (!globalThis.indexedDB) throw new Error("ARCHIVE OFFLINE");
      this.db = await new Promise((resolve, reject) => {
        const request = indexedDB.open(this.name, 2);
        let rejected = false;
        request.onupgradeneeded = () => {
          const db = request.result;
          for (const name of ["tracks", "albums", "covers", "preferences", "session"]) if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath: "id" });
        };
        request.onerror = () => reject(request.error);
        request.onblocked = () => {
          rejected = true;
          reject(new Error("ARCHIVE IN ANOTHER TAB"));
        };
        request.onsuccess = () => {
          if (rejected) {
            request.result.close();
            return;
          }
          resolve(request.result);
        };
      });
      this.db.onversionchange = () => {
        this.db.close();
        this.db = null;
        this.failure = "ARCHIVE OFFLINE";
      };
      return this;
    }
    async all(store) {
      return this.read(store, (s) => s.getAll());
    }
    async get(store, id) {
      return this.read(store, (s) => s.get(id));
    }
    read(store, run) {
      if (!this.db) return Promise.reject(new Error("ARCHIVE OFFLINE"));
      return new Promise((resolve, reject) => {
        const tx = this.db.transaction(store, "readonly"), r = run(tx.objectStore(store));
        r.onsuccess = () => resolve(r.result);
        r.onerror = () => reject(r.error);
      });
    }
    write(stores, run) {
      if (!this.db) return Promise.reject(new Error("ARCHIVE OFFLINE"));
      return new Promise((resolve, reject) => {
        const tx = this.db.transaction(stores, "readwrite");
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error || new Error("SAVE ERROR"));
        try {
          run(tx);
        } catch (e) {
          tx.abort();
          reject(e);
        }
      });
    }
    putTrack(track) {
      const { objectURL, cover, sourceRequired, ...record } = track;
      return this.write(["tracks", "albums", "covers"], (tx) => {
        tx.objectStore("tracks").put(record);
        tx.objectStore("albums").put({ id: albumKey(track), title: track.album, artist: track.artist });
        if (track.artworkBlob) tx.objectStore("covers").put({ id: track.id, blob: track.artworkBlob });
      });
    }
    save(preferences, session) {
      return this.write(["preferences", "session"], (tx) => {
        tx.objectStore("preferences").put({ id: "current", ...preferences });
        tx.objectStore("session").put({ id: "current", ...session });
      });
    }
    remove(track, remaining) {
      return this.write(["tracks", "covers", "albums", "session"], (tx) => {
        tx.objectStore("tracks").delete(track.id);
        tx.objectStore("covers").delete(track.id);
        if (!remaining.some((t) => albumKey(t) === albumKey(track))) tx.objectStore("albums").delete(albumKey(track));
        tx.objectStore("session").delete("current");
      });
    }
    clear() {
      return this.write(["tracks", "covers", "albums", "session"], (tx) => {
        for (const name of ["tracks", "covers", "albums", "session"]) tx.objectStore(name).clear();
      });
    }
  };

  // work/archive-browser-tests.js
  var lines = [];
  var check = (ok, name) => {
    if (!ok) throw Error(name);
    lines.push("PASS " + name);
    document.querySelector("pre").textContent = lines.join("\n");
  };
  async function tests() {
    const name = "CASSETTE_TEST_" + Date.now();
    const initial = await new Promise((resolve, reject) => {
      const r = indexedDB.open(name, 1);
      r.onupgradeneeded = () => {
        r.result.createObjectStore("tracks", { keyPath: "id" });
        r.result.createObjectStore("preferences", { keyPath: "id" });
      };
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
    await new Promise((resolve, reject) => {
      const tx = initial.transaction(["tracks", "preferences"], "readwrite");
      tx.objectStore("tracks").put({ id: "legacy", title: "Old tape", artist: "Artist", album: "Old Album" });
      tx.objectStore("preferences").put({ id: "current", volume: 0.37 });
      tx.oncomplete = resolve;
      tx.onerror = reject;
    });
    initial.close();
    let db = await new ArchiveDB(name).open();
    check((await db.all("tracks")).length === 1, "v1 \u2192 v2 migration retains tracks");
    check((await db.get("preferences", "current")).volume === 0.37, "migration retains preferences");
    check(normalizeTrack(await db.get("tracks", "legacy")).sourceRequired, "metadata-only legacy tape requires its source");
    const t = { id: "blob", title: "New tape", artist: "Artist", album: "Album", audioBlob: new Blob([new Uint8Array([0, 1, 2, 255])], { type: "audio/wav" }), artworkBlob: new Blob(["cover"], { type: "image/png" }), cabinetSlot: { drawer: "A01", index: 7 }, objectURL: "blob:must-not-persist", cover: "blob:cover-not-persistent" };
    await db.putTrack(t);
    await db.save({ volume: 0.62, eq: [1, 2, 3, 4, 5] }, { currentTrackId: t.id, currentTime: 161.2, tapeInserted: true, activeDrawer: "A01", wasPlaying: true });
    db.db.close();
    db = await new ArchiveDB(name).open();
    const saved = await db.get("tracks", t.id);
    check([...new Uint8Array(await saved.audioBlob.arrayBuffer())].join(",") === "0,1,2,255", "actual audio Blob survives database close/reopen");
    check(!saved.objectURL && !saved.cover, "ephemeral object URLs are never persisted");
    check(saved.cabinetSlot.index === 7, "slot survives reopen");
    check((await db.get("session", "current")).currentTime === 161.2, "playback time persists");
    check((await db.get("preferences", "current")).eq.join(",") === "1,2,3,4,5", "EQ preferences persist");
    const tracks = [];
    for (let i = 0; i < 500; i++) {
      const t2 = { id: String(i), artist: "Artist " + Math.floor(i / 10), album: "Album " + Math.floor(i / 10) };
      t2.cabinetSlot = assignSlot(tracks, t2);
      tracks.push(t2);
    }
    check(new Set(tracks.map((t2) => t2.cabinetSlot.drawer + ":" + t2.cabinetSlot.index)).size === 500, "500 tracks get unique stable slots");
    const kept = tracks.filter((_, i) => i !== 20), replacement = { artist: "Artist 2", album: "Album 2" };
    check(assignSlot(kept, replacement).index === 20, "deleted slot is reused without shifting other tapes");
    check(fingerprint({ name: "a.wav", size: 100, lastModified: 3 }, 10) === fingerprint({ name: "a.wav", size: 100, lastModified: 3 }, 10), "repeat import identity stays stable");
    await db.remove(t, []);
    check(!await db.get("tracks", t.id) && !await db.get("covers", t.id) && !await db.get("albums", "ArtistAlbum"), "removal deletes audio, cover and empty album in one transaction");
    const prior = await db.get("preferences", "current");
    await db.clear();
    check((await db.all("tracks")).length === 0 && await db.get("preferences", "current"), "clear archive keeps preferences");
    check(prior.volume === 0.62, "preferences were not replaced by library writes");
    db.db.close();
    await new Promise((resolve, reject) => {
      const r = indexedDB.deleteDatabase(name);
      r.onsuccess = resolve;
      r.onerror = reject;
    });
    lines.push("DONE: " + lines.length + " checks");
    document.querySelector("pre").textContent = lines.join("\n");
  }
  tests().catch((e) => {
    document.querySelector("pre").textContent = lines.join("\n") + "\nFAIL " + e.stack;
  });
})();
