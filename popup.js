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

const listDiv = document.getElementById("listDiv");
const ulUrls = document.getElementById("ulUrls");

const sessionDiv = document.getElementById("sessionDiv");
const popupSessionTime = document.getElementById("popupSessionTime");
const resetTimerBtn = document.getElementById("resetTimerBtn");
const pauseResumeBtn = document.getElementById("pauseResumeBtn");

let sessionStart = null;
let sessionInterval = null;
let sessionAccumulatedMs = 0;
let sessionPaused = false;

function formatElapsed(ms) {
  let totalSeconds = Math.floor(ms / 1000);
  let hours = Math.floor(totalSeconds / 3600);
  let minutes = Math.floor((totalSeconds % 3600) / 60);
  let seconds = totalSeconds % 60;
  if (hours >= 24) {
    return "24h+";
  }
  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
  }
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

// Paused or not started -> just the accumulated time.
// Running -> accumulated plus the time since the current segment started.
function computeElapsedMs(accumulatedMs, start, paused) {
  let acc = accumulatedMs || 0;
  if (paused || !start) {
    return acc;
  }
  return acc + (Date.now() - start.getTime());
}

function renderSessionTime() {
  let elapsed = formatElapsed(computeElapsedMs(sessionAccumulatedMs, sessionStart, sessionPaused));
  popupSessionTime.textContent = sessionPaused ? `${elapsed} (Paused)` : elapsed;
}

function renderPauseButton() {
  pauseResumeBtn.textContent = sessionPaused ? "▶ Resume" : "⏸ Pause";
}

function startSessionTimer() {
  chrome.storage.local
    .get(["focusSessionStart", "focusSessionAccumulatedMs", "focusSessionPaused"])
    .then((result) => {
      sessionStart = result.focusSessionStart ? new Date(result.focusSessionStart) : null;
      sessionAccumulatedMs = result.focusSessionAccumulatedMs || 0;
      sessionPaused = !!result.focusSessionPaused;
      renderPauseButton();
      if (sessionInterval) clearInterval(sessionInterval);
      // The interval keeps running while paused, but the rendered value stays frozen.
      sessionInterval = setInterval(renderSessionTime, 1000);
      renderSessionTime();
    });
}

function stopSessionTimer() {
  if (sessionInterval) {
    clearInterval(sessionInterval);
    sessionInterval = null;
  }
  sessionStart = null;
  sessionAccumulatedMs = 0;
  sessionPaused = false;
  popupSessionTime.textContent = "0m 00s";
  resetTimerBtn.style.display = hide;
  pauseResumeBtn.style.display = hide;
}

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

  getRestrictedSites().then((aSyncedSites) => {
    aSyncedSites.forEach((url) => {
      aRestrictedSites.push(url);
    });
  });
}

/*-------------------- Focus Mode --------------------*/
function enableFocusMode() {
  chrome.storage.local
    .set({
      focusEnabled: true,
      focusSessionStart: new Date().toISOString(),
      focusSessionAccumulatedMs: 0,
      focusSessionPaused: false,
    })
    .then(() => {
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
        aRestrictedSites.forEach((url) => {
          let regex = new RegExp(url, "gi");
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
  addCurrentSiteBtn.style.display = show;
  sessionDiv.style.display = show;
  inputDiv.style.display = hide;
  listDiv.style.display = hide;
  ulUrls.style.display = hide;
  resetTimerBtn.style.display = show;
  pauseResumeBtn.style.display = show;
  startSessionTimer();
}

function showPopupElements() {
  enableFocusBtn.style.display = show;
  disableFocusBtn.style.display = hide;
  addCurrentSiteBtn.style.display = hide;
  sessionDiv.style.display = hide;
  inputDiv.style.display = show;
  ulUrls.style.display = show;
  stopSessionTimer();
  renderUrlList();
}

function addUrl(url = null) {
  let siteToAdd = url ?? inputUrl.value;

  let bAlreadyAdded = aRestrictedSites.some(
    (site) => site.toLowerCase() === siteToAdd.toLowerCase()
  );

  if (siteToAdd != "" && !bAlreadyAdded) {
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
  Promise.all([getRestrictedSites(), chrome.storage.local.get("focusEnabled")]).then(([aRestrictedSites, result]) => {
    ulUrls.innerHTML = "";
    listDiv.style.display = aRestrictedSites.length > 0 && !result.focusEnabled ? show : hide;
    aRestrictedSites.forEach((url) => {
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
  chrome.storage.sync.set({
    restrictedSites: JSON.stringify(aRestrictedSites),
  });
}

/*-------------------- Hold to Disable --------------------*/
const HOLD_DURATION = 10000;
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

/*-------------------- Reset Timer Button --------------------*/
resetTimerBtn.textContent = "↺ Reset";

function resetSessionTimer() {
  chrome.storage.local
    .set({
      focusSessionStart: new Date().toISOString(),
      focusSessionAccumulatedMs: 0,
      focusSessionPaused: false,
    })
    .then(() => {
      startSessionTimer();
    });
}

resetTimerBtn.addEventListener("click", resetSessionTimer);

/*-------------------- Pause / Resume Button --------------------*/
function togglePauseResume() {
  // Re-read from storage rather than trusting the in-memory copy, which another
  // popup or a reset may have made stale.
  chrome.storage.local
    .get(["focusSessionStart", "focusSessionAccumulatedMs", "focusSessionPaused"])
    .then((result) => {
      if (result.focusSessionPaused) {
        return chrome.storage.local.set({
          focusSessionStart: new Date().toISOString(),
          focusSessionPaused: false,
        });
      }

      let start = result.focusSessionStart ? new Date(result.focusSessionStart) : null;
      return chrome.storage.local.set({
        focusSessionAccumulatedMs: computeElapsedMs(result.focusSessionAccumulatedMs, start, false),
        focusSessionPaused: true,
      });
    })
    .then(() => {
      startSessionTimer();
    });
}

pauseResumeBtn.addEventListener("click", togglePauseResume);

/*-------------------- Event Listeners --------------------*/
document.addEventListener("DOMContentLoaded", popupLoad);
enableFocusBtn.addEventListener("click", enableFocusMode);
