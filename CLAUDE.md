# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Easy Focus is a Chrome browser extension (Manifest V3) that blocks distracting websites during focus mode. Built with vanilla JavaScript, HTML, and CSS — no frameworks, no build system, no dependencies.

## Development

No build step required. To develop:
1. Open `chrome://extensions` in Chrome
2. Enable "Developer mode"
3. Click "Load unpacked" and select the project directory
4. After code changes, click the refresh icon on the extension card

There is no package.json, no test framework, and no linter configured.

## Architecture

**Popup UI** (`popup.html`, `popup.js`, `popup.css`): The extension popup shown when clicking the toolbar icon. Handles toggling focus mode, adding/removing restricted URLs, and rendering the URL list.

**Background Service Worker** (`background.js`): Monitors tab navigation (`chrome.tabs.onUpdated`) and tab switches (`chrome.tabs.onActivated`). When focus mode is enabled, checks if the current tab URL matches any restricted site and redirects to `focus.html`.

**Block Page** (`focus.html`): Static page displayed when a user navigates to a restricted site during focus mode.

## Data Flow

- `chrome.storage.local` stores `focusEnabled` (boolean)
- `chrome.storage.sync` stores `restrictedSites` (JSON stringified array of URL patterns)
- URL matching uses `RegExp` — partial matches work (e.g., "reddit" blocks "reddit.com" and "old.reddit.com")
- `popup.js` maintains a local `aRestrictedSites` array that syncs to/from Chrome storage

## Chrome Extension Permissions

Defined in `manifest.json`: `tabs` (tab URL access and navigation) and `storage` (chrome.storage API).
