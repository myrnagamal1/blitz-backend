const express = require('express');
const cors = require('cors');
const { checkRepo } = require('./steps/github');

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
  res.json({ url: 'https://placeholder.github.io/stub' });
});

const PORT = process.env.PORT || 3000;
if (require.main === module) app.listen(PORT, () => console.log(`Listening on ${PORT}`));
module.exports = app;
