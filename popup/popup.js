// popup.js
// ---------

const ui = {
  kw      : document.getElementById('kw'),
  bio     : document.getElementById('bio'),
  name    : document.getElementById('name'),
  handle  : document.getElementById('handle'),
  filterR : document.getElementById('filterReplies'),
  hideVer : document.getElementById('hideVerified'),
  hideAds : document.getElementById('hidePromoted'),
  banner  : document.getElementById('refresh')
};

// ---- helpers --------------------------------------------------------------

function getPayload() {
  return {
    filters : ui.kw.value
                .split(/\r?\n/)
                .map(s => s.trim())
                .filter(Boolean),

    fields  : {
      bio           : ui.bio.checked,
      name          : ui.name.checked,
      handle        : ui.handle.checked,
      filterReplies : ui.filterR.checked,
      hideVerified  : ui.hideVer.checked,
      hidePromoted  : ui.hideAds.checked
    }
  };
}

function save() {
  chrome.storage.local.set(getPayload(), () => {
    // pulse the “refresh” banner
    ui.banner.hidden = false;
    ui.banner.classList.add('pulse');
    setTimeout(() => ui.banner.classList.remove('pulse'), 600);
  });
}

// ---- load stored settings -------------------------------------------------

chrome.storage.local.get(
  { filters: [], fields: {} },
  ({ filters, fields }) => {
    ui.kw.value          = filters.join('\n');
    ui.bio.checked       = fields.bio           ?? true;
    ui.name.checked      = fields.name          ?? false;
    ui.handle.checked    = fields.handle        ?? false;
    ui.filterR.checked   = fields.filterReplies ?? true;
    ui.hideVer.checked   = fields.hideVerified  ?? false;
    ui.hideAds.checked   = fields.hidePromoted  ?? false;
  }
);

// ---- auto-save on every change -------------------------------------------

[
  'input',           // textarea typing
  'change'           // checkbox toggle
].forEach(evt => {
  document.addEventListener(evt, e => {
    if (e.target.closest('textarea, input[type="checkbox"]')) save();
  });
});

// ---- reload current X tab when banner clicked ----------------------------

ui.banner.addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const tab = tabs[0];
    if (tab && /:\/\/(?:www\.)?(x|twitter)\.com\//.test(tab.url)) {
      chrome.tabs.reload(tab.id, () => window.close());   // ← close popup
    } else {
      window.close();                                     // still close
    }
  });
});
