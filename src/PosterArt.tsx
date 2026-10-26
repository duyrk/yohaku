const titles = ['余白', '疾走', '浮遊', '余韻'];

function Sakura() {
  const blooms = [[350, 50, 1], [290, 90, .7], [410, 120, .85], [230, 140, .9], [330, 170, .65], [160, 185, .8], [420, 230, .7], [260, 245, .9], [100, 110, .65], [140, 285, .7], [355, 310, .8], [460, 80, .6]];
  return <svg className="sakura" viewBox="0 0 500 600" fill="none" aria-hidden="true">
    <defs><g id="blossom">{Array.from({length: 5}, (_, i) => <ellipse key={i} cx="0" cy="-15" rx="11" ry="17" fill={i % 2 ? '#ead6cd' : '#e5a9ac'} transform={`rotate(${i * 72})`} />)}<circle r="5" fill="#a94645" /><path d="M-4-3 4 3M-3 4 3-4" stroke="#e8d9ae" strokeWidth="2" /></g></defs>
    <path d="M520 580C430 490 430 360 330 240S220 180 75 100" stroke="#243e40" strokeWidth="18" />
    <path d="M430 450C330 340 170 340 110 260M360 290C390 190 430 145 450 55M300 210C310 110 290 60 260 0M235 170C190 90 130 80 60 50" stroke="#243e40" strokeWidth="8" />
    <path d="M445 480C400 380 400 300 355 240M332 245C285 190 230 165 180 140" stroke="#8b8370" strokeWidth="3" />
    {blooms.map(([x,y,s],i) => <g key={i} transform={`translate(${x} ${y}) scale(${s})`}><use href="#blossom" /><use href="#blossom" transform="translate(30 20) scale(.65)" /><use href="#blossom" transform="translate(-25 23) scale(.75)" /></g>)}
    <g fill="#edc9c2"><ellipse cx="70" cy="380" rx="5" ry="10" transform="rotate(35 70 380)"/><ellipse cx="210" cy="410" rx="4" ry="8"/><ellipse cx="290" cy="510" rx="5" ry="9" transform="rotate(-35 290 510)"/><ellipse cx="390" cy="70" rx="4" ry="8"/></g>
  </svg>;
}

function Waves() {
  return <svg className="ocean" viewBox="0 0 900 500" fill="none" aria-hidden="true"><defs><pattern id="seigaiha" width="120" height="70" patternUnits="userSpaceOnUse">{[54,43,32,21,10].map(r => <path key={r} d={`M${60-r} 70a${r} ${r} 0 0 1 ${r*2} 0 M${-r} 0a${r} ${r} 0 0 1 ${r*2} 0 M${120-r} 0a${r} ${r} 0 0 1 ${r*2} 0`} stroke="currentColor" strokeWidth="1.2"/>)}</pattern></defs><rect width="900" height="500" fill="url(#seigaiha)" /></svg>;
}

export default function PosterArt({ active }: { active: number }) {
  return <div className="fixed-stage" aria-hidden="true">
    <div className="gallery-coordinate"><span>音と、かたちの記録。</span><span>四つの風景、一つの旅。</span></div>
    {titles.map((title, i) => <div key={title} className={`art art-${i} ${active === i ? 'is-active' : ''}`}>
      <div className="poster">
        <div className="poster-topline"><span>自動車と美意識</span><span>日産スカイライン ・ 三四</span></div>
        {i === 0 && <>
          <div className="sun sun-arrival" /><div className="arrival-lines" />
          <span className="poster-title arrival-title">余白</span>
          <span className="vertical-poem">夢の途中で、<br />少しだけ遠回り。</span>
          <span className="small-seal">旅の<br />記録</span>
          <div className="poster-bottom"><span>かたちに、心を奪われる。</span><span>序章</span></div>
        </>}
        {i === 1 && <>
          <div className="speed-lines" /><span className="ghost-kanji">走</span>
          <div className="rush-headline"><span>心のままに</span><strong>疾走</strong></div>
          <span className="rush-side">街の向こうへ。昨日の先へ。</span>
          <div className="rush-stamp">風を<br />追う</div>
          <div className="poster-bottom"><span>この瞬間は、一度きり。</span><span>第二景</span></div>
        </>}
        {i === 2 && <>
          <div className="sakura-window"><Sakura /></div>
          <span className="float-label">春の夢</span><span className="poster-title float-title">浮遊</span>
          <span className="float-poem">どこへでも、<br />行ける気がした。</span>
          <div className="poster-bottom"><span>風にまかせて、ゆっくりと。</span><span>第三景</span></div>
        </>}
        {i === 3 && <>
          <div className="sun sun-dusk" /><Waves />
          <span className="poster-title dusk-title">余韻</span>
          <span className="dusk-poem">遠くへ行かなくても、<br />旅はできる。</span>
          <div className="dusk-seal">また<br />いつか</div>
          <div className="poster-bottom"><span>音が消えても、夢はつづく。</span><span>終章</span></div>
        </>}
        <div className="print-edge" />
      </div>
    </div>)}
    <div className="edition-mark"><span>個人的な風景集</span><span>限定のない、ひととき。</span></div>
  </div>;
}
