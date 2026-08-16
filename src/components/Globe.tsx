'use client';

import { useEffect, useRef } from 'react';
import createGlobe from 'cobe';

export function Globe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phiRef = useRef(2.5);
  const dragging = useRef(false);
  const lastX = useRef(0);

  useEffect(() => {
    if (!canvasRef.current) return;

    const size = canvasRef.current.offsetWidth;

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: size * 2,
      height: size * 2,
      phi: phiRef.current,
      theta: -0.25,
      // dark: 0 = light mode (white sphere, dark dots)
      // Use very high mapBrightness to make the land dots deep/dark
      // and a slight blue baseColor so the contrast between sphere and dots reads as blue-on-white
      dark: 0,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 1.5,
      mapBaseBrightness: 0.05,
      baseColor: [1, 1, 1],
      markerColor: [0.267, 0.255, 0.769],
      glowColor: [0.988, 0.976, 0.965], // matches page bg, hides glow
      markers: [],
    });

    let animFrame: number;
    function animate() {
      animFrame = requestAnimationFrame(animate);
      if (!dragging.current) phiRef.current += 0.003;
      globe.update({ phi: phiRef.current });
    }
    animate();

    const onResize = () => {
      if (!canvasRef.current) return;
      const s = canvasRef.current.offsetWidth;
      globe.update({ width: s * 2, height: s * 2 });
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animFrame);
      globe.destroy();
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <div className="relative w-full aspect-square select-none">
      {/* SVG color matrix: remaps black dots → #4441c4 blue, white sphere stays white */}
      <svg style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
        <defs>
          <filter id="globe-blue-filter" colorInterpolationFilters="sRGB">
            <feColorMatrix
              type="matrix"
              values="0.733 0 0 0 0.267
                      0 0.745 0 0 0.255
                      0 0 0.231 0 0.769
                      0 0 0 1 0"
            />
          </filter>
        </defs>
      </svg>

      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ cursor: 'grab', filter: 'url(#globe-blue-filter)' }}
        onPointerDown={(e) => {
          dragging.current = true;
          lastX.current = e.clientX;
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
        }}
        onPointerUp={() => { dragging.current = false; }}
        onPointerCancel={() => { dragging.current = false; }}
        onPointerMove={(e) => {
          if (!dragging.current) return;
          const dx = e.clientX - lastX.current;
          phiRef.current += dx * 0.006;
          lastX.current = e.clientX;
        }}
      />
    </div>
  );
}
