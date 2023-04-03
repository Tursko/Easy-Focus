// Globals
const browserUrlListId = 'urlList';
// Local Storage
const aLocalStorageUrlList = JSON.parse(localStorage.getItem(browserUrlListId));

let aRestrictedSites = [];

// DOM Constants
const enableFocusBtn = document.getElementById("enableFocusBtn");
const disableFocusBtn = document.getElementById("disableFocusBtn");

const addUrlBtn = document.getElementById("addUrlBtn");
const inputUrl = document.getElementById("inputUrl");
const ulUrls = document.getElementById("ulUrls");

if (aLocalStorageUrlList) {
    aRestrictedSites = aLocalStorageUrlList;
    renderUrlList();
}

enableFocusBtn.addEventListener("click", function() {
    chrome.storage.local.set({ focusEnabled: true });
});

disableFocusBtn.addEventListener("click", function() { 
    chrome.storage.local.set({ focusEnabled: false });
});

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

function updateLocalStorageUrlList () {
    localStorage.setItem(browserUrlListId, JSON.stringify(aRestrictedSites));
}

function updateChromeStorageRestrictedSites () {
    chrome.storage.sync.set({ restrictedSites: JSON.stringify(aRestrictedSites) });
}