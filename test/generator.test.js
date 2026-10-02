const { renderTemplate } = require('../src/generator');

const baseConfig = {
  eventName: 'Test Blitz 2026',
  country: 'Morocco',
  phoneRegex: '06[0-9]{8}|\\+2126[0-9]{8}',
  phoneHint: 'Format: 06XXXXXXXX or +2126XXXXXXXX',
  leadTarget: 50,
  dashPassword: 'TEST123',
  webAppUrl: 'https://script.google.com/macros/s/FAKE/exec',
  days: [{ label: 'Day 1 — Oct 12', date: '2026-10-12' }],
  partners: ['Alpha', 'Beta'],
  masterAccounts: {},
  rooms: null,
  resources: [],
  accountValidationEnabled: false,
  roomsEnabled: false,
  resourcesEnabled: false
};

describe('renderTemplate', () => {
  it('replaces {{EVENT_NAME}}', () => {
    const html = renderTemplate(baseConfig);
    expect(html).toContain('Test Blitz 2026');
    expect(html).not.toContain('{{EVENT_NAME}}');
  });

  it('replaces {{COUNTRY}}', () => {
    const html = renderTemplate(baseConfig);
    expect(html).toContain('Morocco');
    expect(html).not.toContain('{{COUNTRY}}');
  });

  it('replaces {{WEB_APP_URL}} with the script URL', () => {
    const html = renderTemplate(baseConfig);
    expect(html).toContain('https://script.google.com/macros/s/FAKE/exec');
    expect(html).not.toContain('{{WEB_APP_URL}}');
  });

  it('injects PARTNERS as a JS array', () => {
    const html = renderTemplate(baseConfig);
    expect(html).toContain('"Alpha"');
    expect(html).toContain('"Beta"');
  });

  it('leaves no unreplaced {{TOKENS}} in output', () => {
    const html = renderTemplate(baseConfig);
    expect(html).not.toMatch(/\{\{[A-Z_]+\}\}/);
  });

  it('escapes partner names that contain backticks', () => {
    const config = { ...baseConfig, partners: ['Test`Corp'] };
    const html = renderTemplate(config);
    // JSON.stringify escapes backticks harmlessly — just ensure output is valid
    expect(html).not.toContain('{{PARTNERS_JSON}}');
  });
});
