import { Suspense, lazy, useState } from 'react';

const PhoneStage = lazy(() => import('../components/three/PhoneStage'));
const HandStage = lazy(() => import('../components/three/HandStage'));

// 临时 demo 页：验证 Phase 0/1 的 3D 基础设施（上线前删除）
export default function ThreeDemoPage() {
  const [cameraBump, setCameraBump] = useState(1.6);
  const [cornerRadius, setCornerRadius] = useState(12);
  const [width, setWidth] = useState(70.6);
  const [view, setView] = useState<'front' | 'back' | 'risk'>('front');

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', color: 'var(--text-1)', padding: 24 }}>
      <h1 style={{ font: '700 18px var(--font-brand)', letterSpacing: 2 }}>THREE.JS DEMO</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 16 }}>
        <section style={{ height: 460, border: '1px solid var(--card-border)', borderRadius: 16, overflow: 'hidden' }}>
          <Suspense fallback={<p style={{ padding: 24 }}>加载手机…</p>}>
            <PhoneStage
              view={view}
              width={width}
              height={151.4}
              thickness={7.6}
              cornerRadius={cornerRadius}
              backArc={60}
              cameraBump={cameraBump}
              color="graphite"
              hotspots={[
                { id: 'camera', x: -0.26, y: 0.3, label: '镜头凸起' },
                { id: 'weight', x: 0.1, y: 0, label: '重量重心' },
                { id: 'corner', x: -0.2, y: -0.34, label: '圆角压力' },
              ]}
            />
          </Suspense>
        </section>

        <section style={{ height: 460, border: '1px solid var(--card-border)', borderRadius: 16, overflow: 'hidden' }}>
          <Suspense fallback={<p style={{ padding: 24 }}>加载手部…</p>}>
            <HandStage view="top" />
          </Suspense>
        </section>
      </div>

      <div style={{ display: 'flex', gap: 24, marginTop: 20, flexWrap: 'wrap' }}>
        <label>视图：
          {(['front', 'back', 'risk'] as const).map((v) => (
            <button key={v} onClick={() => setView(v)} style={{ marginLeft: 6, opacity: view === v ? 1 : 0.5 }}>{v}</button>
          ))}
        </label>
        <label>宽度 {width.toFixed(1)}mm
          <input type="range" min={60} max={85} step={0.1} value={width} onChange={(e) => setWidth(e.target.valueAsNumber)} />
        </label>
        <label>圆角 R{cornerRadius.toFixed(1)}
          <input type="range" min={2} max={20} step={0.5} value={cornerRadius} onChange={(e) => setCornerRadius(e.target.valueAsNumber)} />
        </label>
        <label>镜头凸起 {cameraBump.toFixed(1)}mm
          <input type="range" min={0.8} max={5.5} step={0.1} value={cameraBump} onChange={(e) => setCameraBump(e.target.valueAsNumber)} />
        </label>
      </div>
    </div>
  );
}
