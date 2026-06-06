import { useMemo } from 'react';
import * as THREE from 'three';
import { RoundedBox, Html } from '@react-three/drei';

// mm → three 单位换算（让一台 ~150mm 的手机约 7.5 个单位高）
const SCALE = 0.05;

export type PhoneColor = 'graphite' | 'titanium' | 'navy' | 'silver' | 'ivory' | 'green';

const BODY_COLORS: Record<PhoneColor, string> = {
  graphite: '#2b2e34',
  titanium: '#6f7079',
  navy: '#1e2c45',
  silver: '#9aa0aa',
  ivory: '#d9d4c8',
  green: '#27433a',
};

export type RiskHotspot = {
  id: string;
  /** 背面归一化坐标，-0.5~0.5（x 横向、y 纵向） */
  x: number;
  y: number;
  label: string;
};

export type PhoneModelProps = {
  width: number; // mm
  height: number; // mm
  thickness: number; // mm
  cornerRadius: number; // R 值（mm）
  backArc: number; // 0-100，背面/边缘弧度
  cameraBump: number; // mm 凸起高度
  cameraSide?: '左上' | '居中' | '右上';
  color?: PhoneColor;
  /** 风险热区（仅 risk 视图传入） */
  hotspots?: RiskHotspot[];
  activeHotspot?: string | null;
  onHotspotEnter?: (id: string) => void;
  onHotspotLeave?: () => void;
};

/** 生成圆角矩形 Shape（in-plane 四角圆角 = cornerRadius） */
function roundedRectShape(w: number, h: number, r: number): THREE.Shape {
  const shape = new THREE.Shape();
  const radius = Math.max(0.001, Math.min(r, w / 2 - 0.001, h / 2 - 0.001));
  const x = -w / 2;
  const y = -h / 2;
  shape.moveTo(x + radius, y);
  shape.lineTo(x + w - radius, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + radius);
  shape.lineTo(x + w, y + h - radius);
  shape.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  shape.lineTo(x + radius, y + h);
  shape.quadraticCurveTo(x, y + h, x, y + h - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  return shape;
}

/**
 * 程序化手机：用 ExtrudeGeometry（圆角矩形截面 + 倒角）做机身，
 * 正面贴深色发光屏，背面叠镜头模组凸块。
 * 所有几何由 props 实时驱动 → 滑块联动当场变形。
 */
export default function PhoneModel({
  width,
  height,
  thickness,
  cornerRadius,
  backArc,
  cameraBump,
  cameraSide = '左上',
  color = 'graphite',
  hotspots,
  activeHotspot,
  onHotspotEnter,
  onHotspotLeave,
}: PhoneModelProps) {
  const w = width * SCALE;
  const h = height * SCALE;
  const t = thickness * SCALE;
  const r = cornerRadius * SCALE;
  // 背面弧度 → 边缘倒角大小（越大越圆润）
  const bevel = THREE.MathUtils.clamp(
    THREE.MathUtils.lerp(t * 0.12, t * 0.42, backArc / 100),
    0.01,
    t / 2 - 0.005,
  );

  // 机身几何（依赖尺寸/圆角/弧度，变则重建）
  const bodyGeo = useMemo(() => {
    const depth = Math.max(0.02, t - bevel * 2);
    const shape = roundedRectShape(w, h, r);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 5,
      curveSegments: 24,
    });
    geo.center();
    geo.computeVertexNormals();
    return geo;
  }, [w, h, r, t, bevel]);

  // 正面屏幕（略小于机身，深色发光）
  const screenGeo = useMemo(() => {
    const inset = Math.min(w, h) * 0.045 + bevel;
    const shape = roundedRectShape(w - inset * 2, h - inset * 2, Math.max(0.02, r - inset));
    return new THREE.ShapeGeometry(shape, 24);
  }, [w, h, r, bevel]);

  const bodyColor = BODY_COLORS[color];

  // 镜头模组位置
  const camX = cameraSide === '居中' ? 0 : cameraSide === '右上' ? w * 0.26 : -w * 0.26;
  const camY = h * 0.3;
  const camZ = -(t / 2 + cameraBump * SCALE * 0.5);
  const moduleSize = Math.min(w, h) * 0.3;

  return (
    <group rotation={[0, 0, 0]}>
      {/* 机身 */}
      <mesh geometry={bodyGeo} castShadow receiveShadow>
        <meshStandardMaterial
          color={bodyColor}
          metalness={0.92}
          roughness={0.34}
          envMapIntensity={1.1}
        />
      </mesh>

      {/* 正面屏幕 */}
      <mesh geometry={screenGeo} position={[0, 0, t / 2 + 0.002]}>
        <meshStandardMaterial
          color="#05070d"
          metalness={0.2}
          roughness={0.18}
          emissive="#0b1838"
          emissiveIntensity={0.55}
        />
      </mesh>

      {/* 背面镜头模组凸块 */}
      <group position={[camX, camY, camZ]}>
        <RoundedBox
          args={[moduleSize, moduleSize, Math.max(0.03, cameraBump * SCALE)]}
          radius={moduleSize * 0.18}
          smoothness={4}
          castShadow
        >
          <meshStandardMaterial color="#16181d" metalness={0.7} roughness={0.45} />
        </RoundedBox>
        {/* 三颗镜头 */}
        {[
          [-moduleSize * 0.18, moduleSize * 0.18],
          [moduleSize * 0.18, moduleSize * 0.18],
          [-moduleSize * 0.18, -moduleSize * 0.18],
        ].map(([lx, ly], i) => (
          <mesh key={i} position={[lx, ly, -(Math.max(0.03, cameraBump * SCALE) / 2 + 0.03)]}>
            <cylinderGeometry args={[moduleSize * 0.13, moduleSize * 0.13, 0.06, 24]} />
            <meshStandardMaterial color="#0a0c12" metalness={0.6} roughness={0.2} />
          </mesh>
        ))}
      </group>

      {/* 风险热区（背面锚点，drei Html） */}
      {hotspots?.map((hs) => {
        const active = activeHotspot === hs.id;
        return (
          <Html
            key={hs.id}
            position={[hs.x * w, hs.y * h, -(t / 2 + 0.06)]}
            center
            distanceFactor={10}
            zIndexRange={[40, 0]}
          >
            <button
              type="button"
              className={`three-risk-dot ${active ? 'is-active' : ''}`}
              onMouseEnter={() => onHotspotEnter?.(hs.id)}
              onFocus={() => onHotspotEnter?.(hs.id)}
              onMouseLeave={() => onHotspotLeave?.()}
              onClick={() => onHotspotEnter?.(hs.id)}
              aria-label={hs.label}
            />
          </Html>
        );
      })}
    </group>
  );
}
