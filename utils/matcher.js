export async function loadFilters() {
  return new Promise(r => chrome.storage.local.get({ filters: [] }, x => r(x.filters)));
}

export function bioIsBlocked(bio, filters) {
  return filters.some(f => bio.toLowerCase().includes(f.toLowerCase()));
}