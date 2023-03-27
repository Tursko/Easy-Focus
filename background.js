const redirectUrl = chrome.runtime.getURL("focus.html");

// TODO: remove PoC
let aUrlList = ["https://www.theverge.com/"];

// Tab updates (trying to navigate to a new site)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.url) {
        console.log(changeInfo);
        if (aUrlList.includes(changeInfo.url)) {
            chrome.tabs.update(tab.id, { url: redirectUrl});
        }
    }
});

// Tab swaps (new active tab)
chrome.tabs.onActivated.addListener(async (activeInfo) => {
    chrome.tabs.get(activeInfo.tabId, function(tab) {
        if (aUrlList.includes(tab.url)) {
            chrome.tabs.update(tab.id, { url: redirectUrl});
        }
    });
});