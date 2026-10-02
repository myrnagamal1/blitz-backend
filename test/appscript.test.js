jest.mock('googleapis', () => {
  const mockCreate = jest.fn().mockResolvedValue({
    data: { scriptId: 'mock-script-id' }
  });
  const mockUpdateContent = jest.fn().mockResolvedValue({});
  const mockVersionsCreate = jest.fn().mockResolvedValue({
    data: { versionNumber: 1 }
  });
  const mockDeploy = jest.fn().mockResolvedValue({
    data: { deploymentId: 'mock-deployment-id' }
  });
  return {
    google: {
      auth: {
        GoogleAuth: jest.fn().mockImplementation(() => ({
          getClient: jest.fn().mockResolvedValue({})
        }))
      },
      script: jest.fn().mockReturnValue({
        projects: {
          create: mockCreate,
          updateContent: mockUpdateContent,
          versions: { create: mockVersionsCreate },
          deployments: { create: mockDeploy }
        }
      })
    }
  };
});

jest.mock('fs', () => ({
  readFileSync: jest.fn().mockReturnValue('template content with {{SPREADSHEET_ID}} placeholder')
}));

const { _injectSheetId, deployScript } = require('../src/steps/appscript');
const { google } = require('googleapis');

describe('Apps Script module', () => {
  it('replaces {{SPREADSHEET_ID}} with the given sheet ID', () => {
    const template = 'openById(\'{{SPREADSHEET_ID}}\')';
    const result = _injectSheetId(template, 'abc123');
    expect(result).toBe('openById(\'abc123\')');
  });

  it('replaces all occurrences of {{SPREADSHEET_ID}}', () => {
    const template = '{{SPREADSHEET_ID}} and {{SPREADSHEET_ID}}';
    const result = _injectSheetId(template, 'xyz');
    expect(result).toBe('xyz and xyz');
  });

  it('throws if spreadsheetId is empty', () => {
    expect(() => _injectSheetId('template', '')).toThrow(/spreadsheetId/);
  });

  it('uploadContent includes an appsscript JSON manifest with webapp access settings', async () => {
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON = JSON.stringify({ type: 'service_account' });
    await deployScript('sheet-id-123');

    const script = google.script.mock.results[0].value;
    const updateCall = script.projects.updateContent.mock.calls[0][0];
    const files = updateCall.requestBody.files;

    const manifest = files.find(f => f.name === 'appsscript' && f.type === 'JSON');
    expect(manifest).toBeDefined();
    const manifestObj = JSON.parse(manifest.source);
    expect(manifestObj.webapp.access).toBe('ANYONE_ANONYMOUS');
    expect(manifestObj.webapp.executeAs).toBe('USER_DEPLOYING');
  });
});

