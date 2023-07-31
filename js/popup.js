function setContent(querySelector, value) {
    document.querySelector(querySelector).innerHtml += value
}

// Date.now hack
if (!Date.now) {
	Date.now = function(){
		return (new Date()).getTime();
	};
}

const saveBtn = document.querySelector('.save-scroll');
// save scroll history
saveBtn.addEventListener('click', function(){
// window.addEventListener('DOMContentLoaded', function () {
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
                // Object.keys(response).forEach(function(item) {
                //     console.log(item, response[item])
                //     setContent('.' + item, response[item])
                // });
                chrome.storage.sync.set({
                    [url]: JSON.stringify({id, title, favIconUrl, timeStamp: Date.now(), ...response})
                }, function() {
                    saveBtn.innerHTML = 'Scroll position saved';
                    console.log('Scroll position saved~!');
                    setTimeout( // reset button content
                        () => {saveBtn.innerHTML = 'Save scroll position'},
                        1000
                    )
                });
            }
        );
    });
});

const delBtn = document.querySelector('.del-scroll');
// delete scroll hisotry
delBtn.addEventListener('click', function() {
    // ...query for the active tab...
    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, function (tabs) {
        chrome.storage.sync.remove(tabs[0].url, function() {
            delBtn.innerHTML = 'Del history done~!';
            console.log('Page scroll history removed~!');
            setTimeout( // reset button content
                () => {delBtn.innerHTML = 'Del scroll history'},
                1000
            )
        })
    })
})

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