// Feature card drag constants extracted from socio.io bundles
// Module 9674 TiltCard component analysis

export const TILT_CONFIG = {
  // Default rotation factor from reference: rotationFactor: l = 15
  rotationFactor: 15,
  // Perspective value from reference: perspective(1000px)
  perspective: 1000,
  // Spring options for smooth tilt return
  springOptions: {
    stiffness: 300,
    damping: 30,
  },
};

export const DRAG_CONFIG = {
  // dragElastic from reference: dragElastic: r = .35
  elastic: 0.35,
  // Spring config from reference: stiffness: 500, damping: 25
  spring: {
    stiffness: 500,
    damping: 25,
    mass: 1,
  },
  // Snap threshold - how far to drag before snapping
  snapThreshold: 100,
  // Momentum disabled for rubber-band feel
  momentum: false,
};

export const CARD_GLOW = {
  // Primary purple color from reference: #ac9cfc
  primary: "#ac9cfc",
  // Opacity values for border glow
  borderOpacity: {
    idle: 0.3,
    hover: 0.6,
    active: 0.8,
  },
  // Shadow spread
  shadowSpread: "0 0 20px",
};

// Easing curves from reference site
export const EASING = {
  // Standard: [0.25, 0.1, 0.25, 1] - used for most transitions
  standard: [0.25, 0.1, 0.25, 1] as const,
  // Smooth: [0.4, 0, 0.2, 1] - used for content transitions
  smooth: [0.4, 0, 0.2, 1] as const,
};

// Calculate rotation based on mouse position within element
export function calculateTiltRotation(
  mouseX: number,
  mouseY: number,
  elementWidth: number,
  elementHeight: number,
  rotationFactor: number = TILT_CONFIG.rotationFactor,
  isReverse: boolean = false
): { rotateX: number; rotateY: number } {
  // Normalize position to [-0.5, 0.5] range
  const normalizedX = mouseX / elementWidth - 0.5;
  const normalizedY = mouseY / elementHeight - 0.5;

  // Map to rotation values
  const rotateY = isReverse
    ? normalizedX * rotationFactor * -1
    : normalizedX * rotationFactor;
  const rotateX = isReverse
    ? normalizedY * rotationFactor
    : normalizedY * rotationFactor * -1;

  return { rotateX, rotateY };
}

// Calculate drag resistance (rubber band effect)
export function calculateDragResistance(
  offset: number,
  maxOffset: number,
  elastic: number = DRAG_CONFIG.elastic
): number {
  // Beyond bounds, apply elastic resistance
  if (Math.abs(offset) > maxOffset) {
    const overflow = Math.abs(offset) - maxOffset;
    const resistance = maxOffset + overflow * elastic;
    return offset > 0 ? resistance : -resistance;
  }
  return offset;
}

// Determine snap position based on velocity and offset
export function calculateSnapPosition(
  offset: number,
  velocity: number,
  snapPoints: number[],
  threshold: number = DRAG_CONFIG.snapThreshold
): number {
  // Find closest snap point
  let closest = snapPoints[0];
  let minDistance = Math.abs(offset - snapPoints[0]);

  for (const point of snapPoints) {
    const distance = Math.abs(offset - point);
    if (distance < minDistance) {
      minDistance = distance;
      closest = point;
    }
  }

  // If velocity is strong enough, snap to next point in direction
  if (Math.abs(velocity) > 500) {
    const direction = velocity > 0 ? 1 : -1;
    const currentIndex = snapPoints.indexOf(closest);
    const nextIndex = currentIndex + direction;
    if (nextIndex >= 0 && nextIndex < snapPoints.length) {
      return snapPoints[nextIndex];
    }
  }

  return closest;
}
