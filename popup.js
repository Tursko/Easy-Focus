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
const addUrlBtn = document.getElementById("addUrlBtn");

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
    ulUrls.style.display = hide;

    inputUrl.style.display = hide;
    addUrlBtn.style.display = hide;
}

function showPopupElements() {
    enableFocusBtn.style.display = show;
    disableFocusBtn.style.display = hide;
    ulUrls.style.display = show;

    inputUrl.style.display = show;
    addUrlBtn.style.display = show;
}

addUrlBtn.addEventListener("click", function () {
    if (inputUrl.value != "") {
        aRestrictedSites.push(inputUrl.value);
        inputUrl.value = "";
    }
    updateChromeStorageRestrictedSites();
    renderUrlList();
});

function renderUrlList() {
    getRestrictedSites().then((aRestrictedSites) => {
        ulUrls.innerHTML = ''; // Clear all items from the visual list
        aRestrictedSites.forEach(url => {
            let li = document.createElement("li");
            let liText = document.createTextNode(url);

            let liRemoveButton = document.createElement('button');
            liRemoveButton.innerText = 'X';
            liRemoveButton.addEventListener("click", event => onClickRemoveUrl(li, url));

            li.appendChild(liText);
            li.appendChild(liRemoveButton);

            ulUrls.appendChild(li);
        });
    });
}

function onClickRemoveUrl(li, url) {
    var iIndex = aRestrictedSites.indexOf(url);
    if (iIndex > -1) {
        aRestrictedSites.splice(iIndex, 1);
    }

    updateChromeStorageRestrictedSites();
    renderUrlList();
}

function test(test) {
    console.log(test);
}

function updateChromeStorageRestrictedSites() {
    chrome.storage.sync.set({ restrictedSites: JSON.stringify(aRestrictedSites) });
}


/*-------------------- Event Listeners --------------------*/
document.addEventListener('DOMContentLoaded', popupLoad);
enableFocusBtn.addEventListener("click", enableFocusMode);
disableFocusBtn.addEventListener("click", disableFocusMode);