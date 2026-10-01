const fetch = require('node-fetch');
const OWNER = 'myrnagamal1';
const BASE = 'https://api.github.com';

function headers() {
  return {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
    'User-Agent': 'blitz-generator'
  };
}

function _repoNameToUrl(repoName) {
  return `${BASE}/repos/${OWNER}/${repoName}`;
}

async function checkRepo(repoName) {
  const res = await fetch(`${BASE}/repos/${OWNER}/${repoName}`, { headers: headers() });
  if (res.status === 200) return { exists: true };
  if (res.status === 404) return { exists: false };
  throw new Error(`GitHub API error: ${res.status} — ${await res.text()}`);
}

async function createRepo(repoName) {
  const res = await fetch(`${BASE}/user/repos`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ name: repoName, private: false, auto_init: true })
  });
  if (res.status !== 201) throw new Error(`Create repo failed: ${res.status} — ${await res.text()}`);
}

async function uploadFile(repoName, path, base64Content) {
  const res = await fetch(`${BASE}/repos/${OWNER}/${repoName}/contents/${path}`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify({ message: `Add ${path}`, content: base64Content })
  });
  if (res.status !== 201 && res.status !== 200) {
    throw new Error(`Upload ${path} failed: ${res.status} — ${await res.text()}`);
  }
}

async function enablePages(repoName) {
  const res = await fetch(`${BASE}/repos/${OWNER}/${repoName}/pages`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ source: { branch: 'main', path: '/' } })
  });
  // 201 = created, 409 = already enabled — both are fine
  if (res.status !== 201 && res.status !== 409) {
    throw new Error(`Enable Pages failed: ${res.status} — ${await res.text()}`);
  }
}

async function deleteRepo(repoName) {
  await fetch(`${BASE}/repos/${OWNER}/${repoName}`, {
    method: 'DELETE',
    headers: headers()
  });
  // best-effort — ignore errors
}

module.exports = { checkRepo, createRepo, uploadFile, enablePages, deleteRepo };
