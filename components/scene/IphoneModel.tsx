'use client';

import { Html, useGLTF } from '@react-three/drei';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Group, Mesh, MeshStandardMaterial, Object3D } from 'three';
import { Euler, Vector3 } from 'three';
import { configureDraco } from '@/lib/three/gltf';
import type { ReactNode } from 'react';

const MODEL_PATH = '/models/iphone-compressed.glb';
const LOADED_MODEL_SCALE = 1.0;

export const IPHONE_SCREEN_OVERLAY = {
  position: [-0.04, 0.025, 0] as [number, number, number],
  rotation: [0, -Math.PI / 2, 0] as [number, number, number],
  width: 30.8, // model-local units, match to the screen mesh width
};

export const IPHONE_SCREEN_PX = { w: 390, h: 844 };

const FLOAT_AMPLITUDE = 0.035;
const FLOAT_SPEED = 1.15;

type IphoneModelProps = {
  onScreenClick: () => void;
  onOutsideScreenClick?: () => void;
  screenOverlay?: ReactNode;
  floatEnabled?: boolean;
};

function useScreenFrontFacing(
  groupRef: React.RefObject<Group>,
  position: [number, number, number],
  rotation: [number, number, number]
) {
  const { camera } = useThree();
  const [isFrontFacing, setIsFrontFacing] = useState(true);
  const visibleRef = useRef(true);
  const localNormal = useMemo(
    () => new Vector3(0, 0, 1).applyEuler(new Euler(rotation[0], rotation[1], rotation[2])).normalize(),
    [rotation]
  );

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;
    const worldPoint = group.localToWorld(new Vector3(position[0], position[1], position[2]));
    const worldNormal = localNormal.clone().transformDirection(group.matrixWorld).normalize();
    const toCamera = camera.position.clone().sub(worldPoint).normalize();
    const aboveScreen = camera.position.y >= worldPoint.y - 0.02;
    const facing = worldNormal.dot(toCamera) > 0 && aboveScreen;
    if (visibleRef.current !== facing) {
      visibleRef.current = facing;
      setIsFrontFacing(facing);
    }
  });

  return isFrontFacing;
}

function useFloatingGroup(groupRef: React.RefObject<Group>, baseY: number, enabled: boolean) {
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.position.y = enabled
      ? baseY + Math.sin(clock.getElapsedTime() * FLOAT_SPEED) * FLOAT_AMPLITUDE
      : baseY;
  });
}

function isScreenLike(meshName: string, material: MeshStandardMaterial): boolean {
  const meshLabel = meshName.toLowerCase();
  const matLabel = (material.name ?? '').toLowerCase();
  return (
    meshLabel.includes('screen') ||
    meshLabel.includes('display') ||
    meshLabel.includes('glass') ||
    matLabel.includes('screen') ||
    matLabel.includes('display') ||
    material.emissiveMap !== null
  );
}

export function IphoneModel({
  onScreenClick,
  onOutsideScreenClick,
  screenOverlay,
  floatEnabled = true,
}: IphoneModelProps) {
  const gltf = useGLTF(MODEL_PATH, true, true, (loader) => configureDraco(loader));
  const scene = useMemo(() => gltf.scene.clone(), [gltf.scene]);
  const [screenMeshNames, setScreenMeshNames] = useState<Set<string>>(new Set());
  const groupRef = useRef<Group>(null);
  useFloatingGroup(groupRef, -0.2, floatEnabled);
  const isFrontFacing = useScreenFrontFacing(
    groupRef,
    IPHONE_SCREEN_OVERLAY.position,
    IPHONE_SCREEN_OVERLAY.rotation
  );

  const handleModelClick = useCallback(
    (event: ThreeEvent<MouseEvent>) => {
      const clickedName = event.object?.name?.toLowerCase() ?? '';
      if (!screenMeshNames.has(clickedName)) {
        event.stopPropagation();
        onOutsideScreenClick?.();
        return;
      }
      event.stopPropagation();
      onScreenClick();
    },
    [onOutsideScreenClick, onScreenClick, screenMeshNames]
  );

  useEffect(() => {
    const detected = new Set<string>();
    scene.traverse((object: Object3D) => {
      if (!('isMesh' in object) || !object.isMesh) return;
      const mesh = object as Mesh;
      const meshName = (mesh.name ?? '').toLowerCase();
      const material = mesh.material as MeshStandardMaterial | MeshStandardMaterial[];
      const materials = Array.isArray(material) ? material : [material];
      for (const mat of materials) {
        if (!mat || !('isMeshStandardMaterial' in mat) || !mat.isMeshStandardMaterial) continue;
        mat.roughness = 0.1;
        mat.metalness = 0.9;
        if (isScreenLike(meshName, mat)) {
          detected.add(meshName);
          mat.color.set('#ffffff');
          mat.emissive.set('#ffffff');
          mat.emissiveIntensity = 0.3;
        } else {
          mat.emissive.set('#000000');
          mat.emissiveIntensity = 0;
        }
      }
    });
    setScreenMeshNames(detected);
  }, [scene]);

  const htmlScale = IPHONE_SCREEN_OVERLAY.width / IPHONE_SCREEN_PX.w;

  return (
    <group ref={groupRef} position={[0, -0.2, 0]} scale={[LOADED_MODEL_SCALE, LOADED_MODEL_SCALE, LOADED_MODEL_SCALE]}>
      <primitive object={scene} onClick={handleModelClick} />
      {screenOverlay && isFrontFacing && (
        <Html
          position={IPHONE_SCREEN_OVERLAY.position}
          rotation={IPHONE_SCREEN_OVERLAY.rotation}
          transform
          scale={[htmlScale, htmlScale, htmlScale]}
          occlude={false}
          center
        >
          <div style={{ backfaceVisibility: 'hidden' }}>{screenOverlay}</div>
        </Html>
      )}
    </group>
  );
}
