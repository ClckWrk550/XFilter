# XFilter V1 (Beta Release)
App to filter content, ads, and profile types on X.com


X‑Cleanser – Twitter/X Feed Filter (Manifest V3)

Hide the noise – keep the signal. X‑Cleanser is an open‑source Chrome/Brave extension that removes unwanted content in real‑time while you browse X.


Features
------------------------------------------------------------------------

**Keyword / emoji blocker**

Enter one keyword per line – tweets whose bio / display‑name / @handle match are hidden.

**Blue‑check hider**

Optionally suppress posts from paid "verified" accounts that you don’t follow.

**Promoted‑tweet remover**

Eliminates ads (promoted‑tweet‑* entries) before they hit the DOM.

**Reply filtering**

Keeps the same rules inside conversation threads and quote‑tweets.

**Auto‑whitelist**

Accounts you already follow are never hidden, even if they match a rule.

_All processing happens client‑side only – nothing is collected, nothing is sent anywhere.___


Installation
------------------------------------------------------------------------

1 – Load unpacked (dev)

chrome://extensions  →  Developer mode  →  Load unpacked  →  select this folder

2 – Chrome Web Store (soon)

We’re preparing the public listing – once live, just click Add to Chrome.


Using X‑Cleanser
------------------------------------------------------------------------

Click the ✖︎ icon in the extensions toolbar.

Type one keyword per line – case‑insensitive, matches whole words only.

Tick which fields to scan (Bio / Name / @Handle) and the optional filters.

Close the popup → refresh the X tab.

Changes are saved instantly; the ↻ Refresh pill will pulse to remind you to reload.


How it works
------------------------------------------------------------------------

page_patch.js intercepts fetch/XHR requests whose URL contains
…/graphql/.../(HomeTimeline|HomeLatestTimeline|TweetDetail).

It scrubs the JSON before X renders it, deleting unwanted entries.

A MutationObserver keeps the timeline clean for lazy‑loaded tweets.

Minimal CSS (article[data-xc-hide]{display:none}) removes layout gaps.

Because we never modify in‑place elements outside our own selector,
X’s virtual scroller ≠ snap and scrolling stays smooth.


Development
------------------------------------------------------------------------

npm i        # no deps yet – placeholder
npm run dev  # watches & zips (coming)

Key files:

manifest.json – MV3, no host‑permissions needed.

background.js – relays settings between popup ⇄ content.

popup/ – vanilla JS + minimal CSS UI.


Privacy
------------------------------------------------------------------------

This extension stores options locally using chrome.storage.local, never touches cookies or sends network requests outside X’s own calls, and contains no analytics, trackers, or remote code.


Licence
------------------------------------------------------------------------

MIT – do whatever you want, just keep the copyright & licence notice.


Credits / inspiration
------------------------------------------------------------------------

All the rejects who poisoned my feed with garbage content and takes that required further filtering than a simple keyword mute: you inspired this.

