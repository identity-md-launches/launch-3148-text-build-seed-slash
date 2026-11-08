import { useEffect, useRef, useState } from 'react';
import { GameModel, type GameSnapshot, type Point } from './game/model';
import { GameRenderer, type TrailPoint } from './game/renderer';
import type { GameAudio } from './game/audio';
import { isGoldenBonus, type WheelStatus } from './wheel';

type Props = { paused: boolean; wheel: WheelStatus; audio: GameAudio;
  onUpdate: (snapshot: GameSnapshot) => void; onOver: (snapshot: GameSnapshot) => void; onPause: () => void };
export function Game({ paused, wheel, audio, onUpdate, onOver, onPause }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const props = useRef({ paused, wheel, audio, onUpdate, onOver, onPause });
  props.current = { paused, wheel, audio, onUpdate, onOver, onPause };
  const [error, setError] = useState('');
  useEffect(() => {
    if (!canvas.current) return;
    const element = canvas.current;
    let renderer: GameRenderer;
    try { renderer = new GameRenderer(element); } catch (e) { setError((e as Error).message); return; }
    renderer.resize();
    const model = new GameModel(renderer.width, renderer.height, Math.random, event => props.current.audio.play(event));
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0, last = 0, hudTime = 0, ready = false, disposed = false, reported = false;
    let trail: TrailPoint[] = [], previous: Point | null = null, pointerId: number | null = null;
    let keyboardLane: number | null = null, keyboardTime = 0;
    renderer.ready.then(() => { ready = true; }).catch(e => { if (!disposed) setError(e.message); });
    const observer = new ResizeObserver(() => { renderer.resize(); model.resize(renderer.width, renderer.height); previous = null; trail = []; });
    observer.observe(element);
    function loop(time: number) {
      if (disposed) return;
      const dt = last ? Math.min((time - last) / 1000, 0.04) : 0;
      last = time;
      if (ready && !props.current.paused && !model.over) {
        model.update(dt, isGoldenBonus(props.current.wheel, model.elapsed));
        hudTime += dt;
        if (hudTime >= 0.08) { props.current.onUpdate(model.snapshot); hudTime = 0; }
        if (model.over && !reported) { reported = true; props.current.onOver(model.snapshot); }
      } else { previous = null; pointerId = null; trail = []; }
      trail.forEach(point => point.age += dt); trail = trail.filter(point => point.age < 0.22).slice(-35);
      keyboardTime -= dt; if (keyboardTime <= 0) keyboardLane = null;
      renderer.draw(model, trail, reduced.matches, keyboardLane);
      frame = requestAnimationFrame(loop);
    }
    frame = requestAnimationFrame(loop);
    const point = (event: PointerEvent): Point => {
      const rect = element.getBoundingClientRect(); return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };
    const down = (event: PointerEvent) => {
      if (props.current.paused || model.over || !event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
      event.preventDefault(); props.current.audio.unlock(); element.focus({ preventScroll: true });
      pointerId = event.pointerId; previous = point(event); trail = [{ ...previous, age: 0 }];
      element.setPointerCapture(event.pointerId);
    };
    const move = (event: PointerEvent) => {
      if (props.current.paused || pointerId !== event.pointerId || !previous || model.over) return;
      event.preventDefault();
      const samples = event.getCoalescedEvents?.() ?? [event];
      for (const sample of samples.length ? samples : [event]) {
        const next = point(sample);
        model.slice(previous, next); trail.push({ ...next, age: 0 }); previous = next;
      }
      props.current.onUpdate(model.snapshot);
      if (model.over && !reported) { reported = true; props.current.onOver(model.snapshot); }
    };
    const up = (event: PointerEvent) => { if (pointerId === event.pointerId) { previous = null; pointerId = null; } };
    const key = (event: KeyboardEvent) => {
      if (props.current.paused || model.over || event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
      if (event.key === 'Escape' || event.key.toLowerCase() === 'p') { event.preventDefault(); props.current.onPause(); return; }
      if (event.target instanceof HTMLElement && event.target.closest('button, dialog, a, input')) return;
      const lane = Number(event.key) - 1;
      if (Number.isInteger(lane) && lane >= 0 && lane <= 3) {
        event.preventDefault(); props.current.audio.unlock(); keyboardLane = lane; keyboardTime = 0.18;
        const x = (lane + 0.5) * model.width / 4;
        const a = { x, y: model.height - 8 }, b = { x, y: 88 };
        model.slice(a, b, model.width / 8);
        trail = [{ ...a, age: 0.03 }, { ...b, age: 0 }];
        props.current.onUpdate(model.snapshot);
        if (model.over && !reported) { reported = true; props.current.onOver(model.snapshot); }
      }
    };
    const blur = () => { if (!model.over && !props.current.paused) props.current.onPause(); };
    const visibility = () => { if (document.hidden) blur(); };
    element.addEventListener('pointerdown', down); element.addEventListener('pointermove', move);
    element.addEventListener('pointerup', up); element.addEventListener('pointercancel', up);
    element.addEventListener('lostpointercapture', up);
    window.addEventListener('keydown', key); window.addEventListener('blur', blur); document.addEventListener('visibilitychange', visibility);
    element.focus({ preventScroll: true });
    return () => {
      disposed = true; cancelAnimationFrame(frame); observer.disconnect();
      element.removeEventListener('pointerdown', down); element.removeEventListener('pointermove', move);
      element.removeEventListener('pointerup', up); element.removeEventListener('pointercancel', up); element.removeEventListener('lostpointercapture', up);
      window.removeEventListener('keydown', key); window.removeEventListener('blur', blur); document.removeEventListener('visibilitychange', visibility);
    };
  }, []);
  useEffect(() => { if (!paused) canvas.current?.focus({ preventScroll: true }); }, [paused]);
  return <>
    <canvas ref={canvas} className="game-canvas" tabIndex={paused ? -1 : 0} aria-label="Seed Slash playing field. Swipe or drag through nuts. Keyboard: press 1, 2, 3 or 4 to slash a lane. P or Escape pauses." aria-describedby="game-instructions" />
    {error && <div role="alert" className="canvas-error">{error} <button type="button" onClick={() => location.reload()}>Reload game</button></div>}
  </>;
}
