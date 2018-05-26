function setContent(querySelector, value) {
    document.querySelector(querySelector).innerHtml += value
}

// Once the DOM is ready...
window.addEventListener('DOMContentLoaded', function () {
    // ...query for the active tab...
    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, function (tabs) {
        // ...and send a request for the DOM info...
        const {id, title, url, favIconUrl} = tabs[0]
        chrome.tabs.sendMessage(
            tabs[0].id,
            {},
            // ...also specifying a callback to be called
            //    from the receiving end (content script)
            function(response){
                console.log('response', response)
                Object.keys(response).forEach(function(item) {
                    console.log(item, response[item])
                    setContent('.' + item, response[item])
                });
                chrome.storage.sync.set({[url]:
                    JSON.stringify({id, title, url, favIconUrl, ...response})}, function() {
                    console.log('page scroll saved~')
                })
            });
        }
    );
});

chrome.storage.onChanged.addListener(function(changes, namespace) {
    for (key in changes) {
      var storageChange = changes[key];
      console.log('存储键“%s”（位于“%s”命名空间中）已更改。' +
                      '原来的值为“%s”，新的值为“%s”。',
                  key,
                  namespace,
                  storageChange.oldValue,
                  storageChange.newValue);
    }
  });