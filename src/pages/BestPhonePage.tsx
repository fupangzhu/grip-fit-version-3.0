import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Move3D, ZoomIn } from 'lucide-react';
import ShapeDiverPhoneViewer from '../components/shapediver/ShapeDiverPhoneViewer';
import { deriveIdealSpec } from '../data/scoring';
import { useFlowState } from '../hooks/useFlowState';
import { usePanelCollapse } from '../hooks/usePanelCollapse';
import './BestPhonePage.css';

export default function BestPhonePage() {
  const navigate = useNavigate();
  const [flow] = useFlowState();
  const [panelCollapsed, togglePanel] = usePanelCollapse('gripfit-bestphone-panel-collapsed');

  const ideal = useMemo(
    () => deriveIdealSpec(flow.handLength, flow.handWidth),
    [flow.handLength, flow.handWidth],
  );

  const optimalScore = 8.9;
  const scoreDeg = optimalScore * 36;


  const idealParams = [
    { label: '宽度', value: ideal.width.toFixed(1), unit: 'mm' },
    { label: '高度', value: ideal.height.toFixed(1), unit: 'mm' },
    { label: '厚度', value: ideal.thickness.toFixed(2), unit: 'mm' },
    { label: '重量', value: ideal.weight.toFixed(0), unit: 'g' },
    { label: '屏幕尺寸', value: ideal.screen.toFixed(1), unit: '英寸' },
    { label: '镜头凸起', value: ideal.cameraBump.toFixed(1), unit: 'mm' },
    { label: '四边圆角', value: `R${ideal.cornerRadius.toFixed(1)}`, unit: '' },
    { label: '背面弧度', value: ideal.backArc.toFixed(0), unit: '%' },
    { label: '重心偏移', value: ideal.centerOfMassOffset.toFixed(1), unit: 'mm' },
    { label: '拇指可达', value: ideal.thumbReach.toFixed(0), unit: '%' },
  ];

  return (
    <div className="best-phone-page">
      <main className={`best-phone-page__main ${panelCollapsed ? 'is-panel-collapsed' : ''}`}>
        <button
          type="button"
          className="panel-handle"
          onClick={togglePanel}
          aria-label={panelCollapsed ? '展开参数面板' : '收起参数面板'}
          title={panelCollapsed ? '展开' : '收起'}
        >
          {panelCollapsed ? <ChevronLeft size={15} strokeWidth={2} /> : <ChevronRight size={15} strokeWidth={2} />}
        </button>

        <section className="best-phone-stage">
          <div className="best-phone-stage__hint">
            <Move3D size={12} strokeWidth={1.6} /> 拖拽旋转
            <span className="best-phone-stage__hint-sep">·</span>
            <ZoomIn size={12} strokeWidth={1.6} /> 滚轮缩放
          </div>

          <div className="best-phone-stage__score">
            <div className="score-ring" style={{ ['--score-deg' as never]: `${scoreDeg}deg` }}>
              <div className="score-ring__inner">
                <strong>{optimalScore.toFixed(1)}</strong>
                <span>/10</span>
              </div>
            </div>
            <p>理论最优</p>
          </div>

          <motion.div
            className="best-phone-stage__device"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <ShapeDiverPhoneViewer
              spec={{
                width: ideal.width,
                height: ideal.height,
                thickness: ideal.thickness,
                cornerRadius: ideal.cornerRadius,
                weight: ideal.weight,
                cameraBump: ideal.cameraBump,
                backArc: ideal.backArc,
                centerOfMassOffset: ideal.centerOfMassOffset,
              }}
            />
            <span className="best-phone-stage__size-label">
              {ideal.width.toFixed(1)} x {ideal.height.toFixed(1)} mm
            </span>
          </motion.div>

        </section>

        <aside className="best-phone-panel glass-card">
          <div className="best-phone-panel__inner">
            <header className="best-phone-panel__head">
              <h1>理论最优参数</h1>
              <button type="button" className="best-phone-panel__tune" onClick={() => navigate('/tuning')}>
                参数微调
              </button>
            </header>

            <ol className="best-phone-panel__list">
              {idealParams.map((item, index) => (
                <motion.li
                  key={item.label}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.06 * index, duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                >
                  <span className="best-phone-panel__index">{String(index + 1).padStart(2, '0')}</span>
                  <strong>{item.label}</strong>
                  <em>{item.value}</em>
                  {item.unit ? <small>{item.unit}</small> : null}
                </motion.li>
              ))}
            </ol>
          </div>
        </aside>
      </main>
    </div>
  );
}

