const clockEl = document.getElementById("clock");
const sessionTimeEl = document.getElementById("sessionTime");
const sessionBlockEl = document.querySelector(".session-block");

let sessionStart = null;
let isPaused = false;
let totalPausedTime = 0;
let pauseStartTime = null;

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

function setSessionVisible(visible) {
  sessionBlockEl.style.display = visible ? "flex" : "none";
}

function tick() {
  const now = new Date();
  clockEl.textContent = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  if (sessionStart) {
    let elapsed = now - sessionStart;
    if (isPaused && pauseStartTime) {
      elapsed -= (now - pauseStartTime);
    }
    elapsed -= totalPausedTime;
    sessionTimeEl.textContent = formatElapsed(elapsed);
  }
}

chrome.storage.local
  .get(["focusSessionStart", "focusEnabled", "isPaused", "totalPausedTime", "pauseStartTime"])
  .then((result) => {
    setSessionVisible(!!result.focusEnabled);
    sessionStart = result.focusSessionStart
      ? new Date(result.focusSessionStart)
      : null;
    isPaused = result.isPaused || false;
    totalPausedTime = result.totalPausedTime || 0;
    pauseStartTime = result.pauseStartTime || null;
    tick();
    setInterval(tick, 1000);
  });

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  if ("focusEnabled" in changes) {
    setSessionVisible(!!changes.focusEnabled.newValue);
  }
  if ("focusSessionStart" in changes) {
    sessionStart = changes.focusSessionStart.newValue
      ? new Date(changes.focusSessionStart.newValue)
      : null;
  }
  if ("isPaused" in changes) {
    isPaused = changes.isPaused.newValue;
  }
  if ("totalPausedTime" in changes) {
    totalPausedTime = changes.totalPausedTime.newValue;
  }
  if ("pauseStartTime" in changes) {
    pauseStartTime = changes.pauseStartTime.newValue;
  }
});
