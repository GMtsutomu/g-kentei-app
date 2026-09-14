/* ==========================================================================
   G検定対策アプリ - Service Worker
   --------------------------------------------------------------------------
   ・アプリ本体（index.html）と、全16個の問題データファイル
     （questions/basic/ch1〜8.js、questions/mock/ch1〜8.js）を
     インストール時にキャッシュし、オフラインでも問題演習ができるように
     します。
   ・まだ作成していない章のファイルが混ざっていても、インストール自体は
     失敗しないように読み込みます（存在するファイルだけキャッシュされます）。
   ・問題を追加・修正してファイルの中身を更新したときは、ブラウザ側の
     古いキャッシュが残らないよう、CACHE_VERSION の数字を1つ上げて
     公開してください。
   ========================================================================== */
"use strict";

var CACHE_VERSION = "v1";
var CACHE_NAME = "gkentei-quiz-" + CACHE_VERSION;

var CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-192.png",
  "./icons/icon-maskable-512.png"
];

/* 問題データファイル一覧（basic 8ファイル + mock 8ファイル = 16ファイル） */
var QUESTION_ASSETS = [
  "./questions/basic/ch1.js",
  "./questions/basic/ch2.js",
  "./questions/basic/ch3.js",
  "./questions/basic/ch4.js",
  "./questions/basic/ch5.js",
  "./questions/basic/ch6.js",
  "./questions/basic/ch7.js",
  "./questions/basic/ch8.js",
  "./questions/mock/ch1.js",
  "./questions/mock/ch2.js",
  "./questions/mock/ch3.js",
  "./questions/mock/ch4.js",
  "./questions/mock/ch5.js",
  "./questions/mock/ch6.js",
  "./questions/mock/ch7.js",
  "./questions/mock/ch8.js"
];

self.addEventListener("install", function (event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(CORE_ASSETS).then(function () {
        return Promise.allSettled(
          QUESTION_ASSETS.map(function (url) { return cache.add(url); })
        );
      });
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys
          .filter(function (k) { return k.indexOf("gkentei-quiz-") === 0 && k !== CACHE_NAME; })
          .map(function (k) { return caches.delete(k); })
      );
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (event) {
  var req = event.request;
  if (req.method !== "GET") return;

  event.respondWith(
    caches.match(req).then(function (cached) {
      var network = fetch(req)
        .then(function (res) {
          if (res && res.status === 200 && res.type === "basic") {
            var copy = res.clone();
            caches.open(CACHE_NAME).then(function (cache) { cache.put(req, copy); });
          }
          return res;
        })
        .catch(function () { return cached; });
      return cached || network;
    })
  );
});
