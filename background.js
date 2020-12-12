// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.


const channel = new BroadcastChannel("my-channel");

chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.tabs.create({url:chrome.extension.getURL("index.html")});
  });

channel.addEventListener("message", e => {
  if (e.data === "Ready") {
    chrome.tabs.query({}, (a) => channel.postMessage(a));
  } else {
    const chngs = e.data;
    for (let i=0; i < chngs.length; ++i) {
      chrome.tabs.move(parseInt(chngs[i].tabId), chngs[i].moveProperties);
    }
  }
})
