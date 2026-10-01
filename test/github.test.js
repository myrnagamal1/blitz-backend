// These tests mock fetch — no real GitHub calls
const { checkRepo, _repoNameToUrl } = require('../src/steps/github');

describe('GitHub module', () => {
  it('builds correct repo URL', () => {
    expect(_repoNameToUrl('test-repo')).toBe(
      'https://api.github.com/repos/myrnagamal1/test-repo'
    );
  });

  it('checkRepo returns exists:true on 200', async () => {
    global.fetch = jest.fn().mockResolvedValue({ status: 200 });
    const result = await checkRepo('existing-repo');
    expect(result).toEqual({ exists: true });
  });

  it('checkRepo returns exists:false on 404', async () => {
    global.fetch = jest.fn().mockResolvedValue({ status: 404 });
    const result = await checkRepo('new-repo');
    expect(result).toEqual({ exists: false });
  });

  it('checkRepo throws on unexpected status', async () => {
    global.fetch = jest.fn().mockResolvedValue({ status: 500, text: async () => 'error' });
    await expect(checkRepo('any')).rejects.toThrow(/GitHub API error/);
  });
});
