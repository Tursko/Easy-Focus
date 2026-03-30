let aRestrictedSites = [];

const show = "";
const hide = "none";

const redirectUrl = chrome.runtime.getURL("focus.html");

// DOM Constants
const enableFocusBtn = document.getElementById("enableFocusBtn");
const disableFocusBtn = document.getElementById("disableFocusBtn");
const addCurrentSiteBtn = document.getElementById("addCurrentSiteBtn");

const inputDiv = document.getElementById("inputDiv");
const inputUrl = document.getElementById("inputUrl");
const addUrlBtn = document.getElementById("addUrlBtn");

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
        renderUrlList();
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
    return result.restrictedSites ? JSON.parse(result.restrictedSites) : [];
}

function hidePopupElements() {
    enableFocusBtn.style.display = hide;
    disableFocusBtn.style.display = show;
    addCurrentSiteBtn.style.display = show;
    inputDiv.style.display = hide;
    ulUrls.style.display = hide;
}

function showPopupElements() {
    enableFocusBtn.style.display = show;
    disableFocusBtn.style.display = hide;
    addCurrentSiteBtn.style.display = hide;
    inputDiv.style.display = show;
    ulUrls.style.display = show;
}

function addUrl(url = null) {
    let siteToAdd = url ?? inputUrl.value;

    if (siteToAdd != "" && !aRestrictedSites.includes(siteToAdd)) {
        aRestrictedSites.push(siteToAdd);
    }

    inputUrl.value = "";

    updateChromeStorageRestrictedSites();
    renderUrlList();
}

addUrlBtn.addEventListener("click", () => addUrl());
inputUrl.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
        addUrl();
    }
});

function addCurrentSite() {
    let queryOptions = { active: true, lastFocusedWindow: true };
    chrome.tabs.query(queryOptions).then((tabs) => {
        if (tabs.length > 0 && tabs[0].url) {
            let hostname = new URL(tabs[0].url).hostname;
            if (hostname) {
                addUrl(hostname);
            }
            refreshCurrentTab();
        }
    });
}

addCurrentSiteBtn.addEventListener("click", addCurrentSite);

function renderUrlList() {
    getRestrictedSites().then((aRestrictedSites) => {
        ulUrls.innerHTML = '';
        aRestrictedSites.forEach(url => {
            let li = document.createElement("li");
            let liText = document.createTextNode(url);

            let liRemoveButton = document.createElement("button");
            liRemoveButton.className = "btn btn-remove";
            liRemoveButton.textContent = "✕";
            liRemoveButton.addEventListener("click", () => onClickRemoveUrl(li, url));

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

function updateChromeStorageRestrictedSites() {
    chrome.storage.sync.set({ restrictedSites: JSON.stringify(aRestrictedSites) });
}

/*-------------------- Hold to Disable --------------------*/
const HOLD_DURATION = 7000;
const HOLD_INTERVAL = 50;
const disableDefaultText = "Hold to Disable";

let holdTimer = null;
let holdStart = null;

disableFocusBtn.textContent = disableDefaultText;

function startHold() {
    holdStart = Date.now();
    disableFocusBtn.style.color = "#fafafa";
    holdTimer = setInterval(() => {
        let elapsed = Date.now() - holdStart;
        let progress = Math.min(elapsed / HOLD_DURATION, 1);
        let percent = Math.round(progress * 100);
        let secondsLeft = Math.ceil((HOLD_DURATION - elapsed) / 1000);

        disableFocusBtn.style.setProperty("--hold-progress", percent + "%");
        disableFocusBtn.textContent = "Hold... " + secondsLeft + "s";

        if (progress >= 1) {
            resetHold();
            disableFocusMode();
        }
    }, HOLD_INTERVAL);
}

function resetHold() {
    clearInterval(holdTimer);
    holdTimer = null;
    holdStart = null;
    disableFocusBtn.style.setProperty("--hold-progress", "0%");
    disableFocusBtn.textContent = disableDefaultText;
}

disableFocusBtn.addEventListener("mousedown", startHold);
disableFocusBtn.addEventListener("mouseup", resetHold);
disableFocusBtn.addEventListener("mouseleave", resetHold);

/*-------------------- Event Listeners --------------------*/
document.addEventListener('DOMContentLoaded', popupLoad);
enableFocusBtn.addEventListener("click", enableFocusMode);
