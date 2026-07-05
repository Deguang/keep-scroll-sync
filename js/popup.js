// Date.now hack
if (!Date.now) {
	Date.now = function(){
		return (new Date()).getTime();
	};
}

var t = function(key, subs) { return chrome.i18n.getMessage(key, subs); };

// Localize any element carrying a data-i18n key, using _locales messages.
document.querySelectorAll('[data-i18n]').forEach(function(el) {
    var msg = t(el.getAttribute('data-i18n'));
    if (msg) el.textContent = msg;
});

const saveBtn = document.querySelector('.save-scroll');
const delBtn = document.querySelector('.del-scroll');
const listEl = document.querySelector('.saved-list');

// ---- Saved-pages list (like a table of contents) ----

// Format a stored scrollPercent ("0.4250") into a display string ("43%").
function formatPercent(scrollPercent) {
    var n = parseFloat(scrollPercent);
    if (isNaN(n)) n = 0;
    return Math.round(n * 100) + '%';
}

// Build one list row for a saved page.
function buildItem(url, info) {
    var item = document.createElement('div');
    item.className = 'item';
    item.title = url;

    var favicon = document.createElement('img');
    favicon.className = 'favicon';
    favicon.src = info.favIconUrl || 'images/logo_16.png';
    favicon.addEventListener('error', function() { favicon.src = 'images/logo_16.png'; });

    var meta = document.createElement('div');
    meta.className = 'meta';
    var titleEl = document.createElement('div');
    titleEl.className = 'item-title';
    titleEl.textContent = info.title || url;
    var urlEl = document.createElement('div');
    urlEl.className = 'item-url';
    urlEl.textContent = url;
    meta.appendChild(titleEl);
    meta.appendChild(urlEl);

    var pct = document.createElement('span');
    pct.className = 'pct';
    pct.textContent = formatPercent(info.scrollPercent);

    var remove = document.createElement('button');
    remove.className = 'remove';
    remove.textContent = '×'; // ×
    remove.title = t('removeTitle');
    remove.addEventListener('click', function(e) {
        e.stopPropagation();
        chrome.storage.sync.remove(url, renderList);
    });

    // Open (or focus) the saved page; the content script offers to restore on load.
    item.addEventListener('click', function() {
        chrome.tabs.query({ url: url }, function(tabs) {
            if (!chrome.runtime.lastError && tabs && tabs.length) {
                chrome.tabs.update(tabs[0].id, { active: true });
                chrome.windows.update(tabs[0].windowId, { focused: true });
            } else {
                chrome.tabs.create({ url: url });
            }
            window.close();
        });
    });

    item.appendChild(favicon);
    item.appendChild(meta);
    item.appendChild(pct);
    item.appendChild(remove);
    return item;
}

// Render all saved pages, most recently saved first.
function renderList() {
    chrome.storage.sync.get(null, function(items) {
        listEl.innerHTML = '';
        var entries = Object.keys(items || {}).map(function(url) {
            try { return { url: url, info: JSON.parse(items[url]) }; }
            catch (e) { return null; }
        }).filter(Boolean);

        if (!entries.length) {
            var empty = document.createElement('div');
            empty.className = 'empty';
            empty.textContent = t('listEmpty');
            listEl.appendChild(empty);
            return;
        }

        entries.sort(function(a, b) {
            return (b.info.timeStamp || 0) - (a.info.timeStamp || 0);
        });
        entries.forEach(function(entry) {
            listEl.appendChild(buildItem(entry.url, entry.info));
        });
    });
}

// ---- Current-page actions ----

// save scroll history for the active tab
saveBtn.addEventListener('click', function(){
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        const {id, title, url, favIconUrl} = tabs[0]
        chrome.tabs.sendMessage(tabs[0].id, {}, function(response){
            // sendMessage fails on pages with no content script (chrome://, PDF viewer, etc.)
            if (chrome.runtime.lastError || !response) {
                saveBtn.innerHTML = t('saveBtnError');
                console.warn('Save failed:', chrome.runtime.lastError && chrome.runtime.lastError.message);
                setTimeout(() => { saveBtn.innerHTML = t('saveBtn'); }, 1500);
                return;
            }
            chrome.storage.sync.set({
                [url]: JSON.stringify({id, title, favIconUrl, timeStamp: Date.now(), ...response})
            }, function() {
                // set can fail when sync storage quota is exceeded.
                if (chrome.runtime.lastError) {
                    saveBtn.innerHTML = t('saveBtnError');
                    console.warn('Save failed:', chrome.runtime.lastError.message);
                    setTimeout(() => { saveBtn.innerHTML = t('saveBtn'); }, 1500);
                    return;
                }
                saveBtn.innerHTML = t('saveBtnSaved');
                setTimeout(() => { saveBtn.innerHTML = t('saveBtn'); }, 1000);
                renderList();
            });
        });
    });
});

// delete scroll history for the active tab
delBtn.addEventListener('click', function() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.storage.sync.remove(tabs[0].url, function() {
            delBtn.innerHTML = t('delBtnDone');
            setTimeout(() => { delBtn.innerHTML = t('delBtn'); }, 1000);
            renderList();
        });
    });
});

renderList();
