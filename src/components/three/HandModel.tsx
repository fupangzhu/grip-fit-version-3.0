import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { clone as cloneSkinnedModel } from 'three/examples/jsm/utils/SkeletonUtils.js';

const HAND_URL = '/assets/models/hand-bound.glb';
const BASE_HAND_LENGTH = 183;
const BASE_HAND_WIDTH = 82;

const HAND_LENGTH_BONES = [
  'Bone.002', 'Bone.003',
  'Bone.005', 'Bone.006', 'Bone.007', 'Bone.008',
  'Bone.010', 'Bone.011', 'Bone.012', 'Bone.013',
  'Bone.015', 'Bone.016', 'Bone.017', 'Bone.018',
  'Bone.020', 'Bone.021', 'Bone.022', 'Bone.023',
];
const HAND_WIDTH_BONES = ['Bone.001', 'Bone.002', 'Bone.005', 'Bone.010', 'Bone.015', 'Bone.020'];

export type HandDimensions = {
  length: number;
  width: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function getBone(root: THREE.Object3D, name: string) {
  return (root.getObjectByName(name) || root.getObjectByName(name.replace('.', ''))) as THREE.Bone | undefined;
}

function hasSkinnedMesh(root: THREE.Object3D) {
  let skinned = false;
  root.traverse((obj) => {
    if ((obj as THREE.SkinnedMesh).isSkinnedMesh) skinned = true;
  });
  return skinned;
}

function prepareMeshDeformation(root: THREE.Object3D) {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh || !mesh.geometry) return;

    mesh.geometry = mesh.geometry.clone();
    const position = mesh.geometry.getAttribute('position') as THREE.BufferAttribute | undefined;
    if (!position) return;

    mesh.geometry.userData.basePosition = new Float32Array(position.array as ArrayLike<number>);
    mesh.geometry.computeBoundingBox();
    mesh.geometry.userData.baseBox = mesh.geometry.boundingBox?.clone();
  });
}

function resetMeshDeformation(root: THREE.Object3D) {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    const geometry = mesh.geometry;
    if (!mesh.isMesh || !geometry) return;

    const position = geometry.getAttribute('position') as THREE.BufferAttribute | undefined;
    const base = geometry.userData.basePosition as Float32Array | undefined;
    if (!position || !base || position.array.length !== base.length) return;

    (position.array as Float32Array).set(base);
    position.needsUpdate = true;
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
  });
}

function applyMeshDimensions(root: THREE.Object3D, dimensions: HandDimensions) {
  const lengthT = clamp((dimensions.length - BASE_HAND_LENGTH) / 37, -1, 1);
  const widthT = clamp((dimensions.width - BASE_HAND_WIDTH) / 17, -1, 1);
  const lengthScale = 1 + lengthT * 0.18;

  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    const geometry = mesh.geometry;
    if (!mesh.isMesh || !geometry) return;

    const position = geometry.getAttribute('position') as THREE.BufferAttribute | undefined;
    const base = geometry.userData.basePosition as Float32Array | undefined;
    const box = geometry.userData.baseBox as THREE.Box3 | undefined;
    if (!position || !base || !box || position.array.length !== base.length) return;

    const target = position.array as Float32Array;
    const sizeY = Math.max(box.max.y - box.min.y, 0.0001);
    const centerX = (box.min.x + box.max.x) / 2;
    const centerZ = (box.min.z + box.max.z) / 2;

    for (let i = 0; i < base.length; i += 3) {
      const x = base[i];
      const y = base[i + 1];
      const z = base[i + 2];
      const yNorm = clamp((y - box.min.y) / sizeY, 0, 1);
      const widthWeight = 0.35 + smoothstep(0.18, 0.86, yNorm) * 0.65;
      const widthScale = 1 + widthT * 0.18 * widthWeight;
      const depthScale = 1 + widthT * 0.06 * widthWeight;

      target[i] = centerX + (x - centerX) * widthScale;
      target[i + 1] = box.min.y + (y - box.min.y) * lengthScale;
      target[i + 2] = centerZ + (z - centerZ) * depthScale;
    }

    position.needsUpdate = true;
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
  });
}

function resetBoneScales(root: THREE.Object3D) {
  [...HAND_LENGTH_BONES, ...HAND_WIDTH_BONES].forEach((name) => {
    const bone = getBone(root, name);
    if (bone?.isBone) bone.scale.set(1, 1, 1);
  });
}

function applyHandDimensions(root: THREE.Object3D, dimensions?: HandDimensions) {
  resetBoneScales(root);
  resetMeshDeformation(root);
  if (!dimensions) return;

  if (!hasSkinnedMesh(root)) {
    applyMeshDimensions(root, dimensions);
    return;
  }

  const lengthT = clamp((dimensions.length - BASE_HAND_LENGTH) / 37, -1, 1);
  const widthT = clamp((dimensions.width - BASE_HAND_WIDTH) / 17, -1, 1);
  const fingerLengthScale = 1 + lengthT * 0.22;
  const palmLengthScale = 1 + lengthT * 0.07;
  const palmWidthScale = 1 + widthT * 0.18;
  const fingerBaseSpreadScale = 1 + widthT * 0.08;

  const palm = getBone(root, 'Bone.001');
  if (palm?.isBone) palm.scale.set(palmWidthScale, palmLengthScale, 1);

  HAND_LENGTH_BONES.forEach((name) => {
    const bone = getBone(root, name);
    if (!bone?.isBone) return;
    bone.scale.y *= fingerLengthScale;
  });

  HAND_WIDTH_BONES.slice(1).forEach((name) => {
    const bone = getBone(root, name);
    if (!bone?.isBone) return;
    bone.scale.x *= fingerBaseSpreadScale;
  });
}

export type HandFit = { center: THREE.Vector3; radius: number };

export type HandModelProps = {
  /** 线框模式（WIRE 视图） */
  wireframe?: boolean;
  /** 皮肤色调（可选微调） */
  tint?: string;
  /** 整体旋转（弧度）——用于把右手摆成掌心朝相机、手指朝上等姿态 */
  modelRotation?: [number, number, number];
  /** 来自测量页的手长/手宽，做轻量级视觉缩放 */
  dimensions?: HandDimensions;
  /** 回传右手包围球，供相机取景 */
  onFit?: (fit: HandFit) => void;
};

export default function HandModel({ wireframe, tint, modelRotation, dimensions, onFit }: HandModelProps) {
  const { scene } = useGLTF(HAND_URL);
  const cloned = useMemo(() => {
    const model = cloneSkinnedModel(scene);
    prepareMeshDeformation(model);
    return model;
  }, [scene]);

  const rotKey = modelRotation ? modelRotation.join(',') : '';
  const dimensionsKey = dimensions ? `${dimensions.length},${dimensions.width}` : '';

  // 新手部 GLB 是独立绑定模型，直接用整体包围盒取景。
  const fit = useMemo<HandFit>(() => {
    if (modelRotation) cloned.rotation.set(modelRotation[0], modelRotation[1], modelRotation[2]);
    else cloned.rotation.set(0, 0, 0);

    applyHandDimensions(cloned);
    cloned.updateWorldMatrix(true, true);
    const box = new THREE.Box3().setFromObject(cloned);
    if (box.isEmpty()) box.set(new THREE.Vector3(-0.5, -0.5, -0.5), new THREE.Vector3(0.5, 0.5, 0.5));
    const center = new THREE.Vector3();
    box.getCenter(center);
    const sphere = new THREE.Sphere();
    box.getBoundingSphere(sphere);
    applyHandDimensions(cloned, dimensions);
    return { center, radius: Math.max(sphere.radius * 1.08, 0.5) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cloned, rotKey, dimensionsKey]);

  useEffect(() => {
    cloned.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      // 蒙皮网格旋转后包围球不更新会被错误剔除 → 关闭视锥剔除
      mesh.frustumCulled = false;
      const mat = mesh.material as THREE.MeshStandardMaterial | THREE.MeshStandardMaterial[];
      const apply = (m: THREE.MeshStandardMaterial) => {
        const c = m.clone();
        c.wireframe = !!wireframe;
        c.color = new THREE.Color(tint || '#e7b99d');
        c.metalness = 0.0;
        c.roughness = 0.65;
        c.metalnessMap = null;
        c.roughnessMap = null;
        c.envMapIntensity = 0.39;
        c.needsUpdate = true;
        return c;
      };
      mesh.material = Array.isArray(mat) ? mat.map(apply) : apply(mat);
    });
  }, [cloned, wireframe, tint]);

  useEffect(() => {
    onFit?.(fit);
  }, [fit, onFit]);

  return <primitive object={cloned} />;
}

useGLTF.preload(HAND_URL);
