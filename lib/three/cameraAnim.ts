import gsap from 'gsap';
import type { PerspectiveCamera } from 'three';
import { Vector3 } from 'three';

export type CameraTarget = {
  position: { x: number; y: number; z: number };
  lookAt: { x: number; y: number; z: number };
};

export function animateCamera(
  camera: PerspectiveCamera,
  target: CameraTarget,
  reducedMotion: boolean,
  onComplete?: () => void
): gsap.core.Timeline {
  const direction = new Vector3();
  camera.getWorldDirection(direction);
  const currentLookPoint = camera.position.clone().add(direction.multiplyScalar(1.5));

  const look = {
    x: currentLookPoint.x,
    y: currentLookPoint.y,
    z: currentLookPoint.z,
  };

  const timeline = gsap.timeline({
    defaults: { duration: reducedMotion ? 0.01 : 0.8, ease: 'power2.out' },
    onComplete,
  });

  timeline.to(
    camera.position,
    {
      x: target.position.x,
      y: target.position.y,
      z: target.position.z,
      onUpdate: () => {
        camera.lookAt(look.x, look.y, look.z);
      },
    },
    0
  );

  timeline.to(
    look,
    {
      x: target.lookAt.x,
      y: target.lookAt.y,
      z: target.lookAt.z,
      onUpdate: () => {
        camera.lookAt(look.x, look.y, look.z);
      },
    },
    0
  );

  return timeline;
}
