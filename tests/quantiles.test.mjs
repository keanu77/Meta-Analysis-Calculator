import test from 'node:test';
import assert from 'node:assert/strict';
import { run, close } from './harness.mjs';

// Reference values: R package meta (Schwarzer), internal functions
// mean_sd_range / mean_sd_iqr / mean_sd_iqr_range, which implement
// Luo 2018 eq.15, Wan 2014 eq.2/7/9/10/12-16 (with Wan's exact tables) and Shi 2020 eq.11.
const cases = [
  { n: 100, a: 10, q1: 20, m: 25, q3: 30, b: 40,
    s3luo: [25, 6.80210686721277], s3wan: [25, 6.76109077715261],
    s1luo: [25, 6.00338456182401], s1wan: [25, 6.00338456182401],
    s2luo: [25, 7.5187969924812], s2wan: [25, 7.5187969924812] },
  { n: 50, a: 2, q1: 5, m: 8, q3: 14, b: 40,
    s3luo: [10.28610905169996, 7.79345007584358], s3wan: [12, 7.65136540332557],
    s1luo: [10.28040015491938, 8.44819919964429], s1wan: [14.63, 8.44819919964429],
    s2luo: [9.0617, 6.85453160700686], s2wan: [9, 6.85453160700686] },
  { n: 12, a: 1, q1: 3, m: 4, q3: 7, b: 15,
    s3luo: [5.5340826045056, 4.06143324928641], s3wan: [5.5, 3.80627292096335],
    s1luo: [5.53147864510709, 4.29579625652041], s1wan: [6.16666666666667, 4.29579625652041],
    s2luo: [4.7325, 3.3167495854063], s2wan: [4.66666666666667, 3.3167495854063] },
  { n: 300, a: 0, q1: 2, m: 5, q3: 9, b: 30,
    s3luo: [5.63053194846461, 5.22083802003917], s3wan: [7.75, 5.22452260636101],
    s1luo: [5.52573234814947, 5.23464472025893], s1wan: [10.01666666666667, 5.23464472025893],
    s2luo: [5.35065, 5.21440049246309], s2wan: [5.33333333333333, 5.21440049246309] },
];

const quantile = (method, c, fields) => {
  const inputs = { 'quantile-method': method, 'q-n': c.n, 'q-median': c.m };
  if (fields.includes('range')) Object.assign(inputs, { 'q-min': c.a, 'q-max': c.b });
  if (fields.includes('iqr')) Object.assign(inputs, { 'q-q1': c.q1, 'q-q3': c.q3 });
  return run('calculateQuantilesToMeanSD', inputs, 'quantiles-result');
};
const expectMeanSD = (output, [mean, sd]) => {
  assert.equal(output.error, false, output.text);
  close(output.result.mean, mean, 1e-8);
  close(output.result.SD, sd, 1e-8);
};

for (const c of cases) {
  const label = `n=${c.n} (${c.a},${c.q1},${c.m},${c.q3},${c.b})`;
  test(`Luo mean + Shi SD, five-number summary, ${label}`, () => expectMeanSD(quantile('luo', c, ['range', 'iqr']), c.s3luo));
  test(`Wan, five-number summary, ${label}`, () => expectMeanSD(quantile('wan', c, ['range', 'iqr']), c.s3wan));
  test(`Luo mean + Wan SD, median and range, ${label}`, () => expectMeanSD(quantile('luo', c, ['range']), c.s1luo));
  test(`Wan, median and range, ${label}`, () => expectMeanSD(quantile('wan', c, ['range']), c.s1wan));
  test(`Luo mean + Wan SD, median and IQR, ${label}`, () => expectMeanSD(quantile('luo', c, ['iqr']), c.s2luo));
  test(`Wan, median and IQR, ${label}`, () => expectMeanSD(quantile('wan', c, ['iqr']), c.s2wan));
}

test('Hozo keeps its published piecewise rules', () => {
  const c = cases[0];
  expectMeanSD(quantile('hozo', c, ['range']), [25, 5]);
  const small = run('calculateQuantilesToMeanSD', { 'quantile-method': 'hozo', 'q-n': 10, 'q-min': 1, 'q-median': 4, 'q-max': 15 }, 'quantiles-result');
  expectMeanSD(small, [6, Math.sqrt(((1 - 8 + 15) ** 2 / 4 + 14 ** 2) / 12)]);
});

const reject = [
  ['only Q1 without Q3', { 'quantile-method': 'luo', 'q-n': 30, 'q-q1': 2, 'q-median': 4 }],
  ['only min without max', { 'quantile-method': 'wan', 'q-n': 30, 'q-min': 1, 'q-median': 4 }],
  ['median only', { 'quantile-method': 'luo', 'q-n': 30, 'q-median': 4 }],
  ['Hozo without range', { 'quantile-method': 'hozo', 'q-n': 30, 'q-q1': 2, 'q-median': 4, 'q-q3': 6 }],
  ['sample size one', { 'quantile-method': 'luo', 'q-n': 1, 'q-min': 1, 'q-median': 4, 'q-max': 6 }],
  ['unknown method', { 'quantile-method': 'shi-old', 'q-n': 30, 'q-min': 1, 'q-median': 4, 'q-max': 6 }],
];
for (const [label, inputs] of reject) {
  test(`quantile conversion reports an error for ${label}`, () => {
    const output = run('calculateQuantilesToMeanSD', inputs, 'quantiles-result');
    assert.equal(output.error, true, output.text);
    assert.ok(output.text.length > 0, 'error must be visible');
    assert.equal(output.result, undefined);
  });
}

test('Hozo-only calculator accepts ties such as min = median', () => {
  const output = run('calculateHozoOnly', { 'hozo-min': 0, 'hozo-median': 0, 'hozo-max': 12, 'hozo-n': 40 }, 'hozo-only-result');
  expectMeanSD(output, [0, 3]);
});
