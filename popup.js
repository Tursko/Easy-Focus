// Globals
const browserUrlListId = 'urlList';
// Local Storage
const aLocalStorageUrlList = JSON.parse(localStorage.getItem(browserUrlListId));

var aRestrictedSites = ["theverge.com"];
let aUrlList = [];

let redirectUrl = "https://google.com";

// DOM Constants
const enableFocusBtn = document.getElementById("enableFocusBtn");
const disableFocusBtn = document.getElementById("disableFocusBtn");

const addUrlBtn = document.getElementById("addUrlBtn");
const inputUrl = document.getElementById("inputUrl");
const ulUrls = document.getElementById("ulUrls");

if (aLocalStorageUrlList) {
    aUrlList = aLocalStorageUrlList;
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
        aUrlList.push(inputUrl.value);
        inputUrl.value = "";
    }
    updateLocalStorageUrlList();
    renderUrlList();
});

function renderUrlList () {
    let urlInnerHtml = '';
    for (let i = 0; i < aUrlList.length; i++) {
        urlInnerHtml += `<li>${aUrlList[i]}</li>`;
    }

    ulUrls.innerHTML = urlInnerHtml;
}

function updateLocalStorageUrlList () {
    localStorage.setItem(browserUrlListId, JSON.stringify(aUrlList));
}