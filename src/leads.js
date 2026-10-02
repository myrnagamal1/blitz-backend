const fs = require('fs');
const path = require('path');

const STORE_PATH = path.join(__dirname, '..', 'leads-store.json');

function _load() {
  try {
    return JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
  } catch (_) {
    return {};
  }
}

function _save(store) {
  fs.writeFileSync(STORE_PATH, JSON.stringify(store), 'utf8');
}

function addLead(repoName, lead) {
  const store = _load();
  if (!store[repoName]) store[repoName] = [];
  store[repoName].push({ ...lead, timestamp: new Date().toISOString() });
  _save(store);
}

function getLeads(repoName) {
  const store = _load();
  return store[repoName] || [];
}

function getLeaderboard(repoName) {
  const leads = getLeads(repoName);
  const counts = {};
  for (const lead of leads) {
    const p = (lead.partner || '').trim();
    if (p) counts[p] = (counts[p] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([partner, leads]) => ({ partner, leads }))
    .sort((a, b) => b.leads - a.leads);
}

module.exports = { addLead, getLeads, getLeaderboard };
