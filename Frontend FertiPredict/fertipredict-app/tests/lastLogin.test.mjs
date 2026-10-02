import test from 'node:test';
import assert from 'node:assert/strict';
import { daysSinceLogin, lastLoginLabel, lastLoginDate } from '../src/utils/lastLogin.ts';
const login = '2026-10-01T05:00:00Z';
const start = Date.parse(login);
test('counts full days across timezone representations and boundaries', () => {
  assert.equal(daysSinceLogin(login, start + 86400000 - 1), 0);
  assert.equal(lastLoginLabel(login, start + 86400000), '1 día');
  assert.equal(lastLoginLabel('2026-10-01T00:00:00-05:00', start + 3 * 86400000), '3 días');
  assert.equal(lastLoginLabel(login, start), 'Menos de 1 día');
  assert.equal(daysSinceLogin(login, start - 1000), 0);
});
test('missing history is not represented as a made-up last login', () => {
  for (const value of [null, undefined, '', 'invalid']) {
    assert.equal(daysSinceLogin(value, start), null);
    assert.equal(lastLoginLabel(value, start), 'Sin registro');
    assert.equal(lastLoginDate(value), 'Sin inicio de sesión registrado');
  }
});
