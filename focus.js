const clockEl = document.getElementById("clock");
const sessionTimeEl = document.getElementById("sessionTime");
const sessionBlockEl = document.querySelector(".session-block");

let sessionStart = null;
let pauseStart = null;
let totalPausedTime = 0;

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
    let elapsed;
    if (pauseStart) {
      elapsed = new Date() - sessionStart - totalPausedTime;
    } else {
      elapsed = now - sessionStart - totalPausedTime;
    }
    if (elapsed > 0) {
      sessionTimeEl.textContent = formatElapsed(elapsed);
    } else {
      sessionTimeEl.textContent = "0m 00s";
    }
  }
}

function pauseSession() {
  pauseStart = new Date();
}

function resumeSession() {
  if (pauseStart) {
    totalPausedTime += new Date() - pauseStart;
    pauseStart = null;
  }
}

chrome.storage.local
  .get(["focusSessionStart", "focusEnabled", "focusSessionPaused"])
  .then((result) => {
    setSessionVisible(!!result.focusEnabled);
    sessionStart = result.focusSessionStart
      ? new Date(result.focusSessionStart)
      : null;
    const isPaused = result.focusSessionPaused;
    if (isPaused) {
      pauseSession();
    }
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
    if (!pauseStart) {
      totalPausedTime = 0;
    }
  }
  if ("focusSessionPaused" in changes) {
    const isPaused = changes.focusSessionPaused.newValue;
    if (isPaused) {
      pauseSession();
    } else {
      resumeSession();
    }
  }
});
