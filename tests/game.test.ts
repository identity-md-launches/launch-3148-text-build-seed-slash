import test from 'node:test';
import assert from 'node:assert/strict';
import { GameModel, segmentDistance, type Entity, type GameEvent, type NutKind } from '../src/game/model';

const target = (model: GameModel, kind: NutKind, x = 200, y = 200): Entity => {
  const entity = model.spawn(kind, x); entity.y = y; entity.vx = 0; entity.vy = 0; return entity;
};
const cut = (model: GameModel, y = 200) => model.slice({ x: 0, y }, { x: 400, y });

test('a fast swipe catches an intervening nut, removes it once, and makes two halves', () => {
  const model = new GameModel(390, 800);
  target(model, 'seed');
  assert.equal(cut(model), 1); assert.equal(model.score, 10); assert.equal(model.sliced, 1);
  assert.equal(cut(model), 0); assert.equal(model.score, 10);
  assert.equal(model.particles.filter(p => p.kind === 'seed').length, 2);
});
test('all four ordinary snacks score ten; golden seeds score double', () => {
  for (const kind of ['seed', 'almond', 'cashew', 'walnut', 'golden'] as NutKind[]) {
    const model = new GameModel(390, 800); target(model, kind); cut(model);
    assert.equal(model.score, kind === 'golden' ? 20 : 10);
  }
});
test('three snacks in one swipe award a combo, with no duplicate hit rewards', () => {
  const model = new GameModel(390, 800);
  [100, 200, 300].forEach(x => target(model, 'almond', x));
  assert.equal(cut(model), 3); assert.equal(model.score, 36);
  assert.equal(model.combo, 3); assert.equal(model.comboBonus, 6); assert.equal(model.bestCombo, 3);
  cut(model); assert.equal(model.score, 36);
  for (let i=0;i<15;i++) model.update(0.04, false);
  assert.equal(model.combo, 0); assert.equal(model.bestCombo, 3);
});
test('each bomb hit loses exactly one life, including two bombs in one swipe', () => {
  const events: GameEvent[] = [];
  const model = new GameModel(390, 800, () => 0.5, event => events.push(event));
  assert.equal(model.lives, 3); target(model, 'bomb'); target(model, 'bomb', 250);
  cut(model); assert.equal(model.lives, 1); assert.equal(model.score, 0); assert.equal(model.entities.length, 0);
  assert.equal(events.filter(e => e === 'bomb').length, 2);
});
test('every three missed nuts cost a life; missed bombs cost nothing', () => {
  const model = new GameModel(390, 800);
  for (let i=0;i<2;i++) { const e = target(model, 'seed', 200, 950); e.age = 1; }
  model.update(0.01, false); assert.equal(model.drops, 2); assert.equal(model.lives, 3);
  const e = target(model, 'cashew', 200, 950); e.age = 1;
  const bomb = target(model, 'bomb', 200, 950); bomb.age = 1;
  model.update(0.01, false); assert.equal(model.drops, 0); assert.equal(model.lives, 2);
});
test('the last life ends play; later updates and swipes cannot change the score', () => {
  const model = new GameModel(390, 800); model.lives = 1;
  target(model, 'bomb'); cut(model); assert.equal(model.over, true); assert.equal(model.lives, 0);
  const elapsed = model.elapsed; target(model, 'golden'); cut(model); model.update(0.04, true);
  assert.equal(model.elapsed, elapsed); assert.equal(model.score, 0);
});
test('launches rise from the bottom and progress under gravity, including after resize', () => {
  const model = new GameModel(390, 800, () => 0.5);
  const entity = model.spawn('walnut'); const y = entity.y;
  for(let i=0;i<10;i++) model.update(0.04, false);
  assert.ok(entity.y < y); assert.ok(entity.vy < 0);
  const x=entity.x; model.resize(780, 800); assert.equal(entity.x, x * 2);
});
test('a stationary press and a swipe outside the collision radius do not slice', () => {
  const model = new GameModel(390, 800); target(model, 'seed');
  assert.equal(model.slice({x:200,y:200},{x:200,y:200}), 0);
  assert.equal(cut(model, 300), 0);
  assert.equal(segmentDistance({x:50,y:10},{x:0,y:0},{x:100,y:0}), 10);
});
