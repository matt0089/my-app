// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.


const channel = new BroadcastChannel("my-channel");

chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.tabs.create({url:chrome.extension.getURL("index.html")});

    setTimeout(() => {
      chrome.tabs.query({}, (a) => channel.postMessage(a))
    }, 4000);

  });

channel.addEventListener("message", e => {
  const chngs = e.data;

  for (let i=0; i < chngs.length; ++i) {
    chrome.tabs.move(parseInt(chngs[i].tabId), chngs[i].moveProperties);
  }
})
