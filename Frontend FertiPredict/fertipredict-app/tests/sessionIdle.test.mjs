import test from 'node:test';
import assert from 'node:assert/strict';
import { idleStage, IDLE_WARNING_MS, IDLE_LOGOUT_MS } from '../src/utils/sessionIdle.ts';

test('warns at twenty minutes and expires at thirty minutes', () => {
  const start = 100000;
  assert.equal(idleStage(start, start + IDLE_WARNING_MS - 1), 'active');
  assert.equal(idleStage(start, start + IDLE_WARNING_MS), 'warning');
  assert.equal(idleStage(start, start + IDLE_LOGOUT_MS - 1), 'warning');
  assert.equal(idleStage(start, start + IDLE_LOGOUT_MS), 'expired');
});
test('suspension does not postpone expiration and renewed activity resets elapsed time', () => {
  const start = 100000;
  const now = start + 45 * 60000;
  assert.equal(idleStage(start, now), 'expired');
  assert.equal(idleStage(now, now), 'active');
  assert.equal(idleStage(now, now - 1), 'active');
});
