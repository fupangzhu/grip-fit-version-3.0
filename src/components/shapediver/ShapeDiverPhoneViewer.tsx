import { useEffect, useMemo, useRef, useState } from 'react';
import {
  createSession,
  createViewport,
  type ISessionApi,
  type IViewportApi,
} from '@shapediver/viewer';
import './ShapeDiverPhoneViewer.css';

const SHAPEDIVER_TICKET =
  '6439345a758ecade13352d2152f2512791efd050498810bb0e12f9f6c81fd4787b77fbd54718a23deed172c1c5cdeb3adb6511b6e04dd46a4a4163dd062f21400cb1cca2fb1894d37c12f6bd30c9bc509fee158ae1810b6bbada684c642203b22895803c77e16d-854b0c9e4e9e0f704a76e2a5a137748b';
const SHAPEDIVER_MODEL_VIEW_URL = 'https://sdr8euc1.eu-central-1.shapediver.com';

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
        const viewport = await createViewport({
          canvas: canvasRef.current,
          id: 'gripfit-theoretical-phone-viewport',
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

        const session = await createSession({
          ticket: SHAPEDIVER_TICKET,
          modelViewUrl: SHAPEDIVER_MODEL_VIEW_URL,
          id: 'gripfit-theoretical-phone-session',
        });
        session.customizeOnParameterChange = false;

        if (cancelled) {
          await session.close();
          await viewport.close();
          return;
        }

        sessionRef.current = session;
        viewportRef.current = viewport;
        onParameterNames?.(
          Object.values(session.parameters).map((parameter) => parameter.name || parameter.displayname || parameter.id),
        );

        const values = getCustomizationValues(session, spec);
        if (Object.keys(values).length) await session.customize(values, true, true);
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
      const session = sessionRef.current;
      const viewport = viewportRef.current;
      sessionRef.current = null;
      viewportRef.current = null;
      void session?.close();
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
