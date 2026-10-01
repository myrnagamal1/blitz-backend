// These tests mock fetch — no real GitHub calls
jest.mock('node-fetch');
const fetch = require('node-fetch');
const { checkRepo } = require('../src/steps/github');

describe('GitHub module', () => {
  beforeEach(() => {
    fetch.mockReset();
  });

  it('checkRepo calls the correct URL', async () => {
    fetch.mockResolvedValue({ status: 200 });
    await checkRepo('test-repo');
    expect(fetch.mock.calls[0][0]).toBe(
      'https://api.github.com/repos/myrnagamal1/test-repo'
    );
  });

  it('checkRepo returns exists:true on 200', async () => {
    fetch.mockResolvedValue({ status: 200 });
    const result = await checkRepo('existing-repo');
    expect(result).toEqual({ exists: true });
  });

  it('checkRepo returns exists:false on 404', async () => {
    fetch.mockResolvedValue({ status: 404 });
    const result = await checkRepo('new-repo');
    expect(result).toEqual({ exists: false });
  });

  it('checkRepo throws on unexpected status', async () => {
    fetch.mockResolvedValue({ status: 500, text: async () => 'error' });
    await expect(checkRepo('any')).rejects.toThrow(/GitHub API error/);
  });
});
