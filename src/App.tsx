import React, { Component, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, OrbitControls, useGLTF, useProgress } from '@react-three/drei';
import { Box3, Color, Group, Mesh, MeshPhysicalMaterial, Vector3 } from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import PosterArt from './PosterArt';
import Soundtrack from './Soundtrack';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const chapters = [
  { title: '余白', caption: '何もない時間に、心が動く。', sub: '急がずに、ひとつずつ。', color: '#e8e0cf' },
  { title: '疾走', caption: '心のままに、風の向こうへ。', sub: '行き先よりも、この瞬間を。', color: '#b0443c' },
  { title: '浮遊', caption: '春の風に、身をまかせて。', sub: 'いつもと違う角度から。', color: '#a6bfaf' },
  { title: '余韻', caption: '夢は、まだ終わらない。', sub: 'もう一度、あの風景へ。', color: '#263d4c' },
];

// A single scalar connects native page scrolling to both the DOM and the camera.
const journey = { progress: 0 };
const poses = [
  { position: [5.4, 2.3, -6.8], target: [0, 0.65, 0] },
  { position: [7.0, 1.6, -1.8], target: [0, 0.6, 0] },
  { position: [4.2, 6.8, -3.7], target: [0, 0.45, 0] },
  { position: [5.8, 2.4, 5.8], target: [0, 0.6, 0] },
];

function Car({ paint }: { paint: string }) {
  const { scene } = useGLTF('/models/skyline-r34.glb', '/draco/');
  const bodyMaterial = useMemo(() => new MeshPhysicalMaterial({ color: paint, metalness: 0.65, roughness: 0.24, clearcoat: 1, clearcoatRoughness: 0.15 }), []);
  const glassMaterial = useMemo(() => new MeshPhysicalMaterial({ color: '#263338', metalness: 0.2, roughness: 0.1, transparent: true, opacity: 0.55, depthWrite: false }), []);
  const model = useMemo(() => {
    const clone = new Group();
    clone.add(scene.clone(true));
    // The source faces +Z. Match the journey's existing front-to-rear camera path.
    clone.rotation.y = Math.PI;
    clone.traverse((node) => {
      if (node instanceof Mesh) {
        node.castShadow = true;
        node.receiveShadow = true;
        const materials = Array.isArray(node.material) ? node.material : [node.material];
        const mapped = materials.map(material => {
          if (/PaintTNR_Material1$/.test(material.name)) return bodyMaterial;
          if (/2002Window_Material1$/.test(material.name)) return glassMaterial;
          return material;
        });
        node.material = Array.isArray(node.material) ? mapped : mapped[0];
      }
    });
    clone.updateMatrixWorld(true);
    const bounds = new Box3().setFromObject(clone);
    const size = bounds.getSize(new Vector3());
    // glTF exports can use arbitrary units; normalize the coupe to 4.6 scene units.
    clone.scale.setScalar(4.6 / Math.max(size.x, size.z));
    clone.updateMatrixWorld(true);
    bounds.setFromObject(clone);
    const center = bounds.getCenter(new Vector3());
    clone.position.set(-center.x, -bounds.min.y, -center.z);
    return clone;
  }, [scene, bodyMaterial, glassMaterial]);
  useEffect(() => { bodyMaterial.color.set(paint); }, [paint, bodyMaterial]);
  useEffect(() => () => bodyMaterial.dispose(), [bodyMaterial]);
  useEffect(() => () => glassMaterial.dispose(), [glassMaterial]);
  return <primitive object={model} />;
}

function CameraRig({ explore, reduced }: { explore: boolean; reduced: boolean }) {
  const lookAt = useRef(new Vector3(0, 0.6, 0));
  const point = useMemo(() => new Vector3(), []);
  const target = useMemo(() => new Vector3(), []);
  const endpoint = useMemo(() => new Vector3(), []);
  useFrame(({ camera, size }, delta) => {
    if (explore) return;
    const progress = journey.progress * 3;
    const index = Math.min(2, Math.floor(progress));
    let t = progress - index;
    t = t * t * (3 - 2 * t);
    const a = poses[index], b = poses[index + 1];
    point.fromArray(a.position);
    endpoint.fromArray(b.position);
    const radius = point.length() * (1 - t) + endpoint.length() * t;
    point.lerp(endpoint, t).normalize().multiplyScalar(radius);
    // Pull back on narrow screens so the whole car stays in frame.
    const extraDistance = size.width / size.height < 0.8 ? 1.55 : 1;
    point.multiplyScalar(extraDistance);
    target.fromArray(a.target).lerp(endpoint.fromArray(b.target), t);
    const speed = reduced ? 1 : 1 - Math.exp(-delta * 8);
    camera.position.lerp(point, speed);
    lookAt.current.lerp(target, speed);
    camera.lookAt(lookAt.current);
  });
  return null;
}

function Scene({ paint, explore, reduced }: { paint: string; explore: boolean; reduced: boolean }) {
  return <>
    <ambientLight intensity={0.45} />
    <directionalLight position={[5, 8, -3]} intensity={2.5} />
    <Environment resolution={128} frames={1}>
      <color attach="background" args={['#303b46']} />
      <Lightformer form="rect" intensity={4} position={[0, 5, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[10, 5, 1]} />
      <Lightformer form="rect" intensity={3} position={[-5, 2, 0]} rotation={[0, Math.PI / 2, 0]} scale={[8, 2, 1]} />
      <Lightformer form="rect" intensity={3} position={[4, 3, 3]} rotation={[0, -Math.PI / 2, 0]} scale={[8, 3, 1]} />
    </Environment>
    <Car paint={paint} />
    <ContactShadows position={[0, -0.01, 0]} opacity={0.55} scale={15} blur={2.6} far={4} resolution={256} color="#182127" frames={1} />
    <CameraRig explore={explore} reduced={reduced} />
    {explore && <OrbitControls makeDefault target={[0, 0.6, 0]} enablePan={false} enableZoom={false} minPolarAngle={0.15} maxPolarAngle={Math.PI / 2 - 0.04} />}
  </>;
}

class SceneBoundary extends Component<{ children: React.ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}

function Loading({ failed, ready }: { failed: boolean; ready: boolean }) {
  const { progress, active } = useProgress();
  if (ready && !active && !failed) return null;
  return <div className={`loading ${failed ? 'failed' : ''}`} role="status">
    <span className="loading-symbol">余<span>白</span></span>
    <p>{failed ? '風景を読み込めませんでした。' : '風景を、準備しています。'}</p>
    {failed ? <><small>WebGL に対応したブラウザーで、もう一度お試しください。</small><button onClick={() => window.location.reload()}>もう一度</button></> : <><div className="loading-track"><i style={{ width: `${Math.max(5, progress)}%` }} /></div><small>{Math.round(progress)}%</small></>}
  </div>;
}

export default function App() {
  const [chapter, setChapter] = useState(0);
  const [paint, setPaint] = useState('#2459a8');
  const [explore, setExplore] = useState(false);
  const [credits, setCredits] = useState(false);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const root = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const creditsButton = useRef<HTMLButtonElement>(null);
  const lastChapter = useRef(0);

  useEffect(() => {
    const probe = document.createElement('canvas');
    try {
      const context = probe.getContext('webgl2');
      if (!context) setFailed(true);
      context?.getExtension('WEBGL_lose_context')?.loseContext();
    } catch { setFailed(true); }
  }, []);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handle = () => setReduced(query.matches);
    query.addEventListener('change', handle);
    return () => query.removeEventListener('change', handle);
  }, []);

  useGSAP(() => {
    const update = () => {
      root.current?.style.setProperty('--progress', `${journey.progress * 100}%`);
      const next = Math.min(3, Math.round(journey.progress * 3));
      if (next !== lastChapter.current) { lastChapter.current = next; setChapter(next); }
    };
    gsap.to(journey, {
      progress: 1, ease: 'none',
      scrollTrigger: { trigger: '.scroll-track', start: 'top top', end: 'bottom bottom', scrub: reduced ? true : 0.45, onUpdate: update },
      onUpdate: update,
    });
    return () => { journey.progress = 0; };
  }, { scope: root, dependencies: [reduced], revertOnUpdate: true });

  useEffect(() => {
    if (credits) dialog.current?.showModal();
    else if (dialog.current?.open) dialog.current.close();
  }, [credits]);

  const goTo = (index: number) => {
    setExplore(false);
    const distance = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    window.scrollTo({ top: distance * index / 3, behavior: reduced ? 'instant' : 'smooth' });
  };

  const current = chapters[chapter];
  return <div className={`experience chapter-${chapter} ${explore ? 'exploring' : ''} ${reduced ? 'reduce-motion' : ''}`} ref={root} style={{ '--scene-bg': current.color } as React.CSSProperties}>
    <a className="skip-link" href="#experience-controls">操作へスキップ</a>
    <header className="header">
      <a className="brand" href="#start" onClick={(e) => { e.preventDefault(); goTo(0); }} aria-label="余白 — はじめに戻る"><span>余白<span className="brand-seal">私<br />景</span></span><span className="brand-caption">音と、かたちの記録。</span></a>
      <span className="header-center">日々の隙間に、小さな旅を。</span>
      <button className="about-button" ref={creditsButton} onClick={() => setCredits(true)}>この作品について <span>＋</span></button>
    </header>

    <main id="start">
      <PosterArt active={chapter} />

      <div className={`canvas-wrap ${explore ? 'interactive' : ''}`} aria-label="日産スカイライン GT-R R34 ニスモ Z-Tune の立体モデル。自由に眺めるボタンで回転できます。" role="img">
        <SceneBoundary onError={() => setFailed(true)}>
          <Canvas dpr={[1, 1.75]} camera={{ position: [5.4, 2.3, -6.8], fov: 36, near: 0.1, far: 60 }} gl={{ alpha: true, antialias: true }} onCreated={({ gl }) => { gl.setClearColor(new Color('#ffffff'), 0); }} fallback={<span>WebGL に対応していません。</span>}>
            <Suspense fallback={null}><Scene paint={paint} explore={explore} reduced={reduced} /><Ready onReady={() => setReady(true)} /></Suspense>
          </Canvas>
        </SceneBoundary>
      </div>
      <Loading failed={failed} ready={ready} />

      <aside className="chapter-nav" aria-label="風景を選ぶ">
        {chapters.map((c, i) => <button key={c.title} aria-label={`第${i + 1}景：${c.title}`} aria-current={i === chapter ? 'step' : undefined} className={i === chapter ? 'active' : ''} onClick={() => goTo(i)}><span className="chapter-index">{['一','二','三','四'][i]}</span><span className="chapter-line" /><span className="chapter-name">{c.title}</span></button>)}
      </aside>

      <div className="scene-description" aria-live="polite"><span className="scene-number">{['一','二','三','四'][chapter]}<span>／四</span></span><div><h1>{current.caption}</h1><p>{explore ? 'ドラッグして、自由な角度から。' : current.sub}</p></div></div>

      <footer className="controls" id="experience-controls" aria-label="風景の操作">
        <fieldset className="paint-picker"><legend>車の色</legend>{[{ color: '#2459a8', label: '青藍' }, { color: '#e8e6de', label: '生成り' }, { color: '#252d32', label: '墨色' }].map(({ color, label }) => <button key={color} aria-label={label} aria-pressed={paint === color} className={`paint ${paint === color ? 'selected' : ''}`} style={{ '--paint': color } as React.CSSProperties} onClick={() => setPaint(color)} />)}</fieldset>
        <button className="scroll-prompt" onClick={() => goTo(chapter === 3 ? 0 : chapter + 1)}><span>{chapter === 3 ? 'もう一度、旅をする' : 'スクロールで、次の風景へ'}</span><span className="scroll-icon">{chapter === 3 ? '↺' : '↓'}</span></button>
        <button className={`explore-button ${explore ? 'selected' : ''}`} aria-pressed={explore} onClick={() => setExplore(!explore)}><span className="orbit-icon">◎</span>{explore ? '旅に戻る' : '自由に眺める'}<span>{explore ? '×' : '＋'}</span></button>
      </footer>
      <Soundtrack />
      <div className="journey-progress" aria-hidden="true"><i /></div>
      <div className="scroll-track" aria-hidden="true" />
    </main>

    <dialog ref={dialog} className="about-dialog" onCancel={() => setCredits(false)} onClose={() => { setCredits(false); creditsButton.current?.focus(); }} onClick={(e) => { if (e.target === e.currentTarget) setCredits(false); }}>
      <button className="close-dialog" aria-label="閉じる" onClick={() => setCredits(false)}>×</button>
      <span className="dialog-mark">余白</span><h2>音楽と、かたちと。<br />何でもない、いい時間。</h2>
      <p>日本のポスターや古い雑誌、春の風景から着想を得た、個人的な視覚の実験です。</p>
      <p>日産スカイライン GT-R R34 ニスモ Z-Tune。あの頃の憧れを、好きな角度から。</p>
      <div className="credits"><p>立体モデル：<a href="https://sketchfab.com/3d-models/2005-nismo-nissan-skyline-r34-gtr-z-tune-6a0e311f8c404fbaad783ed587014c1d" target="_blank" rel="noreferrer">Ddiaz Design</a>（原作：CSR2 / GM25）<br /><a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank" rel="noreferrer">CC BY-NC-SA 4.0</a> ／ ウェブ向けの軽量化・塗装変更。</p><p>音楽：Shelter — Porter Robinson &amp; Madeon<br />ご提供の音源を使用した、ローカル再生です。</p><p>React Three Fiber · Drei · GSAP</p></div>
      <button className="motion-toggle" aria-pressed={reduced} onClick={() => setReduced(!reduced)}>{reduced ? 'なめらかな動きを有効にする' : '動きを控えめにする'}</button>
    </dialog>
  </div>;
}

function Ready({ onReady }: { onReady: () => void }) {
  useEffect(() => { onReady(); }, []);
  return null;
}
