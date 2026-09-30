import test from 'node:test';
import assert from 'node:assert/strict';
import { run, close } from './harness.mjs';

const Z95 = 1.959963984540054; // R: qnorm(0.975)
const ok = (output) => { assert.equal(output.error, false, output.text); return output.result; };

test('CI to SD uses exact t quantile (R: qt(0.975, 24))', () => {
  const v = ok(run('calculateCItoMeanSD', { 'ci-lower': 8, 'ci-upper': 12, 'ci-level': 95, 'ci-n': 25, 'ci-distribution': 't' }, 'ci-mean-sd-result'));
  close(v.criticalValue, 2.06389856162802, 1e-7);
  close(v.SD, (4 / (2 * v.criticalValue)) * 5);
});

test('Hedges g SE is J × SE(d) (Borenstein 2009 eq. 4.24)', () => {
  const v = ok(run('calculateSMD', { 'smd-mean1': 12, 'smd-sd1': 2, 'smd-n1': 10, 'smd-mean2': 10, 'smd-sd2': 2, 'smd-n2': 10, 'smd-correction': true }, 'smd-result'));
  const j = 1 - 3 / 71;
  close(v.hedgesG, j);
  close(v.SE, j * Math.sqrt(0.2 + 1 / 40));
});

test('Cohen d SE without correction', () => {
  const v = ok(run('calculateSMD', { 'smd-mean1': 12, 'smd-sd1': 2, 'smd-n1': 10, 'smd-mean2': 10, 'smd-sd2': 2, 'smd-n2': 10, 'smd-correction': false }, 'smd-result'));
  close(v.SE, Math.sqrt(0.2 + 1 / 40));
});

test('small p values keep tail precision (R: 2*pnorm(-6))', () => {
  const v = ok(run('calculateESConversion', { 'es-type': 'mean', 'es-value': 6, 'es-se': 1, 'es-ci-level': 95 }, 'es-conversion-result'));
  assert.ok(Math.abs(v.p / 1.9731752900754e-9 - 1) < 1e-6, String(v.p));
});

test('zero cell without correction still gives RD; OR/RR marked not estimable', () => {
  const out = run('calculateBinaryOutcomes', { 'bin-events1': 0, 'bin-total1': 50, 'bin-events2': 5, 'bin-total2': 50, 'bin-correction': 'none' }, 'binary-result');
  const v = ok(out);
  close(v.RD, -0.1);
  close(v.SE_RD, Math.sqrt(0.1 * 0.9 / 50));
  assert.equal(v.OR, null);
  assert.equal(v.RR, null);
  assert.match(out.text, /無法估計/);
});

test('Haldane correction applies to OR/RR only; RD uses raw counts', () => {
  const v = ok(run('calculateBinaryOutcomes', { 'bin-events1': 0, 'bin-total1': 50, 'bin-events2': 5, 'bin-total2': 50, 'bin-correction': 'haldane' }, 'binary-result'));
  close(v.OR, (0.5 * 45.5) / (50.5 * 5.5));
  close(v.RR, (0.5 / 51) / (5.5 / 51));
  close(v.RD, -0.1);
});

test('double-zero study gives no OR/RR even with correction', () => {
  const out = run('calculateBinaryOutcomes', { 'bin-events1': 0, 'bin-total1': 40, 'bin-events2': 0, 'bin-total2': 60, 'bin-correction': 'haldane' }, 'binary-result');
  const v = ok(out);
  assert.equal(v.OR, null);
  assert.equal(v.RR, null);
  close(v.RD, 0);
  assert.match(out.text, /兩組皆無事件/);
});

test('ratio-scale OR and CI are log-transformed automatically', () => {
  const v = ok(run('calculateESConversion', { 'es-type': 'or', 'es-value': 1.5, 'es-ci-lower': 1.1, 'es-ci-upper': 2, 'es-ci-level': 95 }, 'es-conversion-result'));
  close(v.effectSize, Math.log(1.5));
  close(v.SE, (Math.log(2) - Math.log(1.1)) / (2 * Z95));
  close(v.ratio, 1.5);
  close(v.ratio_CI_lower, 1.1);
});

test('ratio CI only: point estimate is the geometric midpoint', () => {
  const v = ok(run('calculateESConversion', { 'es-type': 'hr', 'es-ci-lower': 0.5, 'es-ci-upper': 2, 'es-ci-level': 95 }, 'es-conversion-result'));
  close(v.ratio, 1);
  close(v.effectSize, 0);
});

test('rounded published values within the CI are accepted with a note', () => {
  const out = run('calculateESConversion', { 'es-type': 'mean', 'es-value': 2.3, 'es-ci-lower': 1.1, 'es-ci-upper': 3.4, 'es-ci-level': 95 }, 'es-conversion-result');
  const v = ok(out);
  close(v.effectSize, 2.3);
  close(v.SE, 2.3 / (2 * Z95));
});

test('SE that disagrees with the CI is flagged and the CI-derived SE is used', () => {
  const out = run('calculateESConversion', { 'es-type': 'mean', 'es-value': 2, 'es-se': 1, 'es-ci-lower': 1, 'es-ci-upper': 3, 'es-ci-level': 95 }, 'es-conversion-result');
  const v = ok(out);
  close(v.SE, 2 / (2 * Z95));
  assert.match(out.text, /不一致/);
});

test('change SD with r = 1 and equal SDs is exactly zero, not NaN', () => {
  const v = ok(run('calculateChangeSD', { 'change-sd-pre': 0.1, 'change-sd-post': 0.1, 'change-r': 1 }, 'change-sd-result'));
  assert.equal(v.changeSD, 0);
});
