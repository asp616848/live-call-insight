import { motion } from 'framer-motion';

export const BackgroundAnimation = () => {
  // Generate floating particles
  const particles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 2,
    duration: Math.random() * 20 + 10,
    delay: Math.random() * 5,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Gradient overlays */}
      <div className="absolute top-0 left-0 w-1/3 h-1/3 bg-gradient-to-br from-purple-glow/20 to-transparent rounded-full blur-3xl animate-pulse" />
      <div className="absolute top-1/2 right-0 w-1/4 h-1/4 bg-gradient-to-bl from-cyan-accent/15 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-0 left-1/3 w-1/3 h-1/3 bg-gradient-to-tr from-purple-glow/10 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />

      {/* Floating particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full opacity-30"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            background: `hsl(${270 + Math.random() * 60} 70% 70%)`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.random() * 20 - 10, 0],
            opacity: [0.1, 0.4, 0.1],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Animated grid lines */}
      <div className="absolute inset-0 opacity-5">
        <div className="grid grid-cols-12 h-full">
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.div
              key={i}
              className="border-r border-purple-glow"
              animate={{ opacity: [0.1, 0.3, 0.1] }}
              transition={{
                duration: 4,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      </div>

      {/* Scanning line effect */}
      <motion.div
        className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-accent to-transparent opacity-50"
        animate={{ y: ['0vh', '100vh'] }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </div>
  );
};