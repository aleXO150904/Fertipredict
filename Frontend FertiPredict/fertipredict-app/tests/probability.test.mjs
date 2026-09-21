import test from 'node:test';
import assert from 'node:assert/strict';
import { formatProbability, probabilityBarWidth } from '../src/utils/probability.ts';

test('preserves the API percentage scale around the former 1% threshold', () => {
  for (const [value, expected] of [[0, '0.00%'], [0.67, '0.67%'], [1, '1.00%'], [1.01, '1.01%'], [67, '67.00%'], [100, '100.00%']]) {
    assert.equal(formatProbability(value), expected);
    assert.equal(probabilityBarWidth(value), value);
  }
});
test('does not display invalid or missing probabilities as valid percentages', () => {
  for (const value of [null, undefined, NaN, Infinity, -1, 101]) {
    assert.equal(formatProbability(value), 'No registrado');
    assert.equal(probabilityBarWidth(value), 0);
  }
});
