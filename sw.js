/* ==========================================================================
   G検定完全攻略ロードマップ - Service Worker
   --------------------------------------------------------------------------
   ・アプリの外枠（top.html、manifest、アイコン）はインストール時に
     必ずキャッシュし、オフラインでもトップページが開けるようにします。
   ・個別の記事HTML（gkentei-ch1-01-... など）は、まだ存在しないものが
     あってもインストールが失敗しないよう、失敗を許容して読み込みます。
     一度開いた記事は、閲覧時に自動でキャッシュに追加されます（下記の
     fetch ハンドラ参照）。
   ・章番号や記事ファイル名が変わったときは、CACHE_VERSION の数字だけ
     を1つ上げてください。古いキャッシュは自動的に削除されます。
   ========================================================================== */
"use strict";

var CACHE_VERSION = "v1";
var CACHE_NAME = "gkentei-roadmap-" + CACHE_VERSION;

/* 起動時に必ずキャッシュしたい「アプリの外枠」 */
var CORE_ASSETS = [
  "./",
  "./top.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-192.png",
  "./icons/icon-maskable-512.png"
];

/* 現時点で作成済み・作成予定の記事HTML一覧。
   ★ 新しい記事を作成したら、ここにファイル名を追記してください。
      （追記しなくてもアプリの動作自体には影響しません。
        追記すると「初回オフライン時」から読めるようになります） */
var ARTICLE_ASSETS = [
  "./gkentei-overview-01.html",
  "./gkentei-overview-02.html",
  "./gkentei-basic-mock-03.html",
  "./gkentei-time-04.html",
  "./gkentei-history-05.html",
  "./gkentei-ch1-01-what-is-ai-reader-style.html",
  "./gkentei-ch1-02-strong-weak-ai-reader-style.html"
];

self.addEventListener("install", function (event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(CORE_ASSETS).then(function () {
        /* 記事ファイルは、存在しないものがあっても install を失敗させない */
        return Promise.allSettled(
          ARTICLE_ASSETS.map(function (url) {
            return cache.add(url);
          })
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
          .filter(function (k) { return k.indexOf("gkentei-roadmap-") === 0 && k !== CACHE_NAME; })
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
      /* キャッシュがあれば即座に返しつつ、裏で最新版を取得・更新する
         （記事を開くたびに自動でオフライン用キャッシュが増えていきます） */
      return cached || network;
    })
  );
});
