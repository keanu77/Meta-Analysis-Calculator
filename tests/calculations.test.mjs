import test from 'node:test';
import assert from 'node:assert/strict';
import { run, close } from './harness.mjs';
// Exact two-sided 95% normal critical value (R: qnorm(0.975)).
const Z95 = 1.959963984540054;
const se = { 'se-input': 2, 'se-n-input': 25 };
const pooled = { 'pooled-sd1': 2, 'pooled-n1': 10, 'pooled-sd2': 4, 'pooled-n2': 10 };
const smd = { 'smd-mean1':12,'smd-sd1':2,'smd-n1':25,'smd-mean2':10,'smd-sd2':2,'smd-n2':25,'smd-correction':true };
const binary = { 'bin-events1':10,'bin-total1':100,'bin-events2':20,'bin-total2':100,'bin-correction':'haldane' };
const ci = { 'es-type':'mean','es-value':2,'es-se':1,'es-ci-level':95 };
test('SE 2 with n 25 gives SD 10',()=>close(run('calculateSEtoSD',se,'se-sd-result').result.SD,10));
test('known normal CI gives mean 10 and SD 10',()=>{
 const value=run('calculateCItoMeanSD',{'ci-lower':10-2*Z95,'ci-upper':10+2*Z95,'ci-level':95,'ci-n':25,'ci-distribution':'normal'},'ci-mean-sd-result').result;close(value.mean,10);close(value.SD,10);
});
test('pooled SD with equal group sizes gives sqrt10',()=>close(run('calculatePooledSD',pooled,'pooled-sd-result').result.pooledSD,Math.sqrt(10)));
test('uncorrelated SD 3 and 4 give change SD 5',()=>close(run('calculateChangeSD',{'change-sd-pre':3,'change-sd-post':4,'change-r':0},'change-sd-result').result.changeSD,5));
test('MD known example gives difference2 SE1 and CI[0.04,3.96]',()=>{
 const value=run('calculateMD',{'md-mean1':12,'md-sd1':3,'md-n1':25,'md-mean2':10,'md-sd2':4,'md-n2':25},'md-result').result;close(value.MD,2);close(value.SE,1);close(value.CI95_lower,2-Z95);close(value.CI95_upper,2+Z95);
});
test('SMD preserves existing Hedges correction',()=>{const v=run('calculateSMD',smd,'smd-result').result;close(v.cohensD,1);close(v.hedgesG,188/191);});
test('known 2x2 gives OR4/9 RR1/2 RD-0.1',()=>{const v=run('calculateBinaryOutcomes',binary,'binary-result').result;close(v.OR,4/9);close(v.RR,.5);close(v.RD,-.1);});
test('ES2 SE1 gives CI[0.04,3.96]',()=>{const v=run('calculateESConversion',ci,'es-conversion-result').result;close(v.CI_lower,2-Z95);close(v.CI_upper,2+Z95);});
test('CI-only calculation gives ES2 SE1',()=>{const v=run('calculateESConversion',{'es-type':'mean','es-ci-lower':2-Z95,'es-ci-upper':2+Z95,'es-ci-level':95},'es-conversion-result').result;close(v.effectSize,2);close(v.SE,1);});
test('consistent supplied ES is preserved rather than silently replaced',()=>{const v=run('calculateESConversion',{'es-type':'mean','es-value':2.0005,'es-ci-lower':1,'es-ci-upper':3,'es-ci-level':95},'es-conversion-result').result;close(v.effectSize,2.0005);});
const invalid = [
 ['negative SE','calculateSEtoSD',{...se,'se-input':-2},'se-sd-result'],
 ['fractional sample size','calculateSEtoSD',{...se,'se-n-input':25.5},'se-sd-result'],
 ['overflowing SE','calculateSEtoSD',{...se,'se-input':'1e309'},'se-sd-result'],
 ['overflowing output','calculateSEtoSD',{...se,'se-input':'1e308'},'se-sd-result'],
 ['unsafe integer sample size','calculateSEtoSD',{...se,'se-n-input':'9007199254740993'},'se-sd-result'],
 ['zero pooled df','calculatePooledSD',{...pooled,'pooled-n1':1,'pooled-n2':1},'pooled-sd-result'],
 ['negative SD','calculatePooledSD',{...pooled,'pooled-sd1':-1},'pooled-sd-result'],
 ['SMD zero denominator','calculateSMD',{...smd,'smd-sd1':0,'smd-sd2':0},'smd-result'],
 ['SMD zero df','calculateSMD',{...smd,'smd-n1':1,'smd-n2':1},'smd-result'],
 ['fractional events','calculateBinaryOutcomes',{...binary,'bin-events1':.5},'binary-result'],
 ['unknown zero-cell correction','calculateBinaryOutcomes',{...binary,'bin-events1':0,'bin-correction':'continuity'},'binary-result'],
 ['SMD group of one','calculateSMD',{...smd,'smd-n1':1,'smd-n2':5},'smd-result'],
 ['CI to SD with n of one','calculateCItoMeanSD',{'ci-lower':1,'ci-upper':3,'ci-level':95,'ci-n':1,'ci-distribution':'normal'},'ci-mean-sd-result'],
 ['unknown CI distribution','calculateCItoMeanSD',{'ci-lower':1,'ci-upper':3,'ci-level':95,'ci-n':20,'ci-distribution':'x'},'ci-mean-sd-result'],
 ['non-positive ratio CI','calculateESConversion',{'es-type':'or','es-ci-lower':0,'es-ci-upper':2,'es-ci-level':95},'es-conversion-result'],
 ['negative SE in CI conversion','calculateESConversion',{...ci,'es-se':-1},'es-conversion-result'],
 ['zero SE in CI conversion','calculateESConversion',{...ci,'es-se':0},'es-conversion-result'],
 ['reversed CI','calculateESConversion',{...ci,'es-ci-lower':4,'es-ci-upper':2},'es-conversion-result'],
 ['inconsistent ES','calculateESConversion',{...ci,'es-value':8,'es-ci-lower':1,'es-ci-upper':3},'es-conversion-result'],
 ['partial CI','calculateESConversion',{...ci,'es-ci-lower':1},'es-conversion-result'],
 ['reversed quantiles','calculateQuantilesToMeanSD',{'quantile-method':'wan','q-min':1,'q-q1':4,'q-median':3,'q-q3':5,'q-max':6,'q-n':25},'quantiles-result'],
 ['negative change SD','calculateChangeSD',{'change-sd-pre':-3,'change-sd-post':4,'change-r':0},'change-sd-result'],
];
for(const [label, name, values, id] of invalid) test(`rejects ${label} without saving invalid result`,()=>{const output=run(name,values,id);assert.equal(output.error,true,output.text);assert.equal(output.result,undefined);});
