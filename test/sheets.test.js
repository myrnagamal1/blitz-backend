jest.mock('googleapis', () => {
  const mockCreate = jest.fn().mockResolvedValue({
    data: { spreadsheetId: 'mock-sheet-id' }
  });
  return {
    google: {
      auth: {
        GoogleAuth: jest.fn().mockImplementation(() => ({
          getClient: jest.fn().mockResolvedValue({})
        }))
      },
      sheets: jest.fn().mockReturnValue({
        spreadsheets: { create: mockCreate }
      })
    }
  };
});

const { _buildHeaders, createSheet } = require('../src/steps/sheets');

describe('Sheets module', () => {
  it('exports _buildHeaders as the correct 13-column array', () => {
    const headers = _buildHeaders();
    expect(headers).toHaveLength(13);
    expect(headers[0]).toBe('Timestamp');
    expect(headers[1]).toBe('Partner Name');
    expect(headers[12]).toBe('In Master List');
  });

  it('_buildHeaders contains AI units column', () => {
    const headers = _buildHeaders();
    expect(headers).toContain('AI units to be included in the opp?');
  });

  it('createSheet returns spreadsheetId from API response', async () => {
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON = JSON.stringify({ type: 'service_account' });
    const result = await createSheet('Test Event');
    expect(result).toEqual({ spreadsheetId: 'mock-sheet-id' });
  });
});
