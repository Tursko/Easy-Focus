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
const pauseResumeBtn = document.getElementById("pauseResumeBtn");
const resetTimerBtn = document.getElementById("resetTimerBtn");

let sessionStart = null;
let pausedElapsedTime = null;
let sessionInterval = null;
let isPaused = false;
let pauseTime = null;

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

function updateSessionDisplay() {
  if (isPaused && pausedElapsedTime !== null) {
    popupSessionTime.textContent = "Paused - " + formatElapsed(pausedElapsedTime);
  } else if (sessionStart) {
    popupSessionTime.textContent = formatElapsed(new Date() - sessionStart);
  }
}

function startSessionTimer() {
  chrome.storage.local.get(["focusSessionStart", "sessionPaused", "pauseElapsedTime", "pauseStartTime"]).then((result) => {
    sessionStart = result.focusSessionStart ? new Date(result.focusSessionStart) : null;
    if (result.sessionPaused) {
      isPaused = true;
      pauseTime = result.pauseStartTime ? new Date(result.pauseStartTime) : new Date();
      if (result.pauseElapsedTime !== undefined) {
        pausedElapsedTime = result.pauseElapsedTime;
      } else if (sessionStart) {
        pausedElapsedTime = pauseTime - sessionStart;
      } else {
        pausedElapsedTime = 0;
      }
      pauseResumeBtn.textContent = "Resume";
    } else {
      isPaused = false;
      pausedElapsedTime = null;
      pauseResumeBtn.textContent = "Pause";
    }
    if (sessionInterval) clearInterval(sessionInterval);
    sessionInterval = setInterval(updateSessionDisplay, 1000);
    updateSessionDisplay();
    pauseResumeBtn.style.display = "block";
    resetTimerBtn.style.display = "block";
  });
}

function stopSessionTimer() {
  if (sessionInterval) {
    clearInterval(sessionInterval);
    sessionInterval = null;
  }
  sessionStart = null;
  pausedElapsedTime = null;
  isPaused = false;
  pauseTime = null;
  popupSessionTime.textContent = "0m 00s";
  resetTimerBtn.style.display = "none";
  pauseResumeBtn.style.display = "none";
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
    .set({ focusEnabled: true, focusSessionStart: new Date().toISOString(), sessionPaused: false, pauseStartTime: null, pauseElapsedTime: null })
    .then(() => {
      isPaused = false;
      pausedElapsedTime = null;
      hidePopupElements();
      refreshCurrentTab();
    });
}

function disableFocusMode() {
  chrome.storage.local.set({ focusEnabled: false, sessionPaused: false, pauseStartTime: null, pauseElapsedTime: null }).then(() => {
    stopSessionTimer();
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
          let regex = new RegExp(url, "g");
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

/*-------------------- Pause/Resume Button --------------------*/

function togglePauseSession() {
  chrome.storage.local.get(["sessionPaused", "focusSessionStart", "pauseElapsedTime", "pauseStartTime"]).then((result) => {
    if (!result.sessionPaused) {
      const storedSessionStart = result.focusSessionStart;
      if (!storedSessionStart) {
        return;
      }
      const currentTime = new Date();
      const storedStartDate = new Date(storedSessionStart);
      const elapsedAtPause = currentTime - storedStartDate;
      
      isPaused = true;
      pausedElapsedTime = elapsedAtPause;
      pauseTime = new Date();
      sessionStart = storedStartDate;
      
      chrome.storage.local.set({ 
        sessionPaused: true, 
        pauseStartTime: pauseTime.toISOString(),
        pauseElapsedTime: pausedElapsedTime 
      });
      pauseResumeBtn.textContent = "Resume";
      updateSessionDisplay();
    } else {
      let frozenTime = 0;
      if (result.pauseElapsedTime !== undefined && result.pauseElapsedTime !== null) {
        frozenTime = result.pauseElapsedTime;
      } else if (result.pauseStartTime && result.focusSessionStart) {
        frozenTime = new Date(result.pauseStartTime) - new Date(result.focusSessionStart);
      }
      const newSessionStart = new Date() - frozenTime;
      
      isPaused = false;
      sessionStart = newSessionStart;
      pausedElapsedTime = null;
      pauseTime = null;
      
      chrome.storage.local.set({ 
        sessionPaused: false, 
        pauseStartTime: null,
        pauseElapsedTime: null,
        focusSessionStart: newSessionStart.toISOString()
      });
      pauseResumeBtn.textContent = "Pause";
      updateSessionDisplay();
    }
  });
}

pauseResumeBtn.addEventListener("click", togglePauseSession);

/*-------------------- Reset Timer Button --------------------*/
resetTimerBtn.textContent = "Reset Session";

function resetSessionTimer() {
  isPaused = false;
  pausedElapsedTime = null;
  sessionStart = null;
  chrome.storage.local.set({ 
    focusSessionStart: new Date().toISOString(),
    sessionPaused: false,
    pauseStartTime: null,
    pauseElapsedTime: null
  }).then(() => {
    pauseResumeBtn.textContent = "Pause";
    startSessionTimer();
  });
}

resetTimerBtn.addEventListener("click", resetSessionTimer);

/*-------------------- Event Listeners --------------------*/
document.addEventListener("DOMContentLoaded", popupLoad);
enableFocusBtn.addEventListener("click", enableFocusMode);
