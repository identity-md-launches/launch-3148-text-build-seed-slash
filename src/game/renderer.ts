import { GameModel, type NutKind, type Point } from './model';
export type TrailPoint = Point & { age: number };
export class GameRenderer {
  private sprites = new Map<NutKind, HTMLImageElement>();
  private ctx: CanvasRenderingContext2D;
  width = 0; height = 0;
  ready: Promise<void>;
  constructor(private canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) throw new Error('This browser does not support the game canvas.');
    this.ctx = ctx;
    this.ready = Promise.all((['seed', 'almond', 'cashew', 'walnut', 'golden', 'bomb'] as NutKind[]).map(kind => new Promise<void>((resolve, reject) => {
      const image = new Image(); image.onload = () => { this.sprites.set(kind, image); resolve(); };
      image.onerror = () => reject(new Error(`Could not load ${kind} artwork. Reload to retry.`));
      image.src = `${import.meta.env.BASE_URL}art/${kind}.svg`;
    }))).then(() => {});
  }
  resize() {
    const { width, height } = this.canvas.getBoundingClientRect();
    this.width = width; this.height = height;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(width * ratio); this.canvas.height = Math.round(height * ratio);
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }
  draw(model: GameModel, trail: TrailPoint[], reduced: boolean, keyboardLane: number | null) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
    if (model.goldenBonus) {
      const glow = ctx.createRadialGradient(this.width / 2, this.height, 0, this.width / 2, this.height, this.height);
      glow.addColorStop(0, '#e6ae3522'); glow.addColorStop(1, '#e6ae3500');
      ctx.fillStyle = glow; ctx.fillRect(0, 0, this.width, this.height);
    }
    if (keyboardLane !== null) {
      ctx.fillStyle = '#fff1ac12';
      ctx.fillRect(keyboardLane * this.width / 4, 80, this.width / 4, this.height - 100);
    }
    for (const e of model.entities) {
      const image = this.sprites.get(e.kind); if (!image) continue;
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.angle);
      if (e.kind === 'golden' && !reduced) { ctx.shadowColor = '#ffcb4f'; ctx.shadowBlur = 25; }
      ctx.drawImage(image, -e.radius, -e.radius, e.radius * 2, e.radius * 2.1);
      ctx.restore();
    }
    for (const p of model.particles) {
      if (reduced && !p.kind) continue;
      ctx.save(); ctx.globalAlpha = Math.min(1, p.life / 0.25);
      ctx.translate(p.x, p.y); ctx.rotate(p.angle);
      if (p.kind) {
        const image = this.sprites.get(p.kind);
        if (image) ctx.drawImage(image, p.half === 0 ? 0 : 50, 0, 50, 105,
          p.half === 0 ? -p.radius : 0, -p.radius, p.radius, p.radius * 2.1);
      } else {
        ctx.fillStyle = p.color; ctx.fillRect(-p.radius / 2, -p.radius / 2, p.radius, p.radius * 1.5);
      }
      ctx.restore();
    }
    if (trail.length > 1) {
      ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.shadowColor = '#ffd268'; ctx.shadowBlur = reduced ? 0 : 18;
      for (let i=1; i<trail.length; i++) {
        const a=trail[i-1]!, b=trail[i]!;
        ctx.globalAlpha = Math.max(0, 1 - b.age / 0.22);
        ctx.lineWidth = Math.max(1, 6 * (1 - b.age / 0.22)); ctx.strokeStyle = '#ffda70';
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        ctx.lineWidth *= 0.35; ctx.strokeStyle = '#fffbe4'; ctx.stroke();
      }
      ctx.restore();
    }
    ctx.textAlign = 'center';
    for (const text of model.texts) {
      ctx.save(); ctx.globalAlpha = Math.min(1, text.life / 0.2); ctx.fillStyle = text.color;
      ctx.shadowColor = '#142b24'; ctx.shadowBlur = 5;
      ctx.font = text.big ? '28px "Lilita One", sans-serif' : '800 20px Nunito, sans-serif';
      ctx.fillText(text.text, text.x, text.y); ctx.restore();
    }
    if (model.flash > 0 && !reduced) {
      ctx.fillStyle = `rgba(203, 116, 82, ${model.flash * 0.3})`;
      ctx.fillRect(0, 0, this.width, this.height);
    }
  }
}
