// Local Storage
//const aLocalStorageUrlList = JSON.parse(localStorage.getItem(browserUrlListId));

let aRestrictedSites = [];

let show = "";
let hide = "none";

const redirectUrl = chrome.runtime.getURL("focus.html");

// DOM Constants
const enableFocusBtn = document.getElementById("enableFocusBtn");
const disableFocusBtn = document.getElementById("disableFocusBtn");

const addUrlBtn = document.getElementById("addUrlBtn");
const inputUrl = document.getElementById("inputUrl");
const ulUrls = document.getElementById("ulUrls");

/*-------------------- Popup Load --------------------*/
function popupLoad() {
    chrome.storage.local.get("focusEnabled").then((result) => {
        let focusEnabled = result.focusEnabled;
        if (focusEnabled) {
            hidePopupElements();
        } else {
            showPopupElements();
        }
    });
}

/*-------------------- Focus Mode --------------------*/
function enableFocusMode() {
    chrome.storage.local.set({ focusEnabled: true }).then( () => {     
        hidePopupElements();
        refreshCurrentTab();
    });
}

function disableFocusMode() {
    chrome.storage.local.set({ focusEnabled: false }).then( () => {
        showPopupElements();
    });
}

function refreshCurrentTab() {
    let queryOptions = { active: true, lastFocusedWindow: true };
    chrome.tabs.query(queryOptions).then( (tabs) => {
        if (tabs[0].url) {
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
    addUrlBtn.style.display = hide;
}

function showPopupElements() {
    enableFocusBtn.style.display = show;
    disableFocusBtn.style.display = hide;
    inputUrl.style.display = show;
    addUrlBtn.style.display = show;

}

addUrlBtn.addEventListener("click", function() {
    if (inputUrl.value != "") {
        aRestrictedSites.push(inputUrl.value);
        inputUrl.value = "";
    }
    updateChromeStorageRestrictedSites();
    renderUrlList();
});

function renderUrlList () {
    let urlInnerHtml = '';
    for (let i = 0; i < aRestrictedSites.length; i++) {
        urlInnerHtml += `<li>${aRestrictedSites[i]}</li>`;
    }

    ulUrls.innerHTML = urlInnerHtml;
}

function updateChromeStorageRestrictedSites () {
    chrome.storage.sync.set({ restrictedSites: JSON.stringify(aRestrictedSites) });
}

/*-------------------- Event Listeners --------------------*/
document.addEventListener('DOMContentLoaded', popupLoad);
enableFocusBtn.addEventListener("click", enableFocusMode);
disableFocusBtn.addEventListener("click", disableFocusMode);