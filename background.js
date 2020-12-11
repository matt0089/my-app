// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.tabs.create({url:chrome.extension.getURL("index.html")});

    const channel = new BroadcastChannel("my-channel");
    
    setTimeout(() => {
      chrome.tabs.query({}, (a) => channel.postMessage(a))
    }, 4000);

  });
