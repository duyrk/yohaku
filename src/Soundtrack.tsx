import { useEffect, useRef, useState } from 'react';

const audioSource = import.meta.env.VITE_AUDIO_URL || undefined;

export default function Soundtrack() {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [pending, setPending] = useState(false);
  const [volume, setVolume] = useState(35);
  const [error, setError] = useState(false);

  useEffect(() => { if (audio.current) audio.current.volume = volume / 100; }, [volume]);
  // Pause when leaving the page; do not restart without another explicit click.
  useEffect(() => {
    const pause = () => { if (document.hidden) audio.current?.pause(); };
    document.addEventListener('visibilitychange', pause);
    return () => document.removeEventListener('visibilitychange', pause);
  }, []);

  const toggle = async () => {
    const player = audio.current;
    if (!player || pending || !audioSource) return;
    if (!player.paused) { player.pause(); return; }
    setPending(true);
    setError(false);
    try {
      // Read the value again here: play() must remain inside the user's gesture.
      player.volume = volume / 100;
      if (player.error) player.load();
      await player.play();
    } catch { setError(true); }
    finally { setPending(false); }
  };

  return <section className={`soundtrack ${playing ? 'is-playing' : ''}`} aria-label="音楽プレーヤー">
    <audio ref={audio} src={audioSource} preload="none" loop onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onError={() => { setError(true); setPlaying(false); setPending(false); }} />
    <button className="play-button" aria-label={!audioSource ? '音源はローカルで追加できます' : playing ? '音楽を一時停止' : error ? '音楽を再試行' : '音楽を再生'} aria-pressed={playing} disabled={pending || !audioSource} onClick={toggle}>
      <span className="record-disc" aria-hidden="true"><span /></span><span className="play-glyph" aria-hidden="true">{pending ? '…' : playing ? 'Ⅱ' : '▶'}</span>
    </button>
    <div className="track-info"><span className="track-status" role="status">{!audioSource ? '音源はローカルで追加できます' : error ? '再生できません。もう一度お試しください。' : pending ? '読み込み中' : playing ? 'いま、流れている音' : 'この風景に、音楽を。'}</span><span className="track-title">Shelter <span className="equalizer" aria-hidden="true"><i /><i /><i /><i /></span></span><span className="track-artist">Porter Robinson &amp; Madeon</span></div>
    <label className="volume-control"><span>音量</span><input type="range" aria-label="音量" disabled={!audioSource} min="0" max="100" step="1" value={volume} onChange={e => setVolume(Number(e.target.value))} /><span className="volume-value">{volume}</span></label>
  </section>;
}
