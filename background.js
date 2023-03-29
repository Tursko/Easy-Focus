const redirectUrl = chrome.runtime.getURL("focus.html");

// TODO: remove PoC
var aUrlList = ["https://www.theverge.com/"];

// Site navigation
chrome.tabs.onUpdated.addListener( (tabId, changeInfo, tab) => {
        redirectTab(tab);
});

// Tab switch
chrome.tabs.onActivated.addListener( (activeInfo) => {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
        redirectTab(tab);
    });
});

function redirectTab(tab) {
    chrome.storage.local.get("focusEnabled").then( (result) => {
        let isFocusActive = result.focusEnabled;
        if (isFocusActive && tab.url)
        {
            aUrlList.forEach(url => {
                var regex = new RegExp(url, "g")
                if (tab.url.search(regex) >= 0) {
                    chrome.tabs.update(tab.id, { url: redirectUrl });
                }
            });
        }
    });
}