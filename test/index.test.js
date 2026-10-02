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

describe('POST /create-event validation', () => {
  it('returns 400 if repoName is missing', async () => {
    const res = await request(app).post('/create-event').send({
      eventName: 'Test', country: 'Morocco', phoneFormat: 'morocco',
      leadTarget: 50, dashPassword: 'pw', days: [], partners: [],
      accountValidation: false, accounts: {}, rooms: {}, resources: []
      // repoName intentionally missing
    });
    expect(res.status).toBe(400);
  });

  it('returns 400 if repoName contains uppercase', async () => {
    const res = await request(app).post('/create-event').send({
      repoName: 'MyRepo', eventName: 'Test', country: 'Morocco',
      phoneFormat: 'morocco', leadTarget: 50, dashPassword: 'pw',
      days: [], partners: [], accountValidation: false, accounts: {},
      rooms: {}, resources: []
    });
    expect(res.status).toBe(400);
  });

  it('returns 400 if partners array is empty', async () => {
    const res = await request(app).post('/create-event').send({
      repoName: 'valid-repo', eventName: 'Test', country: 'Morocco',
      phoneFormat: 'morocco', leadTarget: 50, dashPassword: 'pw',
      days: [{ label: 'Day 1', date: '2026-01-01' }], partners: [],
      accountValidation: false, accounts: {}, rooms: {}, resources: []
    });
    expect(res.status).toBe(400);
  });

  it('returns 400 if days array is empty', async () => {
    const res = await request(app).post('/create-event').send({
      repoName: 'valid-repo', eventName: 'Test', country: 'Morocco',
      phoneFormat: 'morocco', leadTarget: 50, dashPassword: 'pw',
      days: [], partners: ['Alpha'],
      accountValidation: false, accounts: {}, rooms: {}, resources: []
    });
    expect(res.status).toBe(400);
  });
});
