import { useCallback, useEffect, useRef, useState } from 'react';
import { Game } from './Game';
import { GameAudio } from './game/audio';
import type { GameSnapshot } from './game/model';
import { Icon } from './Icon';
import { Modal } from './Modal';
import { readBest, readSetting, saveBest, saveSetting } from './storage';
import { useWheel, type WheelStatus } from './wheel';

type Screen = 'home' | 'playing' | 'paused' | 'over';
const initial: GameSnapshot = { score: 0, lives: 3, drops: 0, sliced: 0, combo: 0, bestCombo: 0, comboBonus: 0, elapsed: 0, over: false, goldenBonus: false };
const art = (name: string) => `${import.meta.env.BASE_URL}art/${name}.svg`;

function WheelLabel({ status, bonus }: { status: WheelStatus; bonus: boolean }) {
  if (status.mode === 'checking') return <span>Checking the wheel…</span>;
  if (status.mode === 'local') return <span>Local bonus mode{bonus ? ' · Golden shower!' : ''}</span>;
  return <span>Squeekchain · {status.running ? 'Wheel running!' : 'Wheel resting'}</span>;
}

export function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [modal, setModal] = useState<'tutorial' | 'help' | 'wheel' | null>(null);
  const [round, setRound] = useState(0);
  const [snapshot, setSnapshot] = useState(initial);
  const [best, setBest] = useState(readBest);
  const [previousBest, setPreviousBest] = useState(best);
  const [sound, setSound] = useState(() => readSetting('sound', true));
  const [storageAvailable, setStorageAvailable] = useState(true);
  const audio = useRef(new GameAudio());
  const wheel = useWheel();
  const resume = useRef<HTMLButtonElement>(null);
  const replay = useRef<HTMLButtonElement>(null);
  audio.current.enabled = sound;
  useEffect(() => () => audio.current.close(), []);
  useEffect(() => {
    document.body.classList.toggle('is-playing', screen !== 'home');
    if (screen === 'paused') resume.current?.focus();
    if (screen === 'over') replay.current?.focus();
    return () => document.body.classList.remove('is-playing');
  }, [screen]);
  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      if (modal) return;
      if (screen === 'paused' && (event.key === 'Escape' || event.key.toLowerCase() === 'p')) { event.preventDefault(); setScreen('playing'); }
    };
    window.addEventListener('keydown', handle); return () => window.removeEventListener('keydown', handle);
  }, [screen, modal]);

  const begin = () => {
    audio.current.unlock(); setModal(null); setPreviousBest(best); setSnapshot(initial);
    setRound(value => value + 1); setScreen('playing'); saveSetting('tutorial-seen', true);
  };
  const start = () => { audio.current.unlock(); if (readSetting('tutorial-seen')) begin(); else setModal('tutorial'); };
  const pause = useCallback(() => setScreen(current => current === 'playing' ? 'paused' : current), []);
  const finish = useCallback((result: GameSnapshot) => {
    setSnapshot(result); setBest(current => Math.max(current, result.score));
    setStorageAvailable(saveBest(result.score)); setScreen('over');
  }, []);
  const showModal = (name: 'help' | 'wheel') => { pause(); setModal(name); };
  const toggleSound = () => { const next = !sound; setSound(next); saveSetting('sound', next); audio.current.enabled = next; if (next) { audio.current.unlock(); audio.current.play('slice'); } };
  const inGame = screen !== 'home';
  const bonus = inGame && snapshot.goldenBonus;
  const liveClass = wheel.status.mode === 'live' ? (wheel.status.running ? 'running' : 'resting') : wheel.status.mode;

  return <div className={`app screen-${screen}`}>
    <div className="forest" aria-hidden="true" />
    <div className="forest-vignette" aria-hidden="true" />
    <header className="topbar">
      <a className="brand" href="#" aria-label="Seed Slash home" onClick={event => { event.preventDefault(); setScreen('home'); }}>
        <img src={art('golden')} width="26" height="31" alt="" /><span>Seed Slash<span className="brand-dot">.</span></span>
      </a>
      <nav className="utilities" aria-label="Game controls">
        {screen === 'playing' && <button type="button" className="icon-button" aria-label="Pause game" title="Pause (P)" onClick={pause}><Icon name="pause" /></button>}
        <button type="button" className="help-button" onClick={() => showModal('help')} aria-label="How to play"><Icon name="help" /><span>How to play</span></button>
        <button type="button" className="icon-button" aria-label={sound ? 'Turn sound off' : 'Turn sound on'} aria-pressed={sound} title={sound ? 'Sound on' : 'Sound off'} onClick={toggleSound}><Icon name={sound ? 'sound' : 'muted'} /></button>
      </nav>
    </header>

    <main id="main-content" className={inGame ? 'play-main' : 'home-main'}>
      {screen === 'home' && <>
        <div className="home-content">
          <div className="home-copy">
            <h1 className="game-title"><span>Seed</span><span>Slash<span className="title-spark" aria-hidden="true"><Icon name="spark" size={36} /></span></span></h1>
            <p className="tagline">A little forest frenzy.</p>
            <p className="intro">Slice the snacks. Dodge the bombs.<br /> Make one little hamster very happy.</p>
            <button type="button" className="primary start-button" onClick={start}><Icon name="play" /><span>Start slicing</span><Icon name="arrow" /></button>
            <p className="control-hint"><span className="hint-swipe" aria-hidden="true">⌁</span> Swipe or drag to slice</p>
            <div className="home-best"><Icon name="trophy" size={20} /><span>Personal best</span><strong>{best.toLocaleString()}</strong></div>
          </div>
          <div className="mascot-scene">
            <span className="orbit orbit-1"><img src={art('almond')} alt="" width="64" height="68" /></span>
            <span className="orbit orbit-2"><img src={art('seed')} alt="" width="52" height="55" /></span>
            <span className="orbit orbit-3"><img src={art('cashew')} alt="" width="58" height="61" /></span>
            <span className="orbit orbit-4"><img src={art('walnut')} alt="" width="64" height="67" /></span>
            <svg className="scene-swoosh" viewBox="0 0 530 500" aria-hidden="true"><path d="M30 330C110 222 354 326 489 106" /><path d="m475 122 14-16-4 23" /></svg>
            <img className="pip" src={art('pip')} alt="Pip, a cheerful golden hamster in a green scarf, holding a sunflower seed on a mossy tree stump." width="500" height="480" />
            <div className="pip-caption"><span className="caption-line" />Meet Pip. Snack enthusiast.</div>
          </div>
        </div>
        <div className="home-rules" aria-label="Game essentials">
          <div><div className="rule-art"><img src={art('seed')} alt="" /><img src={art('almond')} alt="" /><img src={art('cashew')} alt="" /></div><span>Slice the good stuff</span></div>
          <div><div className="rule-art"><img src={art('bomb')} alt="" /></div><span>Leave the boom</span></div>
          <div><div className="rule-art"><img src={art('golden')} alt="" /><strong>2×</strong></div><span>Go for gold</span></div>
        </div>
      </>}

      {inGame && <>
        <h1 className="sr-only">Seed Slash game</h1>
        <Game key={round} paused={screen !== 'playing' || modal !== null} wheel={wheel.status} audio={audio.current}
          onUpdate={setSnapshot} onOver={finish} onPause={pause} />
        <div className="game-hud" role="group" aria-label="Game stats">
          <div className="score-block"><span>Score</span><strong data-testid="score">{snapshot.score.toLocaleString()}</strong></div>
          <div className={`combo-block ${snapshot.combo >= 3 ? 'combo-active' : ''}`}><Icon name="spark" size={20} /><strong>{snapshot.combo >= 3 ? `${snapshot.combo}× combo` : 'Find your flow'}</strong><span>{snapshot.combo >= 3 ? `+${snapshot.comboBonus} bonus points` : 'Slice 3+ for a combo'}</span></div>
          <div className="lives-block"><div className="hearts" role="img" aria-label={`${snapshot.lives} of 3 lives remaining`} data-testid="lives">{[1, 2, 3].map(life => <span key={life} className={life <= snapshot.lives ? 'heart-full' : 'heart-empty'}><Icon name="heart" size={24} /></span>)}</div><span>Drops {snapshot.drops}/3</span></div>
        </div>
        <div id="game-instructions" className="playing-hint"><span className="pointer-hint">Swipe or drag to slice</span><span className="keyboard-hint">Slash lanes <kbd>1</kbd><kbd>2</kbd><kbd>3</kbd><kbd>4</kbd><span className="hint-divider">·</span><kbd>P</kbd> pause</span></div>
        {bonus && screen === 'playing' && <div className="golden-notice"><Icon name="spark" size={20} />Golden shower<span>More gold. More points.</span></div>}
      </>}

      {screen === 'paused' && <section className="state-overlay" aria-labelledby="pause-title">
        <div className="state-content">
          <div className="state-symbol"><Icon name="pause" size={36} /></div>
          <h2 id="pause-title">Snack break.</h2><p>Pip will save your spot.</p>
          <button ref={resume} type="button" className="primary" onClick={() => { audio.current.unlock(); setScreen('playing'); }}><Icon name="play" />Resume slicing</button>
          <button type="button" className="text-button" onClick={() => setScreen('home')}><Icon name="home" size={20} />Back to the forest</button>
        </div>
      </section>}

      {screen === 'over' && <section className="state-overlay game-over" aria-labelledby="over-title">
        <div className="state-content">
          <img src={art('pip')} className="result-pip" alt="" width="180" height="173" />
          <h2 id="over-title">That was nuts!</h2>
          <p>{snapshot.score > previousBest ? 'A new personal best. Pip approves.' : 'A good snack run. Fancy another?'}</p>
          <div className="result-score"><span>Final score</span><strong data-testid="final-score">{snapshot.score.toLocaleString()}</strong></div>
          <div className="result-stats"><div><strong>{snapshot.sliced}</strong><span>Nuts sliced</span></div><div><strong>{snapshot.bestCombo}×</strong><span>Best combo</span></div><div><strong>{best.toLocaleString()}</strong><span>Personal best</span></div></div>
          <button ref={replay} type="button" className="primary" onClick={begin}><Icon name="restart" />Play again</button>
          <button type="button" className="text-button" onClick={() => setScreen('home')}><Icon name="home" size={20} />Back to the forest</button>
          <p className="storage-note">{storageAvailable ? 'Best score saved on this device.' : 'Storage is unavailable. Best score lasts for this visit.'}</p>
        </div>
      </section>}
    </main>

    <footer className="bottom-bar">
      <button type="button" className={`wheel-button ${liveClass}`} onClick={() => showModal('wheel')} aria-label="Bonus information">
        <Icon name="wheel" size={20} /><span className="status-dot" aria-hidden="true" /><WheelLabel status={wheel.status} bonus={bonus} /><span className="info-mark" aria-hidden="true">i</span>
      </button>
      <span className="footer-note">{inGame ? 'Little seeds. Big energy.' : 'A small game for your wild side.'}</span>
    </footer>
    <div className="sr-only" role="status" aria-live="polite">{screen === 'over' ? `Game over. Score ${snapshot.score}. Personal best ${best}.` : screen === 'paused' ? 'Game paused.' : screen === 'playing' ? `${snapshot.lives} lives remaining.` : ''}</div>

    {(modal === 'tutorial' || modal === 'help') && <Modal title={modal === 'tutorial' ? 'A snack-sized tutorial' : 'How to play'} onClose={() => setModal(null)} className="tutorial-modal">
      <p className="modal-intro">Help Pip stock up for the forest.</p>
      <ol className="tutorial-steps">
        <li><div className="step-art"><img src={art('almond')} alt="" /><img src={art('seed')} alt="" /></div><div><h3>Swipe the snacks</h3><p>Drag your mouse or swipe through nuts. Each is worth 10 points. Slice 3+ quickly for a combo bonus.</p></div></li>
        <li><div className="step-art"><img src={art('bomb')} alt="" /></div><div><h3>Keep your three lives</h3><p>A bomb costs one life. Every 3 dropped nuts also cost one. Leave bombs untouched.</p></div></li>
        <li><div className="step-art"><img src={art('golden')} alt="" /></div><div><h3>Catch a little gold</h3><p>Golden seeds are worth 20 points. Golden showers make more of them appear.</p></div></li>
      </ol>
      <div className="keyboard-tip"><strong>Playing with a keyboard?</strong><p><kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> <kbd>4</kbd> slash the four lanes, from left to right. <kbd>P</kbd> or <kbd>Esc</kbd> pauses.</p></div>
      <button type="button" className="primary" onClick={modal === 'tutorial' ? begin : () => { setModal(null); if (screen === 'paused') setScreen('playing'); }}><Icon name="play" />{modal === 'tutorial' ? 'Play now' : screen === 'paused' ? 'Resume slicing' : screen === 'over' ? 'Return to results' : 'Return to forest'}</button>
    </Modal>}

    {modal === 'wheel' && <Modal title="A little wheel magic" onClose={() => setModal(null)}>
      <div className={`wheel-detail ${liveClass}`}><Icon name="wheel" size={36} /><WheelLabel status={wheel.status} bonus={bonus} /></div>
      <p>{wheel.status.detail}</p>
      {wheel.status.mode === 'live' ? <><p>When Squeekchain’s hamster wheel runs, a golden shower brings extra golden seeds. Naps are welcome, too.</p><p className="muted">Squeekchain reports the wheel status. Checked every 10 seconds.</p></> : <><p>In local bonus mode, a 12-second golden shower starts every 30 seconds of play. It is generated by this game, independently of the real wheel.</p><p className="muted">The game checks Squeekchain every 10 seconds and returns to live mode when fresh, verified hardware data is available.</p></>}
      <p className="muted">Golden seeds always give 2× base points. All scores stay on this device.</p>
      <div className="modal-actions"><button type="button" className="primary" onClick={() => { setModal(null); if (screen === 'paused') setScreen('playing'); }}>{screen === 'paused' ? 'Resume slicing' : screen === 'over' ? 'Return to results' : 'Return to forest'}<Icon name="arrow" size={20} /></button><button type="button" className="text-button" onClick={() => { void wheel.check(); }}>Check connection</button></div>
      <a className="source-link" href="https://api.squeekchain.com/v1/status" target="_blank" rel="noreferrer">View the public status response <span aria-hidden="true">↗</span></a>
    </Modal>}
  </div>;
}
