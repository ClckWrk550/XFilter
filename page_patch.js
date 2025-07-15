// page_patch.js  – full logic + optional debug
(() => {
  /* ───── debug toggle ───── */
  const DEBUG = true;                       // ⇦ switch to true for logging
  const dbgId = Math.random().toString(36).slice(2, 7);
  const log   = DEBUG ? (...a)=>console.debug(`[XC-${dbgId}]`,...a) : ()=>{};
  /* ──────────────────────── */

  const wantURL = u => /\/i\/api\/graphql\/[^/]+\/.*(?:Timeline|TweetDetail)/.test(u);

  /* live settings */
  let filters = [];
  let fields  = {
    bio:true, name:false, handle:false,
    filterReplies:true, hideVerified:false, hidePromoted:false
  };
  let regexps = [];
  window.addEventListener('XC_SETTINGS', e => {
    const s = e.detail || {};
    filters = (s.filters || []).map(f => f.toLowerCase());
    fields  = { ...fields, ...(s.fields || {}) };
    regexps = filters.map(f => {
      const esc = f.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
      return new RegExp(`(^|\\s)${esc}(?=(?:\\s|[^\\w]|$))`,'i');
    });
    log('settings', fields, filters);
  });

  /* CSS – hide tweet and trailing divider */
  const style=document.createElement('style');
  style.textContent=`
    article[data-xc-hide]{display:none!important}
    article[data-xc-hide]+div[data-testid="cellInnerDivider"]{display:none!important}`;
  document.head.append(style);

  /* helpers */
  const author = e => (
    e?.content?.itemContent ||
    e?.content?.items?.[0]?.item?.itemContent
  )?.tweet_results?.result?.core?.user_results?.result;

  const matchKw = u => {
    if (u.legacy?.following) return false;        // exempt follows
    const txt = [
      fields.bio    && u.legacy?.description,
      fields.name   && u.legacy?.name,
      fields.handle && u.legacy?.screen_name
    ].filter(Boolean).join(' ').toLowerCase();
    return regexps.some(r => r.test(txt));
  };

  /* ID caches for DOM fallback (needed) */
  const blockedIds   = new Set();
  const blockedNames = new Set();

  /* scrub network JSON */
  function scrub(raw){
    if (!filters.length && !fields.hidePromoted && !fields.hideVerified) return raw;

    let obj; try { obj = JSON.parse(raw); } catch { return raw; }

    const root = obj.data?.home?.home_timeline_urt
              ?? obj.data?.home?.home_latest_timeline_urt
              ?? (fields.filterReplies
                    ? obj.data?.threaded_conversation_with_injections_v2
                    : null);
    if (!root?.instructions) return raw;

    let removed = 0, total = 0;
    for (const ins of root.instructions){
      if (ins.type!=='TimelineAddEntries') continue;

      const out = [];
      total += ins.entries.length;

      for (const ent of ins.entries){
        const u = author(ent);
        if (!u || u.legacy.following){ out.push(ent); continue; }

        const byKw   = matchKw(u);
        const isPromo= fields.hidePromoted &&
                       typeof ent.entryId==='string' &&
                       ent.entryId.includes('promoted-tweet');
        const isVer  = fields.hideVerified && u.is_blue_verified===true;

        if (byKw||isPromo||isVer){
          removed++;
          blockedIds.add(u.rest_id);
          blockedNames.add(u.legacy.screen_name.toLowerCase());
          if (DEBUG){
            const tag = byKw?'KW':isPromo?'PROMO':'VERIF';
            log('REM', tag, ent.entryId||'', '@'+u.legacy.screen_name);
          }
        } else out.push(ent);
      }
      ins.entries = out;
    }
    if (DEBUG && removed) log('scrub', total,'→',removed,'removed');
    return JSON.stringify(obj);
  }

  /* DOM fallback for lazy tweets */
  function maybeHide (node){
    const art  = node.closest?.('article');
    if (!art || art.hasAttribute('data-xc-hide')) return;
  
    const link = art.querySelector('a[href*="/status/"]');
    if (!link) return;
  
    const uid  = link.getAttribute('data-user-id');
    const name = link.href.match(/\.com\/([^/]+)\/status/)?.[1]?.toLowerCase();
  
    if (blockedIds.has(uid) || blockedNames.has(name)){
      /* mark the article so we don't process it again */
      art.setAttribute('data-xc-hide','');
  
      /* grey separator lives in the same cell, just after the article */
      const sep = art.nextElementSibling;
      if (sep?.getAttribute('role') === 'separator'){
        sep.style.display = 'none';          // hide the line
      }
  
      /* collapse the containing cell instead of removing it */
      const cell = art.closest('div[data-testid="cellInnerDiv"]');
      if (cell){
        cell.style.maxHeight   = '0px';
        cell.style.padding     = '0';
        cell.style.margin      = '0';
        cell.style.overflow    = 'hidden';
      }
  
      log('DOM collapse', name || uid);
    }
  }
  

  new MutationObserver(m=>m.forEach(r=>{
    r.addedNodes.forEach(maybeHide);
    if (r.type==='attributes') maybeHide(r.target);
  })).observe(document.body,{childList:true,subtree:true,
     attributes:true,attributeFilter:['data-user-id','href']});
  setInterval(()=>document.querySelectorAll('article:not([data-xc-hide])')
    .forEach(maybeHide),2000);

  /* patch fetch / XHR */
  const f=window.fetch;
  window.fetch=async(...a)=>{
    const url=a[0]?.url||a[0];
    DEBUG && log('fetch',url);
    const res=await f(...a);
    if (!wantURL(url)) return res;
    const txt=await res.clone().text();
    return new Response(scrub(txt),{headers:res.headers,status:res.status});
  };
  const xo = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open=function(m,u,...r){this._u=u;return xo.call(this,m,u,...r);}
  const xs = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send=function(...d){
    this.addEventListener('readystatechange',()=>{
      if(this.readyState===4 && wantURL(this._u)){
        Object.defineProperty(this,'responseText',{value:scrub(this.responseText)});
      }
    });
    return xs.apply(this,d);
  };

  log('page_patch ready');
})();
