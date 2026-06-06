import { Suspense, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import './three.css';
import {
  OrbitControls,
  Environment,
  Lightformer,
  ContactShadows,
  Html,
  Bounds,
} from '@react-three/drei';

type ViewerProps = {
  children: ReactNode;
  /** 相机初始位置 */
  cameraPosition?: [number, number, number];
  /** 相机视场角 */
  fov?: number;
  /** OrbitControls 缩放范围 */
  minDistance?: number;
  maxDistance?: number;
  /** 极角限制（防止转到穿帮的上下死角） */
  minPolarAngle?: number;
  maxPolarAngle?: number;
  /** 方位角限制（undefined = 不限制，可 360° 旋转） */
  minAzimuthAngle?: number;
  maxAzimuthAngle?: number;
  /** 是否自动旋转 */
  autoRotate?: boolean;
  /** 是否启用 OrbitControls（false 时仅静态展示） */
  controls?: boolean;
  /** 是否允许滚轮/手势缩放 */
  enableZoom?: boolean;
  /** 是否显示接地阴影 */
  contactShadow?: boolean;
  /** 自适应取景，让物体填满视口 */
  fit?: boolean;
  /** OrbitControls 的 ref 透传给父级用于程序化转视角 */
  controlsRef?: React.Ref<any>;
};

/** 加载中的转圈兜底 */
function Loader() {
  return (
    <Html center>
      <div className="three-loader" aria-label="加载 3D 模型中">
        <span className="three-loader__spinner" />
      </div>
    </Html>
  );
}

/**
 * 通用 3D 舞台：Canvas + 三点光 + 程序化 HDR 环境（无网络依赖）+ 接地阴影
 * + OrbitControls（拖拽旋转 / 滚轮缩放）+ Suspense 兜底。
 * 把模型作为 children 传入即可。
 */
export default function Viewer({
  children,
  cameraPosition = [0, 0, 16],
  fov = 32,
  minDistance = 8,
  maxDistance = 26,
  minPolarAngle = Math.PI * 0.16,
  maxPolarAngle = Math.PI * 0.84,
  minAzimuthAngle,
  maxAzimuthAngle,
  autoRotate = false,
  controls = true,
  enableZoom = true,
  contactShadow = true,
  fit = false,
  controlsRef,
}: ViewerProps) {
  return (
    <Canvas
      className="three-canvas"
      shadows
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, preserveDrawingBuffer: false }}
      camera={{ position: cameraPosition, fov }}
    >
      {/* 三点光 */}
      <ambientLight intensity={0.45} />
      <directionalLight
        position={[6, 9, 8]}
        intensity={2.1}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0002}
      />
      <directionalLight position={[-8, 4, -6]} intensity={0.7} color="#9db4ff" />
      <pointLight position={[0, -6, 6]} intensity={0.5} color="#618bff" />

      <Suspense fallback={<Loader />}>
        {fit ? <Bounds fit clip observe margin={1.15}>{children}</Bounds> : children}

        {/* 程序化环境贴图：给金属面提供反射，避免远程 HDR 下载 */}
        <Environment resolution={256} frames={1}>
          <Lightformer intensity={2.6} position={[0, 5, -7]} scale={[12, 6, 1]} color="#cdd8ff" />
          <Lightformer intensity={1.4} position={[-6, 2, 4]} scale={[5, 8, 1]} color="#9fb4ff" />
          <Lightformer intensity={1.1} position={[6, -1, 5]} scale={[6, 6, 1]} color="#ffffff" />
          <Lightformer intensity={0.8} position={[0, -6, 2]} scale={[10, 4, 1]} color="#3a4a73" />
        </Environment>
      </Suspense>

      {contactShadow ? (
        <ContactShadows
          position={[0, -5.4, 0]}
          opacity={0.5}
          scale={26}
          blur={2.6}
          far={9}
          resolution={512}
          color="#000000"
        />
      ) : null}

      {controls ? (
        <OrbitControls
          ref={controlsRef}
          makeDefault
          enablePan={false}
          enableZoom={enableZoom}
          autoRotate={autoRotate}
          autoRotateSpeed={0.8}
          minDistance={minDistance}
          maxDistance={maxDistance}
          minPolarAngle={minPolarAngle}
          maxPolarAngle={maxPolarAngle}
          minAzimuthAngle={minAzimuthAngle}
          maxAzimuthAngle={maxAzimuthAngle}
          enableDamping
          dampingFactor={0.08}
        />
      ) : null}
    </Canvas>
  );
}
