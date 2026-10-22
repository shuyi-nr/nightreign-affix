import { useEffect, useId, useRef, useState } from 'react';
import audioUrl from '../assets/limao-cheese.mp3';
import { useMediaQuery } from '../lib/useMediaQuery';

const CHARS = ['狸', '喵', '芝', '士'];

/** 页面右侧角落的「狸喵芝士」彩蛋：点击播放音效。 */
export function MaoChi() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const isCompact = useMediaQuery('(max-width: 1200px)');
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const panelId = useId();

  useEffect(() => () => { audioRef.current?.pause(); }, []);

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setOpen(false); launcherRef.current?.focus(); }
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);

  const play = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => setPlaying(false);
    }
    const a = audioRef.current;
    setFailed(false);
    a.currentTime = 0;
    // Called directly from the tap handler, so mobile browsers allow playback.
    a.play().then(() => setPlaying(true)).catch(() => { setPlaying(false); setFailed(true); });
  };

  if (isCompact) return (
    <div className={`maochi-mobile${open ? ' is-open' : ''}${playing ? ' is-playing' : ''}`} ref={rootRef}>
      {open && <div id={panelId} className="maochi-panel" role="region" aria-label="狸喵芝士音效菜单">
        <div className="maochi-panel-head">
          <span>今日份芝士，点一下 ♪</span>
          <button type="button" className="maochi-close" aria-label="收起狸喵芝士菜单" onClick={() => {
            setOpen(false); audioRef.current?.pause(); setPlaying(false); launcherRef.current?.focus();
          }}>×</button>
        </div>
        <button type="button" className="maochi-tiles" onClick={play} aria-label="再次播放狸喵芝士音效">
          {CHARS.map((c, i) => <span key={c} className={`mc mc-${i}`}>{c}</span>)}
        </button>
        <div className="maochi-status" role="status">{failed ? '未能播放，请再点一次' : playing ? '♪ 正在播放 · 点击四字可重播' : '点击四字，再来一口芝士'}</div>
      </div>}
      <button ref={launcherRef} type="button" className="maochi-launcher" aria-label="狸喵芝士，点击播放音效并展开菜单" aria-expanded={open} aria-controls={open ? panelId : undefined} onClick={() => { setOpen(true); play(); }}>
        <span className="maochi-cat" aria-hidden="true">🧀</span>
        <span>狸喵芝士</span>
        <span className="maochi-sound" aria-hidden="true">♪</span>
      </button>
    </div>
  );

  return (
    <button type="button" className={`maochi${playing ? ' is-playing' : ''}`} onClick={play} title={failed ? '未能播放，请再点一次' : '狸喵芝士 · 点我一下'} aria-label="播放狸喵芝士音效">
      {CHARS.map((c, i) => (
        <span key={i} className={`mc mc-${i}`}>
          {c}
        </span>
      ))}
      <span className="mc-note" aria-hidden>
        ♪
      </span>
    </button>
  );
}
