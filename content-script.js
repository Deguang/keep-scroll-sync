// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function (request, sender, response) {
    var contentHeight = document.body.clientHeight,
        scrollTop = document.documentElement.scrollTop,
        scrollPercent = (contentHeight / scrollTop * 100).toFixed(2) + '%'

    console.log(contentHeight, scrollTop, scrollPercent)
    response({contentHeight, scrollTop, scrollPercent});
});

// after loaded get history
//document.addEventListener