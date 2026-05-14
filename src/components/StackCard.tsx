import type { Stage } from '../data/stages';
import './StackCard.css';

type Props = {
  stage: Stage;
  isFront: boolean;
};

/**
 * Non-front cards render a lightweight teaser. Front card renders the full detailed layout
 * that corresponds to the `stage.extra` key (scan hand / 3D model / metric grid / text-only).
 */
export default function StackCard({ stage, isFront }: Props) {
  if (!isFront) return <BackCardContent stage={stage} />;
  return <FrontCardContent stage={stage} />;
}

function BackCardContent({ stage }: { stage: Stage }) {
  return (
    <div className="card-inner card-inner--back">
      <div className="card-icon card-icon--muted" aria-hidden>
        <IconFor name={stage.icon} muted />
      </div>
      <div className="card-stage-label">{stage.stageLabel}</div>
      <h3 className="card-title--muted">{stage.title}</h3>
      <p className="card-desc card-desc--muted">{stage.desc}</p>
      {stage.bullets && (
        <ul className="card-bullets">
          {stage.bullets.map((b) => (
            <li key={b}>
              <span className="dot" />
              {b}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FrontCardContent({ stage }: { stage: Stage }) {
  return (
    <div className="card-inner card-inner--front">
      <header className="card-head">
        <div className="card-icon">
          <IconFor name={stage.icon} />
        </div>
        <span className="card-stage-label card-stage-label--soft">{stage.stageLabel}</span>
      </header>

      <div className="card-body">
        <div className="card-tag">{stage.tag}</div>
        <h2 className="card-title">{stage.title}</h2>
        <p className="card-desc">{stage.desc}</p>

        {stage.extra === 'scanHand' && <ScanHandPreview fit={stage.fitValue ?? '98.4%'} />}
        {stage.extra === 'modelPreview' && <ModelPreview />}
        {stage.extra === 'metric' && stage.metric && <MetricPreview metric={stage.metric} />}
      </div>
    </div>
  );
}

/* ── Sub-blocks ── */

function ScanHandPreview({ fit }: { fit: string }) {
  return (
    <div className="preview preview--scan">
      <div className="preview-row">
        <span className="preview-label">精准拟合</span>
        <span className="preview-value">{fit}</span>
      </div>
      <div className="preview-bar">
        <div className="preview-bar__fill" />
      </div>
      <div className="preview-img preview-img--scan">
        <img src="/assets/hand-scan.png" alt="" draggable={false} />
        <div className="scanline" />
      </div>
    </div>
  );
}

function ModelPreview() {
  return (
    <div className="preview preview--model">
      <img src="/assets/hand-model.png" alt="" draggable={false} />
    </div>
  );
}

function MetricPreview({ metric }: { metric: { label: string; value: string } }) {
  return (
    <div className="preview preview--metric">
      <div className="metric-card">
        <div className="metric-label">{metric.label}</div>
        <div className="metric-value">{metric.value}</div>
      </div>
    </div>
  );
}

/* ── Icons (simple inline SVG) ── */

function IconFor({ name, muted }: { name: Stage['icon']; muted?: boolean }) {
  const src =
    name === 'compass' ? '/assets/icon-compass.svg' : name === 'cube' ? '/assets/icon-cube.svg' : '/assets/icon-chart.svg';

  return (
    <img
      className={`card-icon__asset card-icon__asset--${name} ${muted ? 'card-icon__asset--muted' : ''}`}
      src={src}
      alt=""
      draggable={false}
    />
  );
}
