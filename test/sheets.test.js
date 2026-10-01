const { _buildHeaders } = require('../src/steps/sheets');

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
});
