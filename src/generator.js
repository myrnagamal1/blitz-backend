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
  germany: { regex: '01[0-9]{9,10}|\\+491[0-9]{9,10}', hint: 'Format: 01XXXXXXXXX or +491XXXXXXXXX' },
  france:  { regex: '0[67][0-9]{8}|\\+33[67][0-9]{8}', hint: 'Format: 06/07XXXXXXXX or +336/337XXXXXXXX' },
  uk:      { regex: '07[0-9]{9}|\\+447[0-9]{9}',     hint: 'Format: 07XXXXXXXXX or +447XXXXXXXXX' },
  spain:   { regex: '[67][0-9]{8}|\\+34[67][0-9]{8}', hint: 'Format: 6/7XXXXXXXX or +346/347XXXXXXXX' },
  italy:   { regex: '3[0-9]{9}|\\+393[0-9]{9}',      hint: 'Format: 3XXXXXXXXX or +393XXXXXXXXX' },
  netherlands: { regex: '06[0-9]{8}|\\+316[0-9]{8}', hint: 'Format: 06XXXXXXXX or +316XXXXXXXX' },
  generic: { regex: '[0-9]{7,15}|\\+[0-9]{7,15}',    hint: 'Format: 7-15 digit number, optional + prefix' }
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
    '{{DASH_URL}}':                   config.webAppUrl + '/dashboard',
    '{{BACKEND_URL}}':                config.backendUrl || '',
    '{{PHONE_REGEX}}':                config.phoneRegex,
    '{{PHONE_HINT}}':                 config.phoneHint,
    '{{DAYS_JSON}}':                  JSON.stringify(config.days),
    '{{PARTNERS_JSON}}':              JSON.stringify(config.partners),
    '{{MASTER_ACCOUNTS_JSON}}':       JSON.stringify(config.masterAccounts || {}),
    '{{SDE_ACCOUNT_MAP_JSON}}':        JSON.stringify(config.sdeAccountMap || {}),
    '{{CAMPAIGN_CODE}}':               config.campaignCode || '',
    '{{ROOMS_JSON}}':                 JSON.stringify(config.rooms || null),
    '{{AGENDA_JSON}}':                JSON.stringify(config.agenda || null),
    '{{SDES_JSON}}':                  JSON.stringify(config.sdes || []),
    '{{RESOURCES_JSON}}':             JSON.stringify(config.resources || []),
    '{{ACCOUNT_VALIDATION_ENABLED}}': String(config.accountValidationEnabled),
    '{{ROOMS_ENABLED}}':              String(config.roomsEnabled),
    '{{RESOURCES_ENABLED}}':          String(config.resourcesEnabled),
    '{{PHONE_MANDATORY}}':            String(config.phoneMandatory !== false),
    '{{SURVEY_URL}}':                 config.surveyUrl || ''
  };

  for (const [token, value] of Object.entries(replacements)) {
    html = html.split(token).join(value);
  }

  return html;
}

module.exports = { renderTemplate, getPhonePattern, PHONE_PATTERNS };
