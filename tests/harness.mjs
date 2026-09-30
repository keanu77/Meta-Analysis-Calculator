import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const scripts = ['stats-math.js','calculator-core.js','modules/quantile-methods.js','modules/module-a.js','modules/module-b.js','modules/module-c.js'];
export function run(name, inputs, resultId) {
  const elements = new Map();
  for (const [id, value] of Object.entries(inputs)) elements.set(id, { value: String(value), checked: value === true });
  const states = new Set();
  const result = { textContent: '', querySelector: () => null, classList: { add: (name) => states.add(name), remove: (name) => states.delete(name) } };
  elements.set(resultId, result);
  const context = vm.createContext({ console, document: { addEventListener() {}, getElementById(id) { if (!elements.has(id)) elements.set(id,{value:''}); return elements.get(id); } } });
  for (const script of scripts) vm.runInContext(readFileSync(new URL(`../${script}`, import.meta.url), 'utf8'), context);
  vm.runInContext(`${name}()`, context);
  return { text: result.textContent, error: states.has('has-error'), result: vm.runInContext('calculationHistory.at(-1)?.outputs', context) };
}
export function close(actual, expected, epsilon = 1e-9) { assert.ok(Math.abs(actual - expected) < epsilon, `${actual} != ${expected}`); }
