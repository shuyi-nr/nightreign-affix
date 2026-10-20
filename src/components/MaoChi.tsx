import { useRef } from 'react';
import audioUrl from '../assets/limao-cheese.mp3';

const CHARS = ['狸', '喵', '芝', '士'];

/** 页面右侧角落的「狸喵芝士」彩蛋：点击播放音效。 */
export function MaoChi() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const play = () => {
    if (!audioRef.current) audioRef.current = new Audio(audioUrl);
    const a = audioRef.current;
    a.currentTime = 0;
    a.play().catch(() => {
      /* 音频不可用时静默忽略 */
    });
  };

  return (
    <button type="button" className="maochi" onClick={play} title="狸喵芝士 · 点我一下" aria-label="播放狸喵芝士音效">
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
