const clockEl = document.getElementById("clock");
const sessionTimeEl = document.getElementById("sessionTime");
const sessionBlockEl = document.querySelector(".session-block");
const pausedLabelEl = document.getElementById("pausedLabel");

let sessionStart = null;
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

function setSessionVisible(visible) {
  sessionBlockEl.style.display = visible ? "flex" : "none";
}

// Paused or not started -> just the accumulated time.
// Running -> accumulated plus the time since the current segment started.
function computeElapsedMs(accumulatedMs, start, paused) {
  const acc = accumulatedMs || 0;
  if (paused || !start) {
    return acc;
  }
  return acc + (Date.now() - start.getTime());
}

function tick() {
  const now = new Date();
  clockEl.textContent = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  if (sessionStart || sessionAccumulatedMs) {
    sessionTimeEl.textContent = formatElapsed(
      computeElapsedMs(sessionAccumulatedMs, sessionStart, sessionPaused),
    );
  }
  pausedLabelEl.style.display = sessionPaused ? "inline" : "none";
}

chrome.storage.local
  .get([
    "focusSessionStart",
    "focusSessionAccumulatedMs",
    "focusSessionPaused",
    "focusEnabled",
  ])
  .then((result) => {
    setSessionVisible(!!result.focusEnabled);
    sessionStart = result.focusSessionStart
      ? new Date(result.focusSessionStart)
      : null;
    sessionAccumulatedMs = result.focusSessionAccumulatedMs || 0;
    sessionPaused = !!result.focusSessionPaused;
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
  if ("focusSessionAccumulatedMs" in changes) {
    sessionAccumulatedMs = changes.focusSessionAccumulatedMs.newValue || 0;
  }
  if ("focusSessionPaused" in changes) {
    sessionPaused = !!changes.focusSessionPaused.newValue;
  }
  tick();
});
