const express = require('express');
const cors = require('cors');
const { checkRepo, createRepo, uploadFile, enablePages, deleteRepo } = require('./steps/github');
const { createSheet } = require('./steps/sheets');
const { deployScript } = require('./steps/appscript');
const { renderTemplate, getPhonePattern } = require('./generator');

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

  // Input validation
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
  let sheetId = null;

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

    // Step 4: Create Google Sheet
    const sheet = await createSheet(eventName);
    sheetId = sheet.spreadsheetId;

    // Step 5: Deploy Apps Script web app
    const { scriptUrl } = await deployScript(sheetId);

    // Step 6: Generate index.html from template
    const phonePattern = getPhonePattern(phoneFormat);
    const html = renderTemplate({
      eventName,
      country,
      leadTarget: leadTarget || 65,
      dashPassword,
      webAppUrl: scriptUrl,
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

    // Step 7: Push index.html to repo
    await uploadFile(repoName, 'index.html', Buffer.from(html).toString('base64'));

    // Step 8: Enable GitHub Pages
    await enablePages(repoName);

    res.json({ url: `https://myrnagamal1.github.io/${repoName}` });

  } catch (err) {
    // Cleanup: delete repo if it was created
    if (repoCreated) {
      try { await deleteRepo(repoName); } catch (_) { /* best-effort */ }
    }
    // Sheet deletion is best-effort (not implemented — Google Drive allows manual deletion)
    res.status(500).json({ error: err.message, failedStep: err.step || 'Unknown step' });
  }
});

const PORT = process.env.PORT || 3000;
if (require.main === module) app.listen(PORT, () => console.log(`Listening on ${PORT}`));
module.exports = app;
