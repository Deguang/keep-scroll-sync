// Date.now hack
if (!Date.now) {
	Date.now = function(){
		return (new Date()).getTime();
	};
}

function getCurrentScrollInfo() {
    var doc = document.documentElement,
        contentHeight = doc.scrollHeight,
        scrollTop = doc.scrollTop,
        // The scrollable range is total height minus one viewport.
        scrollable = doc.scrollHeight - doc.clientHeight,
        scrollPercent = scrollable > 0 ? (scrollTop / scrollable).toFixed(4) : '0.0000'

    console.log(contentHeight, scrollTop, scrollPercent)
    return {contentHeight, scrollable, scrollTop, scrollPercent}
}


// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function (request, sender, response) {
    var scrollInfo = getCurrentScrollInfo()
    response(scrollInfo);
});

// Show a non-blocking in-page card asking whether to jump to the saved position.
// onConfirm() is called if the user chooses to jump.
function showRestorePrompt(historyScrollInfo, onConfirm) {
    // Avoid stacking multiple cards.
    var existing = document.getElementById('kss-restore-prompt');
    if (existing) existing.remove();

    var percent = (historyScrollInfo.scrollPercent * 100).toFixed(2);
    var time = new Date(historyScrollInfo.timeStamp || Date.now()).toLocaleString();
    var promptText = chrome.i18n.getMessage('restorePrompt', [percent, time]);

    var card = document.createElement('div');
    card.id = 'kss-restore-prompt';
    // Top-center placement so it reads clearly as an active prompt, not a stray toast.
    card.style.cssText = [
        'position:fixed', 'z-index:2147483647', 'top:20px', 'left:50%',
        'width:360px', 'max-width:calc(100vw - 32px)', 'padding:16px 18px', 'box-sizing:border-box',
        // Tinted surface + accent border so it stands out even on pure-white pages.
        'background:#f2f9f5', 'color:#1f2a26', 'border:1px solid #bfe0cf',
        'border-left:4px solid #2f7d5b', 'border-radius:12px',
        'box-shadow:0 12px 32px rgba(31,42,38,0.22)',
        'font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
        'transform:translate(-50%,-16px)', 'opacity:0',
        'transition:transform .25s ease,opacity .25s ease'
    ].join(';');

    var text = document.createElement('div');
    text.style.cssText = 'margin-bottom:12px;color:#1f2a26;';
    text.textContent = promptText;

    var actions = document.createElement('div');
    actions.style.cssText = 'display:flex;justify-content:flex-end;gap:8px;';

    var btnStyle = 'padding:6px 16px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:500;border:none;outline:none;';
    var ignoreBtn = document.createElement('button');
    ignoreBtn.textContent = chrome.i18n.getMessage('ignore');
    ignoreBtn.style.cssText = btnStyle + 'background:#e0ede6;color:#5a6b62;';
    var jumpBtn = document.createElement('button');
    jumpBtn.textContent = chrome.i18n.getMessage('jump');
    jumpBtn.style.cssText = btnStyle + 'background:#2f7d5b;color:#fff;';

    actions.appendChild(ignoreBtn);
    actions.appendChild(jumpBtn);
    card.appendChild(text);
    card.appendChild(actions);
    document.body.appendChild(card);

    // Trigger the enter animation on the next frame (slides down from the top).
    requestAnimationFrame(function() {
        card.style.transform = 'translate(-50%,0)';
        card.style.opacity = '1';
    });

    var dismissTimer;
    function close() {
        clearTimeout(dismissTimer);
        card.style.transform = 'translate(-50%,-16px)';
        card.style.opacity = '0';
        setTimeout(function() { card.remove(); }, 250);
    }

    ignoreBtn.addEventListener('click', close);
    jumpBtn.addEventListener('click', function() {
        onConfirm();
        close();
    });

    // Auto-dismiss after 10s if the user does nothing.
    dismissTimer = setTimeout(close, 10000);
}

// after loaded get history
window.onload = function() {
    chrome.storage.sync.get([window.location.href], function(result) {
        console.log('scroll history: ', result)
        if(JSON.stringify(result) === '{}') return; // without scroll history
        var historyScrollInfo = JSON.parse(result[window.location.href]),
            currentScrollInfo = getCurrentScrollInfo();

            // current page scroll progress equal the value saved in storage， return
        if(historyScrollInfo.scrollPercent == currentScrollInfo.scrollPercent) return;

        showRestorePrompt(historyScrollInfo, function() {
            document.documentElement.scrollTop = currentScrollInfo.scrollable * historyScrollInfo.scrollPercent;
        });
    })
}