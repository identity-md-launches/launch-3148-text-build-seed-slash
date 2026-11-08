import test from 'node:test';
import assert from 'node:assert/strict';
import { readBest, saveBest, readSetting, saveSetting } from '../src/storage';
test('best scores persist monotonically and malformed saved values are rejected', () => {
  const values = new Map<string,string>();
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>values.set(key,value)}});
  assert.equal(readBest(),0); assert.equal(saveBest(120),true); assert.equal(readBest(),120);
  saveBest(10); assert.equal(readBest(),120);
  for(const invalid of ['abc','-10','Infinity','1.5','999999999999999999999']) { values.set('seed-slash.best',invalid); assert.equal(readBest(),0); }
  saveSetting('sound',false); assert.equal(readSetting('sound',true),false);
});
test('blocked localStorage cannot prevent starting or finishing a round', () => {
  Object.defineProperty(globalThis,'localStorage',{configurable:true,get(){throw new Error('Storage blocked');}});
  assert.equal(readBest(),0); assert.equal(saveBest(60),false); assert.equal(readSetting('sound',true),true);
  assert.doesNotThrow(()=>saveSetting('sound',false));
});
