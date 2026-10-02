const express = require('express');
const cors = require('cors');
const { checkRepo, createRepo, uploadFile, enablePages, deleteRepo } = require('./steps/github');
const { renderTemplate, getPhonePattern } = require('./generator');
const { addLead, getLeads, getLeaderboard } = require('./leads');

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(cors({ origin: process.env.WIZARD_ORIGIN || '*' }));

const REPO_NAME_RE = /^[a-z0-9-]+$/;

app.post('/check-repo', async (req, res) => {
  const { repoName } = req.body;
  if (!repoName || !REPO_NAME_RE.test(repoName)) {
    return res.status(400).json({ error: 'Invalid repo name — use lowercase letters, numbers, hyphens only' });
  }
  try {
    const { exists } = await checkRepo(repoName);
    res.json({ available: !exists });
  } catch (err) {
    res.status(502).json({ error: 'Could not check GitHub: ' + err.message });
  }
});

app.post('/create-event', async (req, res) => {
  const {
    repoName, eventName, country, phoneFormat, leadTarget, dashPassword,
    days, partners, accountValidation, accounts, rooms, resources
  } = req.body;

  if (!repoName || !REPO_NAME_RE.test(repoName)) {
    return res.status(400).json({ error: 'Invalid repo name — use lowercase letters, numbers, hyphens only' });
  }
  if (!partners || partners.length === 0) {
    return res.status(400).json({ error: 'At least one partner is required' });
  }
  if (!days || days.length === 0) {
    return res.status(400).json({ error: 'At least one day is required' });
  }

  let repoCreated = false;

  try {
    // Step 1: Check repo availability
    const { exists } = await checkRepo(repoName);
    if (exists) {
      return res.status(409).json({ error: `Repo "${repoName}" already exists. Choose a different name.`, failedStep: 'Checking repo name' });
    }

    // Step 2: Create GitHub repo
    await createRepo(repoName);
    repoCreated = true;

    // Step 3: Upload PDFs/resources
    for (const resource of (resources || [])) {
      if (resource.base64 && resource.filename) {
        await uploadFile(repoName, `resources/${resource.filename}`, resource.base64);
      }
    }

    // Step 4: Generate index.html from template
    const phonePattern = getPhonePattern(phoneFormat);
    const backendUrl = process.env.BACKEND_URL || 'https://blitz-backend.cfapps.eu10-004.hana.ondemand.com';
    const html = renderTemplate({
      eventName,
      country,
      leadTarget: leadTarget || 65,
      dashPassword,
      webAppUrl: `${backendUrl}/event/${repoName}`,
      phoneRegex: phonePattern.regex,
      phoneHint: phonePattern.hint,
      days,
      partners,
      masterAccounts: accountValidation ? (accounts || {}) : {},
      rooms: rooms && Object.keys(rooms).length > 0 ? rooms : null,
      resources: (resources || []).map(r => ({ title: r.title, description: r.description, filename: r.filename })),
      accountValidationEnabled: !!accountValidation,
      roomsEnabled: !!(rooms && Object.keys(rooms).length > 0),
      resourcesEnabled: !!(resources && resources.length > 0)
    });

    // Step 5: Push index.html to repo
    await uploadFile(repoName, 'index.html', Buffer.from(html).toString('base64'));

    // Step 6: Enable GitHub Pages
    await enablePages(repoName);

    res.json({ url: `https://myrnagamal1.github.io/${repoName}` });

  } catch (err) {
    if (repoCreated) {
      try { await deleteRepo(repoName); } catch (_) { /* best-effort */ }
    }
    res.status(500).json({ error: err.message, failedStep: err.step || 'Unknown step' });
  }
});

// Lead submission endpoint (called by the generated event app)
app.post('/event/:repoName/leads', (req, res) => {
  const { repoName } = req.params;
  if (!REPO_NAME_RE.test(repoName)) return res.status(400).json({ status: 'error', message: 'Invalid repo name' });
  const lead = req.body;
  if (!lead || !lead.partner) return res.status(400).json({ status: 'error', message: 'partner is required' });
  addLead(repoName, lead);
  res.json({ status: 'ok' });
});

// Leaderboard + leads endpoint (called by the generated event app)
app.get('/event/:repoName', (req, res) => {
  const { repoName } = req.params;
  if (!REPO_NAME_RE.test(repoName)) return res.status(400).json({ leaderboard: [], rows: [] });
  const leaderboard = getLeaderboard(repoName);
  const rows = getLeads(repoName);
  res.json({ leaderboard, rows, updated: new Date().toISOString() });
});

// Dashboard data (password-protected, returns raw leads)
app.post('/event/:repoName/dashboard', (req, res) => {
  const { repoName } = req.params;
  const { password } = req.body;
  if (!REPO_NAME_RE.test(repoName)) return res.status(400).json({ error: 'Invalid repo name' });
  // Password check is done client-side in the event app (dashPassword baked into template)
  const rows = getLeads(repoName);
  res.json({ rows });
});

const PORT = process.env.PORT || 3000;
if (require.main === module) app.listen(PORT, () => console.log(`Listening on ${PORT}`));
module.exports = app;
