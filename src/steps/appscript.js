const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

function _injectSheetId(template, spreadsheetId) {
  if (!spreadsheetId) throw new Error('spreadsheetId is required');
  return template.split('{{SPREADSHEET_ID}}').join(spreadsheetId);
}

async function _getAuth() {
  const key = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  return new google.auth.GoogleAuth({
    credentials: key,
    scopes: ['https://www.googleapis.com/auth/script.projects']
  });
}

async function deployScript(spreadsheetId) {
  const auth = await _getAuth();
  const script = google.script({ version: 'v1', auth });

  const templatePath = path.join(__dirname, '../../templates/appscript.gs');
  const templateSrc = fs.readFileSync(templatePath, 'utf8');
  const source = _injectSheetId(templateSrc, spreadsheetId);

  // Create the Apps Script project
  const project = await script.projects.create({
    requestBody: { title: `Blitz Backend ${spreadsheetId.slice(0, 8)}` }
  });
  const scriptId = project.data.scriptId;

  // Upload the source
  await script.projects.updateContent({
    scriptId,
    requestBody: {
      scriptId,
      files: [{ name: 'Code', type: 'SERVER_JS', source }]
    }
  });

  // Deploy as web app
  const deployment = await script.projects.deployments.create({
    scriptId,
    requestBody: {
      versionNumber: 1,
      manifestFileName: 'appsscript',
      description: 'Blitz Day auto-deploy'
    }
  });

  const deploymentId = deployment.data.deploymentId;
  const scriptUrl = `https://script.google.com/macros/s/${deploymentId}/exec`;
  return { scriptUrl };
}

module.exports = { deployScript, _injectSheetId };
