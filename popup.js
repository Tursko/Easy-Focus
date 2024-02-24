// Local Storage
//const aLocalStorageUrlList = JSON.parse(localStorage.getItem(browserUrlListId));

let aRestrictedSites = [];

const show = "";
const hide = "none";

const redirectUrl = chrome.runtime.getURL("focus.html");

// DOM Constants
const enableFocusBtn = document.getElementById("enableFocusBtn");
const disableFocusBtn = document.getElementById("disableFocusBtn");

const inputUrl = document.getElementById("inputUrl");
const removeUrl = document.getElementById("removeUrl");
const addUrlBtn = document.getElementById("addUrlBtn");
const removeUrlBtn = document.getElementById("removeUrlBtn");

const ulUrls = document.getElementById("ulUrls");

/*-------------------- Popup Load --------------------*/
function popupLoad() {
    chrome.storage.local.get("focusEnabled").then((result) => {
        let focusEnabled = result.focusEnabled;
        if (focusEnabled) {
            hidePopupElements();
            renderUrlList();
        } else {
            showPopupElements();
            renderUrlList();
        }
    });

    getRestrictedSites().then((aSyncedSites) => {
        aSyncedSites.forEach(url => {
            aRestrictedSites.push(url);
        });
    });
}

/*-------------------- Focus Mode --------------------*/
function enableFocusMode() {
    chrome.storage.local.set({ focusEnabled: true }).then(() => {
        hidePopupElements();
        refreshCurrentTab();
    });
}

function disableFocusMode() {
    chrome.storage.local.set({ focusEnabled: false }).then(() => {
        showPopupElements();
    });
}

function refreshCurrentTab() {
    let queryOptions = { active: true, lastFocusedWindow: true };
    chrome.tabs.query(queryOptions).then((tabs) => {
        if (tabs.length > 0 && tabs[0].url) {
            let currentTab = tabs[0];
            getRestrictedSites().then((aRestrictedSites) => {
                aRestrictedSites.forEach(url => {
                    let regex = new RegExp(url, "g")
                    if (currentTab.url.search(regex) >= 0) {
                        chrome.tabs.update(currentTab.id, { url: redirectUrl });
                    }
                });
            });
        }
    });
}

async function getRestrictedSites() {
    let result = await chrome.storage.sync.get("restrictedSites");
    return JSON.parse(result.restrictedSites);
}

function hidePopupElements() {
    enableFocusBtn.style.display = hide;
    disableFocusBtn.style.display = show;
    
    inputUrl.style.display = hide;
    removeUrl.style.display = show;
    addUrlBtn.style.display = hide;
    removeUrlBtn.style.display = show;
}

function showPopupElements() {
    enableFocusBtn.style.display = show;
    disableFocusBtn.style.display = hide;
    
    inputUrl.style.display = show;
    removeUrl.style.display = hide;
    addUrlBtn.style.display = show;
    removeUrlBtn.style.display = hide;
}

addUrlBtn.addEventListener("click", function () {
    if (inputUrl.value != "") {
        aRestrictedSites.push(inputUrl.value);
        inputUrl.value = "";
    }
    updateChromeStorageRestrictedSites();
    renderUrlList();
});

removeUrlBtn.addEventListener("click", function () {
    var iIndex = aRestrictedSites.indexOf(removeUrl.value)
    if (iIndex > -1) {
        aRestrictedSites.splice(iIndex, 1);
    }
    removeUrl.value = "";

    updateChromeStorageRestrictedSites();
    renderUrlList();
});

function renderUrlList() {
    getRestrictedSites().then((aRestrictedSites) => {
        let urlInnerHtml = '';
        aRestrictedSites.forEach(url => {
            urlInnerHtml += `<li>${url}</li>`;
        });
        ulUrls.innerHTML = urlInnerHtml;
    });
}

function updateChromeStorageRestrictedSites() {
    chrome.storage.sync.set({ restrictedSites: JSON.stringify(aRestrictedSites) });
}

/*-------------------- Event Listeners --------------------*/
document.addEventListener('DOMContentLoaded', popupLoad);
enableFocusBtn.addEventListener("click", enableFocusMode);
disableFocusBtn.addEventListener("click", disableFocusMode);