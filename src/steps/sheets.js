const { google } = require('googleapis');

const SHEET_NAME = 'Form Responses 1';

function _buildHeaders() {
  return [
    'Timestamp',
    'Partner Name',
    'Account Name',
    'Customer Name',
    'Customer Title',
    'Customer Phone number',
    'Customer Email',
    'Industry',
    'Agreed Next step',
    'AI units to be included in the opp?',
    'Call Summary',
    'Solution needed',
    'In Master List'
  ];
}

async function _getAuth() {
  const key = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  const auth = new google.auth.GoogleAuth({
    credentials: key,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive'
    ]
  });
  return auth;
}

async function createSheet(eventName) {
  const auth = await _getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  const createRes = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title: eventName },
      sheets: [{
        properties: { title: SHEET_NAME, gridProperties: { frozenRowCount: 1 } },
        data: [{
          startRow: 0,
          startColumn: 0,
          rowData: [{
            values: _buildHeaders().map(h => ({ userEnteredValue: { stringValue: h } }))
          }]
        }]
      }]
    }
  });

  return { spreadsheetId: createRes.data.spreadsheetId };
}

module.exports = { createSheet, _buildHeaders };
