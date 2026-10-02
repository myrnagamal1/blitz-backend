'use strict';

// Mock all external step modules and the generator before requiring the app
jest.mock('../src/steps/github');
jest.mock('../src/steps/sheets');
jest.mock('../src/steps/appscript');
jest.mock('../src/generator');

const request = require('supertest');
const app = require('../src/index');

const { checkRepo, createRepo, uploadFile, enablePages, deleteRepo } = require('../src/steps/github');
const { createSheet } = require('../src/steps/sheets');
const { deployScript } = require('../src/steps/appscript');
const { renderTemplate, getPhonePattern } = require('../src/generator');

// Minimal valid payload used as baseline for all tests
const VALID_PAYLOAD = {
  repoName: 'test-blitz-2026',
  eventName: 'Test Blitz',
  country: 'Test Country',
  phoneFormat: 'generic',
  leadTarget: 5,
  dashPassword: 'pass123',
  days: [{ label: 'Day 1', date: '2026-01-01' }],
  partners: ['PartnerA'],
  accountValidation: false,
  accounts: {},
  rooms: { 'Day 1': ['Room A'] },
  resources: []
};

describe('POST /create-event — integration tests with mocked dependencies', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Set up default happy-path mock return values
    checkRepo.mockResolvedValue({ exists: false });
    createRepo.mockResolvedValue({});
    uploadFile.mockResolvedValue({});
    createSheet.mockResolvedValue({ spreadsheetId: 'mock-sheet-id' });
    deployScript.mockResolvedValue({ scriptUrl: 'https://script.google.com/mock-url' });
    enablePages.mockResolvedValue({});
    deleteRepo.mockResolvedValue({});
    renderTemplate.mockReturnValue('<html>mock event page</html>');
    getPhonePattern.mockReturnValue({ regex: '[0-9]+', hint: 'any digits' });
  });

  // ── Test 1: Happy path ──────────────────────────────────────────────────────
  it('happy path — all steps succeed — returns 200 with GitHub Pages URL', async () => {
    const res = await request(app)
      .post('/create-event')
      .send(VALID_PAYLOAD);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ url: `https://myrnagamal1.github.io/${VALID_PAYLOAD.repoName}` });

    // Verify key steps were called
    expect(checkRepo).toHaveBeenCalledWith(VALID_PAYLOAD.repoName);
    expect(createRepo).toHaveBeenCalledWith(VALID_PAYLOAD.repoName);
    expect(createSheet).toHaveBeenCalledWith(VALID_PAYLOAD.eventName);
    expect(deployScript).toHaveBeenCalledWith('mock-sheet-id');
    expect(getPhonePattern).toHaveBeenCalledWith(VALID_PAYLOAD.phoneFormat);
    expect(renderTemplate).toHaveBeenCalled();
    expect(enablePages).toHaveBeenCalledWith(VALID_PAYLOAD.repoName);
    // uploadFile should have been called at least once (for index.html)
    expect(uploadFile).toHaveBeenCalled();
    // deleteRepo must NOT have been called on the happy path
    expect(deleteRepo).not.toHaveBeenCalled();
  });

  // ── Test 2: Repo already exists ─────────────────────────────────────────────
  it('repo already exists — returns 409 with error message', async () => {
    checkRepo.mockResolvedValue({ exists: true });

    const res = await request(app)
      .post('/create-event')
      .send(VALID_PAYLOAD);

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already exists/i);
    // No repo creation should have happened
    expect(createRepo).not.toHaveBeenCalled();
  });

  // ── Test 3: Cleanup on failure ───────────────────────────────────────────────
  it('cleanup on failure — repo created then createSheet throws — deleteRepo is called and 500 returned', async () => {
    // createRepo succeeds (repoCreated = true), then createSheet throws
    createRepo.mockResolvedValue({});
    createSheet.mockRejectedValue(new Error('Sheets API unavailable'));

    const res = await request(app)
      .post('/create-event')
      .send(VALID_PAYLOAD);

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Sheets API unavailable');
    // Cleanup must have been triggered
    expect(deleteRepo).toHaveBeenCalledWith(VALID_PAYLOAD.repoName);
  });

  // ── Test 4: Validation — missing repoName ────────────────────────────────────
  it('validation — missing repoName — returns 400', async () => {
    const { repoName: _omitted, ...payloadWithoutRepo } = VALID_PAYLOAD;

    const res = await request(app)
      .post('/create-event')
      .send(payloadWithoutRepo);

    expect(res.status).toBe(400);
    // No external calls should have been made
    expect(checkRepo).not.toHaveBeenCalled();
  });

  // ── Test 5: Validation — no partners ────────────────────────────────────────
  it('validation — empty partners array — returns 400', async () => {
    const res = await request(app)
      .post('/create-event')
      .send({ ...VALID_PAYLOAD, partners: [] });

    expect(res.status).toBe(400);
    expect(checkRepo).not.toHaveBeenCalled();
  });

  // ── Test 6: Validation — no days ────────────────────────────────────────────
  it('validation — empty days array — returns 400', async () => {
    const res = await request(app)
      .post('/create-event')
      .send({ ...VALID_PAYLOAD, days: [] });

    expect(res.status).toBe(400);
    expect(checkRepo).not.toHaveBeenCalled();
  });
});
