import { useEffect, useMemo, useRef, useState } from 'react';
import {
  createSession,
  createViewport,
  type ISessionApi,
  type IViewportApi,
} from '@shapediver/viewer';
import './ShapeDiverPhoneViewer.css';

const SHAPEDIVER_TICKET =
  '803138a7900259ed5521c6b60a470244619c7c2275f32f4f1d425f162fd6ec2cc0431d6731fcd843b7fc902a7ac72a4a70ffc3e1baf61ac0a558e073d0c7cdb678b7b9b9751d0af529810f6a28d09ca81c20bed0651dd41e9f8e62168389e62483bc619177c527-ee141ca9f941bf7546204311cc0a4053';
const SHAPEDIVER_MODEL_VIEW_URL = 'https://sdr8euc1.eu-central-1.shapediver.com';

/* ---- 全局单例会话：只冷启动一次、/tuning 与 /best-phone 复用、保持热度 ---- */
let sharedSessionPromise: Promise<ISessionApi> | null = null;
function getSharedSession(): Promise<ISessionApi> {
  if (!sharedSessionPromise) {
    sharedSessionPromise = createSession({
      ticket: SHAPEDIVER_TICKET,
      modelViewUrl: SHAPEDIVER_MODEL_VIEW_URL,
      id: 'gripfit-theoretical-phone-session',
    })
      .then((session) => {
        session.customizeOnParameterChange = false;
        return session;
      })
      .catch((err) => {
        sharedSessionPromise = null;
        throw err;
      });
  }
  return sharedSessionPromise;
}

/** 可选：在 App 早期调用，提前唤醒 ShapeDiver 后端，绕过用户进页面时的冷启动 */
export function prewarmShapeDiver(): void {
  void getSharedSession().catch(() => {});
}

export type ShapeDiverPhoneSpec = {
  width: number;
  height: number;
  thickness: number;
  cornerRadius: number;
  weight?: number;
  cameraBump?: number;
  sideArc?: number;
  backArc?: number;
  centerOfMassOffset?: number;
};

type ShapeDiverPhoneViewerProps = {
  spec: ShapeDiverPhoneSpec;
  onParameterNames?: (names: string[]) => void;
  loadingLabel?: string;
  updatingLabel?: string;
};

function findParameter(session: ISessionApi, name: string) {
  return Object.values(session.parameters).find((parameter) => (
    parameter.name === name || parameter.displayname === name || parameter.id === name
  ));
}

function getCustomizationValues(session: ISessionApi, spec: ShapeDiverPhoneSpec) {
  const aspectRatio = spec.height / spec.width;
  const sideFillet = spec.sideArc ?? Math.max(0.8, Math.min(4.5, spec.thickness * 0.38));
  const candidates: Array<{ names: string[]; value: number | undefined }> = [
    { names: ['Width_mm', 'BodyWidth_mm', 'Width', 'BodyWidth', 'width', '宽度'], value: spec.width },
    { names: ['Height_mm', 'BodyHeight_mm', 'Height', 'BodyHeight', 'height', '高度'], value: spec.height },
    { names: ['AspectRatio', 'BodyAspectRatio', 'aspectRatio', '长宽比'], value: aspectRatio },
    { names: ['BodyThickness_mm', 'Thickness_mm', 'Thickness', 'thickness', '厚度'], value: spec.thickness },
    { names: ['CornerRadius_mm', 'CornerRadius', 'Radius', 'cornerRadius', '四边圆角'], value: spec.cornerRadius },
    { names: ['SideFillet_mm', 'SideFillet', 'SideArc_mm', 'SideArc', 'Fillet_mm', 'sideFillet', 'sideArc', '侧边弧度', '侧边圆角'], value: sideFillet },
    { names: ['CameraBump_mm', 'CameraBump', 'LensBump_mm', 'cameraBump', '镜头凸起'], value: spec.cameraBump },
    { names: ['BackArc', 'BackArc_pct', 'BackArcPercent', 'backArc', '背面弧度'], value: spec.backArc },
    { names: ['CenterOfMassOffset_mm', 'CenterOfMassOffset', 'centerOfMassOffset', '重心偏移'], value: spec.centerOfMassOffset },
    { names: ['Weight_g', 'Weight', 'weight', '重量'], value: spec.weight },
  ];

  const values: Record<string, number> = {};
  candidates.forEach(({ names, value }) => {
    if (value === undefined) return;
    const normalized = Math.round(value * 1000) / 1000;
    names.forEach((name) => {
      const parameter = findParameter(session, name);
      if (!parameter || values[parameter.id] !== undefined) return;
      if (parameter.isValid(normalized)) values[parameter.id] = normalized;
    });
  });

  return values;
}

async function fitViewport(viewport: IViewportApi) {
  viewport.updateEnvironmentGeometry();
  viewport.update();
  viewport.render();
}

export default function ShapeDiverPhoneViewer({
  spec,
  onParameterNames,
  loadingLabel = '正在连接 ShapeDiver',
  updatingLabel = '正在生成理论最优模型',
}: ShapeDiverPhoneViewerProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sessionRef = useRef<ISessionApi | null>(null);
  const viewportRef = useRef<IViewportApi | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'updating' | 'error'>('loading');
  const [error, setError] = useState('');
  const viewportId = useMemo(() => `gripfit-sd-vp-${Math.random().toString(36).slice(2)}`, []);

  const specKey = useMemo(
    () => [
      spec.width,
      spec.height,
      spec.thickness,
      spec.cornerRadius,
      spec.weight,
      spec.cameraBump,
      spec.sideArc,
      spec.backArc,
      spec.centerOfMassOffset,
    ].map((value) => (value ?? 0).toFixed(3)).join(':'),
    [spec],
  );

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!canvasRef.current) return;
      setStatus('loading');
      setError('');

      try {
        const sessionPromise = getSharedSession();

        const viewport = await createViewport({
          canvas: canvasRef.current,
          id: viewportId,
          branding: {
            backgroundColor: '#000000',
            busyModeSpinner: 'default',
          },
        });
        viewport.automaticResizing = false;
        viewport.clearAlpha = 0;
        viewport.clearColor = '#000000';
        viewport.contactShadowVisibility = false;
        viewport.defaultMaterialColor = '#b9c7ff';
        viewport.groundPlaneShadowVisibility = false;
        viewport.groundPlaneVisibility = false;
        viewport.gridVisibility = false;
        const rect = wrapperRef.current?.getBoundingClientRect();
        if (rect?.width && rect?.height) viewport.resize(rect.width, rect.height);

        if (cancelled) {
          await viewport.close();
          return;
        }
        viewportRef.current = viewport;

        const session = await sessionPromise;
        if (cancelled) return;
        sessionRef.current = session;

        onParameterNames?.(
          Object.values(session.parameters).map((parameter) => parameter.name || parameter.displayname || parameter.id),
        );

        const initialValues = getCustomizationValues(session, spec);
        if (Object.keys(initialValues).length) await session.customize(initialValues, false, true);
        if (cancelled) return;

        await fitViewport(viewport);
        setStatus('ready');
      } catch (err) {
        if (cancelled) return;
        setStatus('error');
        setError(err instanceof Error ? err.message : String(err));
      }
    }

    init();

    return () => {
      cancelled = true;
      const viewport = viewportRef.current;
      sessionRef.current = null;
      viewportRef.current = null;
      void viewport?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const session = sessionRef.current;
    if (!session || status === 'loading' || status === 'error') return;

    const timer = window.setTimeout(async () => {
      try {
        setStatus('updating');
        const values = getCustomizationValues(session, spec);
        if (Object.keys(values).length) await session.customize(values, false, true);
        if (viewportRef.current) {
          await fitViewport(viewportRef.current);
        }
        setStatus('ready');
      } catch (err) {
        setStatus('error');
        setError(err instanceof Error ? err.message : String(err));
      }
    }, 700);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [specKey]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const resizeObserver = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) viewportRef.current?.resize(width, height);
    });

    resizeObserver.observe(wrapper);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div ref={wrapperRef} className="shapediver-phone-viewer">
      <canvas ref={canvasRef} className="shapediver-phone-viewer__canvas" />
      {status !== 'ready' ? (
        <div className="shapediver-phone-viewer__status">
          {status === 'error' ? (
            <>
              <strong>ShapeDiver 加载失败</strong>
              <span>{error}</span>
            </>
          ) : (
            <>
              <span className="shapediver-phone-viewer__spinner" />
              <strong>{status === 'updating' ? updatingLabel : loadingLabel}</strong>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
