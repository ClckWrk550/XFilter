// background.js – returns current settings to content script
chrome.runtime.onMessage.addListener((msg, _s, send) => {
  if (msg !== 'XC_GET_SETTINGS') return;
  chrome.storage.local.get(
    {
      filters: [],
      fields: {
        bio:           true,
        name:          false,
        handle:        false,
        filterReplies: true,
        hideVerified:  false,
        hidePromoted:  false
      }
    },
    send
  );
  return true;          // keep channel open
});
