export type NutKind = 'seed' | 'almond' | 'cashew' | 'walnut' | 'golden' | 'bomb';
export type Point = { x: number; y: number };
export type Entity = Point & {
  id: number; kind: NutKind; vx: number; vy: number; radius: number;
  angle: number; spin: number; age: number;
};
export type Particle = Point & {
  vx: number; vy: number; life: number; maxLife: number;
  radius: number; color: string; angle: number; spin: number;
  kind?: NutKind; half?: number;
};
export type FloatingText = Point & { text: string; life: number; color: string; big: boolean };
export type GameSnapshot = {
  score: number; lives: number; drops: number; sliced: number;
  combo: number; bestCombo: number; comboBonus: number; elapsed: number;
  over: boolean; goldenBonus: boolean;
};
export type GameEvent = 'slice' | 'golden' | 'combo' | 'bomb' | 'miss' | 'over';
const kinds: NutKind[] = ['seed', 'almond', 'cashew', 'walnut'];
const colors = ['#f3d69d', '#c28a56', '#fff1bc', '#86ac75', '#ebbd5c'];

export function segmentDistance(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x, dy = b.y - a.y;
  const length = dx * dx + dy * dy;
  const t = length === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / length));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

export class GameModel {
  entities: Entity[] = [];
  particles: Particle[] = [];
  texts: FloatingText[] = [];
  score = 0; lives = 3; drops = 0; sliced = 0;
  combo = 0; bestCombo = 0; comboBonus = 0;
  elapsed = 0; over = false; goldenBonus = false; flash = 0;
  private nextId = 1;
  private waveTime = 0.55;
  private lastSlice = -10;
  constructor(public width: number, public height: number, private random = Math.random,
    public onEvent: (event: GameEvent) => void = () => {}) {}

  get snapshot(): GameSnapshot {
    return { score: this.score, lives: this.lives, drops: this.drops, sliced: this.sliced,
      combo: this.combo, bestCombo: this.bestCombo, comboBonus: this.comboBonus,
      elapsed: this.elapsed, over: this.over, goldenBonus: this.goldenBonus };
  }

  resize(width: number, height: number) {
    const sx = width / this.width, sy = height / this.height;
    for (const item of this.entities) { item.x *= sx; item.y *= sy; item.vx *= sx; item.vy *= sy; }
    this.width = width; this.height = height;
  }

  spawn(kind?: NutKind, x?: number): Entity {
    const radius = Math.max(24, Math.min(39, this.width * 0.065));
    const launchX = x ?? this.width * (0.15 + this.random() * 0.7);
    const entity: Entity = {
      id: this.nextId++, kind: kind ?? (this.random() < (this.goldenBonus ? 0.45 : 0.07) ? 'golden' : kinds[Math.floor(this.random() * 4)]!),
      x: launchX, y: this.height + radius,
      vx: (this.width / 2 - launchX) * 0.12 + (this.random() - 0.5) * this.width * 0.11,
      vy: -this.height * (0.91 + this.random() * 0.15), radius,
      angle: (this.random() - 0.5) * 1.2, spin: (this.random() - 0.5) * 3, age: 0,
    };
    this.entities.push(entity);
    return entity;
  }

  update(dt: number, bonus: boolean) {
    if (this.over) return;
    dt = Math.min(dt, 0.04);
    this.elapsed += dt; this.goldenBonus = bonus;
    this.flash = Math.max(0, this.flash - dt * 2.5);
    if (this.elapsed - this.lastSlice > 0.5) { this.combo = 0; this.comboBonus = 0; }
    this.waveTime -= dt;
    if (this.waveTime <= 0) {
      const count = 2 + Math.floor(this.random() * (this.elapsed > 20 ? 3 : 2));
      const center = this.width * (0.28 + this.random() * 0.44);
      const gap = Math.min(78, this.width * 0.15);
      for (let i = 0; i < count; i++) this.spawn(undefined, Math.max(38, Math.min(this.width - 38, center + (i - (count - 1) / 2) * gap)));
      if (this.elapsed > 6 && this.random() < Math.min(0.65, 0.25 + this.elapsed / 180)) this.spawn('bomb');
      this.waveTime = Math.max(0.85, 1.65 - this.elapsed * 0.006);
    }
    const remaining: Entity[] = [];
    for (const entity of this.entities) {
      entity.age += dt; entity.vy += this.height * 0.79 * dt;
      entity.x += entity.vx * dt; entity.y += entity.vy * dt; entity.angle += entity.spin * dt;
      if (entity.y > this.height + entity.radius * 2 && entity.age > 0.5) {
        if (entity.kind !== 'bomb') {
          this.drops++;
          if (this.drops >= 3) { this.drops = 0; this.loseLife('miss'); }
        }
      } else remaining.push(entity);
    }
    this.entities = remaining;
    for (const particle of this.particles) {
      particle.life -= dt; particle.x += particle.vx * dt; particle.y += particle.vy * dt;
      particle.vy += this.height * 0.55 * dt; particle.angle += particle.spin * dt;
    }
    this.particles = this.particles.filter(p => p.life > 0).slice(-180);
    for (const text of this.texts) { text.life -= dt; text.y -= dt * 40; }
    this.texts = this.texts.filter(t => t.life > 0).slice(-12);
  }

  slice(a: Point, b: Point, extraRadius = 0): number {
    if (this.over || Math.hypot(b.x - a.x, b.y - a.y) < 2) return 0;
    const hits = this.entities.filter(e => segmentDistance(e, a, b) < e.radius * 0.85 + extraRadius);
    const ids = new Set(hits.map(e => e.id));
    this.entities = this.entities.filter(e => !ids.has(e.id));
    let count = 0;
    for (const entity of hits) {
      if (this.over) break;
      if (entity.kind === 'bomb') {
        this.explode(entity);
        this.loseLife('bomb');
        this.texts.push({ x: entity.x, y: entity.y - 30, text: 'Ouch! −1 life', life: 1.1, color: '#ffb299', big: false });
        this.combo = 0; this.comboBonus = 0; this.lastSlice = -10;
        continue;
      }
      count++; this.sliced++;
      this.combo = this.elapsed - this.lastSlice <= 0.5 ? this.combo + 1 : 1;
      this.lastSlice = this.elapsed;
      this.bestCombo = Math.max(this.bestCombo, this.combo);
      const base = entity.kind === 'golden' ? 20 : 10;
      const comboExtra = this.combo >= 3 ? this.combo * 2 : 0;
      this.comboBonus += comboExtra;
      this.score += base + comboExtra;
      this.texts.push({ x: entity.x, y: entity.y - 20, text: `+${base + comboExtra}`, life: 0.85,
        color: entity.kind === 'golden' ? '#ffda70' : '#fff3c9', big: false });
      if (this.combo === 3) {
        this.texts.push({ x: this.width / 2, y: Math.max(145, this.height * 0.28),
          text: 'Nutty combo!', life: 1.1, color: '#ffda70', big: true });
        this.onEvent('combo');
      } else this.onEvent(entity.kind === 'golden' ? 'golden' : 'slice');
      this.burst(entity);
    }
    return count;
  }

  private loseLife(reason: 'bomb' | 'miss') {
    if (this.over) return;
    this.lives = Math.max(0, this.lives - 1);
    this.combo = 0; this.flash = reason === 'bomb' ? 0.55 : 0.13;
    this.onEvent(reason);
    if (this.lives === 0) { this.over = true; this.onEvent('over'); }
  }

  private burst(entity: Entity) {
    for (let half=0; half<2; half++) this.particles.push({ ...entity, kind: entity.kind, half,
      vx: entity.vx + (half === 0 ? -100 : 100), vy: -80 - this.random() * 90,
      life: 0.65, maxLife: 0.65, color: '', spin: half === 0 ? -4 : 4 });
    for (let i=0; i<12; i++) {
      const angle = this.random() * Math.PI * 2, speed = 65 + this.random() * 180;
      this.particles.push({ x: entity.x, y: entity.y, vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 60, life: 0.4 + this.random() * 0.4, maxLife: 0.8,
        radius: 2 + this.random() * 4, color: colors[i % colors.length]!, angle, spin: 6 });
    }
  }
  private explode(entity: Entity) {
    for (let i=0; i<22; i++) {
      const angle = this.random() * Math.PI * 2, speed = 60 + this.random() * 230;
      this.particles.push({ x: entity.x, y: entity.y, vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed, life: 0.65, maxLife: 0.65,
        radius: 3 + this.random() * 6, color: i % 2 ? '#f4b56b' : '#ffdfad', angle, spin: 8 });
    }
  }
}
