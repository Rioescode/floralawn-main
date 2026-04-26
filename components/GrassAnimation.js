"use client";

import { useEffect, useRef } from 'react';

export default function GrassAnimation() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let grassBlades = [];

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = 80; // Shorter height for cut grass
    };

    // Initialize grass blades
    const initGrass = () => {
      grassBlades = [];
      const bladeCount = Math.floor(canvas.width / 1.5); // Very dense grass
      for (let i = 0; i < bladeCount; i++) {
        grassBlades.push({
          x: i * 1.5,
          height: 30 + Math.random() * 10, // More uniform height
          width: 0.8 + Math.random() * 0.4, // Thinner blades
          speed: 0.5 + Math.random() * 0.5, // Slower movement
          sway: 0.1 + Math.random() * 0.1, // Less sway
          phase: Math.random() * Math.PI * 2,
          color: Math.random() > 0.9 ? '#16a34a' : '#22c55e', // Darker green shades
          controlPoint: 0.5 + Math.random() * 0.1 // More uniform curve
        });
      }
    };

    // Draw grass
    const drawGrass = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const time = Date.now() * 0.001;
      const windEffect = Math.sin(time * 0.3) * 0.2; // Gentler wind effect

      // Draw grass base (freshly cut look)
      ctx.fillStyle = '#166534';
      ctx.fillRect(0, canvas.height - 2, canvas.width, 2);

      grassBlades.forEach(blade => {
        ctx.beginPath();
        ctx.strokeStyle = blade.color;
        ctx.lineWidth = blade.width;

        // Starting point
        ctx.moveTo(blade.x, canvas.height - 2);

        // Calculate sway with wind effect
        const sway = (Math.sin(time * blade.speed + blade.phase) + windEffect) * blade.sway * 10;
        
        // Control points for more natural curve
        const cp1x = blade.x + sway * 0.3;
        const cp1y = canvas.height - blade.height * 0.2;
        const cp2x = blade.x + sway * 0.6;
        const cp2y = canvas.height - blade.height * 0.5;
        const endX = blade.x + sway * 0.8;
        const endY = canvas.height - blade.height;

        // Draw blade with bezier curve
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
        ctx.stroke();

        // Add subtle highlight effect
        if (Math.random() > 0.995) {
          ctx.strokeStyle = '#4ade80';
          ctx.lineWidth = blade.width * 0.3;
          ctx.stroke();
        }
      });

      animationFrameId = requestAnimationFrame(drawGrass);
    };

    // Initialize
    resizeCanvas();
    initGrass();
    drawGrass();

    // Handle resize
    window.addEventListener('resize', () => {
      resizeCanvas();
      initGrass();
    });

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute bottom-0 left-0 w-full h-[80px] pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
} 