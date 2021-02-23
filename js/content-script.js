// Date.now hack
if (!Date.now) {
	Date.now = function(){
		return (new Date()).getTime();
	};
}

function getCurrentScrollInfo() {
    debugger
    var contentHeight = document.body.clientHeight,
        scrollTop = document.documentElement.scrollTop,
        scrollPercent = (scrollTop / contentHeight).toFixed(4)

    console.log(contentHeight, scrollTop, scrollPercent)
    return {contentHeight, scrollTop, scrollPercent}
}


// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function (request, sender, response) {
    var scrollInfo = getCurrentScrollInfo()
    response(scrollInfo);
});

// after loaded get history
window.onload = function() {
    chrome.storage.sync.get([window.location.href], function(result) {
        console.log('scroll history: ', result)
        if(JSON.stringify(result) === '{}') return; // without scroll history
        var historyScrollInfo = JSON.parse(result[window.location.href]),
            currentScrollInfo = getCurrentScrollInfo();

            // current page scroll progress equal the value saved in storage， return
        if(historyScrollInfo.scrollPercent == currentScrollInfo.scrollPercent) return;

        var r = confirm('The furthest read position is '+ (historyScrollInfo.scrollPercent * 100).toFixed(2) + '% at ' + new Date(historyScrollInfo.timeStamp || Date.now()).toLocaleString() + '. Go to that page position?');
        if(r == true) {
            document.documentElement.scrollTop = currentScrollInfo.contentHeight * historyScrollInfo.scrollPercent;
        } else {

        }
    })
}