import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useThree, useFrame } from '@react-three/fiber';
import Viewer from './Viewer';
import HandModel, { type HandDimensions, type HandFit } from './HandModel';

export type HandView = 'top' | 'lateral' | 'palm' | 'wire';
const PITCH_LIMIT_RAD = THREE.MathUtils.degToRad(16);

// 各视角相机相对手部中心的方向（会被归一化）
function viewDir(view: HandView): THREE.Vector3 {
  switch (view) {
    case 'lateral':
      return new THREE.Vector3(1, 0.12, 0.35);
    case 'palm':
      return new THREE.Vector3(0, 0, 1);
    case 'wire':
      return new THREE.Vector3(0.25, 0.35, 1);
    case 'top':
    default:
      return new THREE.Vector3(0, 0.25, 1);
  }
}

function polarFromView(view: HandView): number {
  const dir = viewDir(view).normalize();
  return Math.acos(THREE.MathUtils.clamp(dir.y, -1, 1));
}

/** 把相机对准右手包围球，按视角方向布置距离，平滑过渡后交还控制权 */
function CameraRig({ view, fit }: { view: HandView; fit: HandFit | null }) {
  const { camera, controls } = useThree() as any;
  const animating = useRef(true);

  const targetPos = useMemo(() => {
    if (!fit) return null;
    const fov = (camera.fov * Math.PI) / 180;
    const dist = (fit.radius / Math.tan(fov / 2)) * 1.02;
    return fit.center.clone().add(viewDir(view).normalize().multiplyScalar(dist));
  }, [fit, view, camera]);

  useEffect(() => {
    animating.current = true;
  }, [view, fit]);

  useFrame(() => {
    if (!fit || !targetPos) return;
    if (controls) controls.target.lerp(fit.center, 0.15);
    if (animating.current) {
      camera.position.lerp(targetPos, 0.14);
      if (camera.position.distanceTo(targetPos) < (fit.radius * 0.04 || 0.01)) animating.current = false;
    }
    if (controls) controls.update();
  });

  return null;
}

type HandStageProps = {
  view?: HandView;
  /** 整体旋转（把右手摆成掌心朝相机、手指朝上等姿态） */
  modelRotation?: [number, number, number];
  /** 来自测量页的手长/手宽，做轻量级视觉缩放 */
  dimensions?: HandDimensions;
  /** 自动缓慢旋转 */
  autoRotate?: boolean;
};

/** 懒加载入口：Viewer + 人体模型右手取景。供 /measure 使用。 */
export default function HandStage({ view = 'palm', modelRotation, dimensions, autoRotate = false }: HandStageProps) {
  const [fit, setFit] = useState<HandFit | null>(null);

  // 依据手部半径换算 OrbitControls 缩放范围（模型为原生小尺度）
  const r = fit?.radius ?? 0.4;
  const basePolar = polarFromView(view);

  return (
    <Viewer
      cameraPosition={[0, 1.1, 2]}
      fov={34}
      minDistance={r * 1.2}
      maxDistance={r * 8}
      minPolarAngle={basePolar - PITCH_LIMIT_RAD}
      maxPolarAngle={basePolar + PITCH_LIMIT_RAD}
      enableZoom={false}
      autoRotate={autoRotate}
      contactShadow={false}
    >
      <CameraRig view={view} fit={fit} />
      <HandModel
        onFit={setFit}
        wireframe={view === 'wire'}
        modelRotation={modelRotation}
        dimensions={dimensions}
      />
    </Viewer>
  );
}
