export type IconName = 'sound' | 'muted' | 'help' | 'play' | 'pause' | 'restart' | 'home' | 'close' | 'trophy' | 'heart' | 'wheel' | 'arrow' | 'spark' | 'leaf';
export function Icon({ name, size = 24 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    sound: <><path d="m11 4-5 4H3v8h3l5 4V4Z"/><path d="M15 8c3 2 3 6 0 8m3-11c5 4 5 10 0 14"/></>,
    muted: <><path d="m11 4-5 4H3v8h3l5 4V4Z"/><path d="m16 9 6 6m0-6-6 6"/></>,
    help: <><circle cx="12" cy="12" r="9"/><path d="M9.5 8a2.6 2.6 0 0 1 5 1c0 2-2.5 2-2.5 4m0 3h.01"/></>,
    play: <path d="m8 4 12 8-12 8V4Z" fill="currentColor" stroke="none"/>,
    pause: <><path d="M8 5v14m8-14v14" strokeWidth="4"/></>,
    restart: <><path d="M3 10a9 9 0 1 1 2 9M3 4v6h6"/></>,
    home: <><path d="m3 11 9-8 9 8M5 10v11h5v-7h4v7h5V10"/></>,
    close: <path d="m6 6 12 12M6 18 18 6"/>,
    trophy: <><path d="M7 3h10v7a5 5 0 0 1-10 0V3Zm0 2H3v3a4 4 0 0 0 5 4m9-7h4v3a4 4 0 0 1-5 4m-4 3v6m-4 0h8"/></>,
    heart: <path d="M20.8 5.6c-2.2-2.2-5.8-1.7-8.8 1.4-3-3.1-6.6-3.6-8.8-1.4C-1 10 6 16 12 21c6-5 13-11 8.8-15.4Z" fill="currentColor" stroke="none"/>,
    wheel: <><circle cx="12" cy="11" r="8"/><circle cx="12" cy="11" r="2"/><path d="m6.5 5.5 4 4m3 3 4 4m0-11-4 4m-3 3-4 4M12 3v6m0 4v6m-8-8h6m4 0h6M9 21h6"/></>,
    arrow: <path d="M4 12h16m-6-6 6 6-6 6"/>,
    spark: <><path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 2Z"/><path d="m21 2-1 3m0-1 3 1"/></>,
    leaf: <><path d="M20 3C8 1 1 7 5 15s17 7 15-12ZM5 20 16 8"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
