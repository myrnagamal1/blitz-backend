const request = require('supertest');
const app = require('../src/index');

describe('POST /check-repo', () => {
  it('returns 400 for invalid repo name (spaces)', async () => {
    const res = await request(app).post('/check-repo').send({ repoName: 'my repo' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid/i);
  });

  it('returns 400 for invalid repo name (uppercase)', async () => {
    const res = await request(app).post('/check-repo').send({ repoName: 'MyRepo' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for empty repo name', async () => {
    const res = await request(app).post('/check-repo').send({ repoName: '' });
    expect(res.status).toBe(400);
  });
});
