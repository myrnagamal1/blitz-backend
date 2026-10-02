const fs = require('fs');
const path = require('path');

const PHONE_PATTERNS = {
  egypt:   { regex: '01[0-9]{9}|\\+201[0-9]{9}',     hint: 'Format: 01XXXXXXXXX or +201XXXXXXXXX' },
  'saudi-arabia': { regex: '05[0-9]{8}|\\+9665[0-9]{8}', hint: 'Format: 05XXXXXXXX or +9665XXXXXXXX' },
  uae:     { regex: '05[0-9]{8}|\\+9715[0-9]{8}',    hint: 'Format: 05XXXXXXXX or +9715XXXXXXXX' },
  morocco: { regex: '06[0-9]{8}|\\+2126[0-9]{8}',    hint: 'Format: 06XXXXXXXX or +2126XXXXXXXX' },
  kuwait:  { regex: '[0-9]{8}|\\+965[0-9]{8}',        hint: 'Format: 8 digits or +965XXXXXXXX' },
  bahrain: { regex: '[0-9]{8}|\\+973[0-9]{8}',        hint: 'Format: 8 digits or +973XXXXXXXX' },
  jordan:  { regex: '07[0-9]{8}|\\+9627[0-9]{8}',    hint: 'Format: 07XXXXXXXX or +9627XXXXXXXX' },
  qatar:   { regex: '[0-9]{8}|\\+974[0-9]{8}',        hint: 'Format: 8 digits or +974XXXXXXXX' },
  oman:    { regex: '[0-9]{8}|\\+968[0-9]{8}',        hint: 'Format: 8 digits or +968XXXXXXXX' },
  tunisia: { regex: '[0-9]{8}|\\+216[0-9]{8}',        hint: 'Format: 8 digits or +216XXXXXXXX' },
  algeria: { regex: '05[0-9]{8}|\\+2135[0-9]{8}',    hint: 'Format: 05XXXXXXXX or +2135XXXXXXXX' },
  libya:   { regex: '09[0-9]{8}|\\+2189[0-9]{8}',    hint: 'Format: 09XXXXXXXX or +2189XXXXXXXX' },
  generic: { regex: '[0-9]{7,15}|\\+[0-9]{7,15}',    hint: 'Format: 7–15 digit number, optional + prefix' }
};

function getPhonePattern(phoneFormat) {
  return PHONE_PATTERNS[phoneFormat] || PHONE_PATTERNS.generic;
}

function renderTemplate(config) {
  const templatePath = path.join(__dirname, '../templates/event.html');
  let html = fs.readFileSync(templatePath, 'utf8');

  const replacements = {
    '{{EVENT_NAME}}':                 config.eventName,
    '{{COUNTRY}}':                    config.country,
    '{{LEAD_TARGET}}':                String(config.leadTarget),
    '{{DASH_PASS}}':                  config.dashPassword,
    '{{WEB_APP_URL}}':                config.webAppUrl,
    '{{DASH_URL}}':                   config.webAppUrl,
    '{{PHONE_REGEX}}':                config.phoneRegex,
    '{{PHONE_HINT}}':                 config.phoneHint,
    '{{DAYS_JSON}}':                  JSON.stringify(config.days),
    '{{PARTNERS_JSON}}':              JSON.stringify(config.partners),
    '{{MASTER_ACCOUNTS_JSON}}':       JSON.stringify(config.masterAccounts || {}),
    '{{ROOMS_JSON}}':                 JSON.stringify(config.rooms || null),
    '{{RESOURCES_JSON}}':             JSON.stringify(config.resources || []),
    '{{ACCOUNT_VALIDATION_ENABLED}}': String(config.accountValidationEnabled),
    '{{ROOMS_ENABLED}}':              String(config.roomsEnabled),
    '{{RESOURCES_ENABLED}}':          String(config.resourcesEnabled)
  };

  for (const [token, value] of Object.entries(replacements)) {
    html = html.split(token).join(value);
  }

  return html;
}

module.exports = { renderTemplate, getPhonePattern, PHONE_PATTERNS };
