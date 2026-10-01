jest.mock('googleapis', () => {
  const mockCreate = jest.fn().mockResolvedValue({
    data: { scriptId: 'mock-script-id' }
  });
  const mockUpdateContent = jest.fn().mockResolvedValue({});
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
          deployments: { create: mockDeploy }
        }
      })
    }
  };
});

jest.mock('fs', () => ({
  readFileSync: jest.fn().mockReturnValue('template content with {{SPREADSHEET_ID}} placeholder')
}));

const { _injectSheetId } = require('../src/steps/appscript');

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
});
