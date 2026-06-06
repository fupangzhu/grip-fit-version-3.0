import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useThree, useFrame } from '@react-three/fiber';
import Viewer from './Viewer';
import PhoneModel, { type PhoneModelProps } from './PhoneModel';

export type PhoneView = 'front' | 'back' | 'risk';

type ViewTarget = { pos: THREE.Vector3; look: THREE.Vector3 };

// 各视图的相机目标位姿
function viewToCamera(view: PhoneView): ViewTarget {
  const look = new THREE.Vector3(0, 0, 0);
  switch (view) {
    case 'back':
      return { pos: new THREE.Vector3(0, 0.5, -16), look };
    case 'risk':
      return { pos: new THREE.Vector3(0, 0.5, -16), look };
    case 'front':
    default:
      return { pos: new THREE.Vector3(0, 0, 16), look };
  }
}

/** 切视图时把相机平滑移到目标角度，到位后把控制权交还用户 */
function CameraRig({ view }: { view: PhoneView }) {
  const { camera, controls } = useThree() as any;
  const target = useMemo(() => viewToCamera(view), [view]);
  const animating = useRef(true);

  useEffect(() => {
    animating.current = true;
  }, [view]);

  useFrame(() => {
    if (!animating.current) return;
    camera.position.lerp(target.pos, 0.12);
    if (controls) {
      controls.target.lerp(target.look, 0.12);
      controls.update();
    }
    if (camera.position.distanceTo(target.pos) < 0.06) animating.current = false;
  });

  return null;
}

type PhoneStageProps = Omit<PhoneModelProps, 'hotspots'> & {
  view?: PhoneView;
  hotspots?: PhoneModelProps['hotspots'];
};

/** 懒加载入口：Viewer + 程序化手机 + 视图相机控制。供 /tuning、/report/best-phone 使用。 */
export default function PhoneStage({ view = 'front', ...phoneProps }: PhoneStageProps) {
  return (
    <Viewer cameraPosition={[0, 0, 16]} fov={32} minDistance={9} maxDistance={24}>
      <CameraRig view={view} />
      <PhoneModel {...phoneProps} hotspots={view === 'risk' ? phoneProps.hotspots : undefined} />
    </Viewer>
  );
}
