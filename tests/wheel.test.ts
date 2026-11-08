import test from 'node:test';
import assert from 'node:assert/strict';
import { parseWheelStatus, isGoldenBonus, localStatus } from '../src/wheel';
const now = Date.now();
const reading = () => ({ schemaVersion:1, generatedAt:new Date(now-1000).toISOString(),
  measurement:{provenance:'hardware',freshness:'online',observedAt:new Date(now-2000).toISOString(),staleAfterSeconds:120,coreStatus:'ACTIVE',rpmMilli:5000},
  oracle:{state:'accepted'},signer:{lastVerifiedAt:new Date(now-1500).toISOString()} });
test('fresh, accepted, hardware data explicitly enables running; idle disables bonus', () => {
  const data=reading(); assert.equal(parseWheelStatus(data, now).running, true);
  data.measurement.coreStatus='IDLE'; data.measurement.rpmMilli=0;
  const idle=parseWheelStatus(data, now); assert.equal(idle.mode, 'live'); assert.equal(idle.running, false);
});
test('simulated, replay, derived, absent and malformed data cannot be presented as live', () => {
  for(const provenance of ['simulated','replay','derived','']) {
    const data=reading(); data.measurement.provenance=provenance;
    assert.equal(parseWheelStatus(data, now).mode, 'local');
  }
  for(const data of [null,[],{},'ACTIVE',{running:true},{...reading(),schemaVersion:2}])
    assert.equal(parseWheelStatus(data, now).mode, 'local');
});
test('stale, expired, future-dated and unverified readings fail closed', () => {
  const old=reading(); old.measurement.observedAt=new Date(now-121000).toISOString();
  assert.equal(parseWheelStatus(old, now).mode,'local');
  const future=reading(); future.generatedAt=new Date(now+60_000).toISOString();
  assert.equal(parseWheelStatus(future, now).mode,'local');
  const oracle=reading(); oracle.oracle.state='rejected'; assert.equal(parseWheelStatus(oracle, now).mode,'local');
  const signer=reading(); signer.signer.lastVerifiedAt='invalid'; assert.equal(parseWheelStatus(signer, now).mode,'local');
});
test('offline, counter faults, invalid RPM and contradictory statuses never trigger live bonus', () => {
  for(const [coreStatus,rpmMilli] of [['COUNTER_FAULT',5],['SPINNING',5],['ACTIVE',0],['IDLE',10],['ACTIVE',-1],['ACTIVE',NaN]] as const) {
    const data=reading(); data.measurement.coreStatus=coreStatus; data.measurement.rpmMilli=rpmMilli;
    assert.equal(parseWheelStatus(data,now).mode,'local');
  }
  const data=reading(); data.measurement.freshness='stale'; assert.equal(parseWheelStatus(data,now).mode,'local');
});
test('local bonus uses play time: twelve seconds each thirty seconds; live data does not use local timer', () => {
  const local=localStatus('Unavailable',now);
  assert.equal(isGoldenBonus(local,0),true); assert.equal(isGoldenBonus(local,11.99),true);
  assert.equal(isGoldenBonus(local,12),false); assert.equal(isGoldenBonus(local,29.99),false);
  assert.equal(isGoldenBonus(local,30),true);
  const idle=parseWheelStatus({...reading(),measurement:{...reading().measurement,coreStatus:'IDLE',rpmMilli:0}},now);
  assert.equal(isGoldenBonus(idle,0),false);
  const expired={...parseWheelStatus(reading(),now),expiresAt:Date.now()-1};
  assert.equal(isGoldenBonus(expired,0),false);
});
