// content.js – injects page_patch.js and pushes full settings

const PATCH_URL = chrome.runtime.getURL('page_patch.js');
let injected = false;

// Push settings into page
function pushSettings(settings) {
  window.dispatchEvent(new CustomEvent('XC_SETTINGS', { detail: settings }));
}

// Inject the patch script once, then push settings
function inject(settings) {
  if (injected) return pushSettings(settings);

  const s = document.createElement('script');
  s.src = PATCH_URL;
  s.onload = () => {
    injected = true;
    pushSettings(settings);
    s.remove();
  };
  (document.head || document.documentElement).append(s);
}

// Load settings from background (retry up to 5×)
function loadSettings(tries = 0) {
  chrome.runtime.sendMessage('XC_GET_SETTINGS', settings => {
    if (settings) inject(settings);
    else if (tries < 5) setTimeout(() => loadSettings(tries + 1), 200);
  });
}
loadSettings();

// Hot-reload on storage changes
chrome.storage.onChanged.addListener(ch => {
  if (ch.filters || ch.fields) {
    chrome.runtime.sendMessage('XC_GET_SETTINGS', pushSettings);
  }
});
