import type { ThreeEvent } from '@react-three/fiber';
import { Vector3 } from 'three';

type ScreenHotspotProps = {
  onActivate: () => void;
  position?: [number, number, number];
  rotation?: [number, number, number];
  size?: [number, number];
  scale?: [number, number, number];
};

export function ScreenHotspot({
  onActivate,
  position = [0, 1.06, -0.438],
  rotation = [0, 0, 0],
  size = [1.5, 0.9],
  scale = [1, 1, 1],
}: ScreenHotspotProps) {
  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    // Ignore clicks from the back side of the plane.
    if (event.face) {
      const worldNormal = event.face.normal.clone().transformDirection(event.object.matrixWorld);
      const viewDirection = new Vector3().subVectors(event.camera.position, event.point).normalize();
      if (worldNormal.dot(viewDirection) <= 0) return;
    }
    event.stopPropagation();
    onActivate();
  };

  return (
    <mesh position={position} rotation={rotation} scale={scale} onClick={handleClick}>
      <planeGeometry args={size} />
      <meshBasicMaterial
        transparent
        opacity={0}
        depthWrite={false}
        depthTest={false}
        colorWrite={false}
      />
    </mesh>
  );
}
