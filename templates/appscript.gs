var DATA_SHEET = 'Form Responses 1';

function doGet(e) {
  var params = e.parameter || {};
  var action = params.action || '';
  return action === 'submitLead' ? submitLead(params) : getLeaderboard();
}

function submitLead(params) {
  try {
    var ss    = SpreadsheetApp.openById('{{SPREADSHEET_ID}}');
    var sheet = ss.getSheetByName(DATA_SHEET);

    if (!sheet) {
      sheet = ss.insertSheet(DATA_SHEET);
      sheet.appendRow([
        'Timestamp', 'Partner Name', 'Account Name', 'Customer Name',
        'Customer Title', 'Customer Phone number', 'Customer Email',
        'Industry', 'Agreed Next step', 'AI units to be included in the opp?',
        'Call Summary', 'Solution needed', 'In Master List'
      ]);
      sheet.setFrozenRows(1);
    }

    // Column order matches sheet exactly:
    // Timestamp | Partner Name | Account Name | Customer Name | Customer Title |
    // Customer Phone number | Customer Email | Industry | Agreed Next step |
    // AI units to be included in the opp? | Call Summary | Solution needed | In Master List
    sheet.appendRow([
      new Date(),
      params.partner   || '',
      params.account   || '',
      params.contact   || '',
      params.title     || '',
      params.phone     || '',
      params.email     || '',
      params.industry  || '',
      params.nextstep  || '',
      params.ai        || '',
      params.notes     || '',
      params.outcome   || '',
      params.onMaster  || ''
    ]);

    return jsonResponse({ status: 'ok' });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

function getLeaderboard() {
  try {
    var ss      = SpreadsheetApp.openById('{{SPREADSHEET_ID}}');
    var sheet   = ss.getSheetByName(DATA_SHEET);
    var rows    = [];

    if (sheet && sheet.getLastRow() > 1) {
      var data    = sheet.getDataRange().getValues();
      var headers = data[0];
      for (var i = 1; i < data.length; i++) {
        var row = {};
        for (var j = 0; j < headers.length; j++) {
          // Trim header whitespace/newlines to ensure clean keys
          var key = headers[j].toString().trim();
          row[key] = data[i][j];
        }
        rows.push(row);
      }
    }

    var counts = {};
    for (var r = 0; r < rows.length; r++) {
      var p = (rows[r]['Partner Name'] || '').toString().trim();
      if (p) counts[p] = (counts[p] || 0) + 1;
    }

    var leaderboard = Object.keys(counts).map(function(p) {
      return { partner: p, leads: counts[p] };
    }).sort(function(a, b) { return b.leads - a.leads; });

    return jsonResponse({ leaderboard: leaderboard, rows: rows, updated: new Date().toISOString() });
  } catch (err) {
    return jsonResponse({ leaderboard: [], rows: [], updated: new Date().toISOString(), error: err.toString() });
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
