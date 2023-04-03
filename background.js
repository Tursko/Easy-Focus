const redirectUrl = chrome.runtime.getURL("focus.html");

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
        chrome.storage.sync.get("restrictedSites").then( (result) => {
            let aRestrictedSites = JSON.parse(result.restrictedSites);
            if (isFocusActive && tab.url)
            {
                aRestrictedSites.forEach(url => {
                    let regex = new RegExp(url, "g")
                    if (tab.url.search(regex) >= 0) {
                        chrome.tabs.update(tab.id, { url: redirectUrl });
                    }
                });
            }          
        });
    });
}