chrome.browserAction.onClicked.addListener(function (tab) {
  chrome.tabs.create({'url': chrome.extension.getURL('index.html')}, function (tab) {
  });
<<<<<<< HEAD
});
=======
});
>>>>>>> 36a226a2983528b61dca93d7152d85460db743d3
