import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
let idCounter = 0;

export const CustomCursor = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [trails, setTrails] = useState<Array<{ x: number; y: number; id: number }>>([]);

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });

      // Use guaranteed unique ID
      setTrails(prev => [
        ...prev.slice(-8),
        { x: e.clientX, y: e.clientY, id: ++idCounter }
      ]);
    };

    window.addEventListener('mousemove', updateMousePosition);
    return () => window.removeEventListener('mousemove', updateMousePosition);
  }, []);

  return (
    <>
      {/* Main cursor */}
      <motion.div
        className="fixed top-0 left-0 w-6 h-6 pointer-events-none z-50 mix-blend-screen"
        animate={{
          x: mousePosition.x - 12,
          y: mousePosition.y - 12,
        }}
        transition={{
          type: "spring",
          damping: 30,
          stiffness: 200,
          mass: 0.5
        }}
      >
        <div className="w-full h-full rounded-full bg-gradient-to-r from-purple-glow to-cyan-accent opacity-80 blur-sm" />
      </motion.div>

      {/* Cursor trails */}
      {trails.map((trail, index) => (
        <motion.div
          key={trail.id}
          className="fixed top-0 left-0 w-3 h-3 pointer-events-none z-40 rounded-full bg-purple-glow"
          initial={{
            x: trail.x - 6,
            y: trail.y - 6,
            opacity: 1,
            scale: 1,
          }}
          animate={{
            opacity: 0,
            scale: 0,
          }}
          transition={{
            duration: 0.6,
            delay: index * 0.02,
          }}
          style={{
            opacity: (index + 1) / trails.length * 0.3,
          }}
        />
      ))}
    </>
  );
};