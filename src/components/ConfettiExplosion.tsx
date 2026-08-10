import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export interface ConfettiBurst {
  id: string;
  x: number; // pixel coordinate or window center
  y: number; // pixel coordinate or window center
  particleCount?: number;
}

interface ConfettiExplosionProps {
  bursts: ConfettiBurst[];
  onCompleteBurst?: (id: string) => void;
}

interface Particle {
  id: string;
  color: string;
  shape: 'rect' | 'circle' | 'star' | 'emoji';
  emoji?: string;
  size: number;
  targetX: number;
  targetY: number;
  targetRotate: number;
  duration: number;
  delay: number;
}

const COLORS = [
  '#a3e635', // lime-400
  '#22d3ee', // cyan-400
  '#f43f5e', // rose-500
  '#fbbf24', // amber-400
  '#c084fc', // purple-400
  '#34d399', // emerald-400
  '#fb923c', // orange-400
  '#38bdf8', // sky-400
  '#ffffff', // white
];

const EMOJIS = ['🎉', '✨', '⚡', '🔥', '🌟', '💎', '🏆', '💯'];

export const ConfettiExplosion: React.FC<ConfettiExplosionProps> = ({ bursts, onCompleteBurst }) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden" aria-hidden="true">
      <AnimatePresence>
        {bursts.map((burst) => (
          <BurstGroup key={burst.id} burst={burst} onComplete={() => onCompleteBurst?.(burst.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
};

const BurstGroup: React.FC<{ burst: ConfettiBurst; onComplete: () => void }> = ({ burst, onComplete }) => {
  const [particles] = useState<Particle[]>(() => {
    const count = burst.particleCount || 45;
    const generated: Particle[] = [];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      // Distance burst radius 90px - 320px
      const distance = 90 + Math.random() * 230;
      const targetX = Math.cos(angle) * distance;
      // downward gravity trajectory
      const targetY = Math.sin(angle) * distance + (120 + Math.random() * 120);

      const shapes: ('rect' | 'circle' | 'star' | 'emoji')[] = ['rect', 'circle', 'rect', 'star', 'emoji'];
      const shape = shapes[Math.floor(Math.random() * shapes.length)];
      const emoji = shape === 'emoji' ? EMOJIS[Math.floor(Math.random() * EMOJIS.length)] : undefined;
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];

      generated.push({
        id: `particle-${i}-${Math.random()}`,
        color,
        shape,
        emoji,
        size: shape === 'emoji' ? 20 : 6 + Math.random() * 8,
        targetX,
        targetY,
        targetRotate: (Math.random() - 0.5) * 1080,
        duration: 1.2 + Math.random() * 0.9,
        delay: Math.random() * 0.12,
      });
    }

    return generated;
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2400);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const originX = typeof burst.x === 'number' && !isNaN(burst.x) ? burst.x : window.innerWidth / 2;
  const originY = typeof burst.y === 'number' && !isNaN(burst.y) ? burst.y : window.innerHeight / 3;

  return (
    <div
      style={{
        position: 'absolute',
        left: originX,
        top: originY,
        pointerEvents: 'none',
      }}
    >
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{
            x: 0,
            y: 0,
            scale: 0,
            opacity: 1,
            rotate: 0,
          }}
          animate={{
            x: p.targetX,
            y: p.targetY,
            scale: [0, 1.4, 1, 0.3],
            opacity: [1, 1, 0.9, 0],
            rotate: p.targetRotate,
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: [0.12, 0.8, 0.32, 1],
          }}
          style={{
            position: 'absolute',
            width: p.shape === 'emoji' ? 'auto' : p.size,
            height: p.shape === 'emoji' ? 'auto' : p.size,
            backgroundColor: p.shape === 'emoji' ? 'transparent' : p.color,
            borderRadius: p.shape === 'circle' ? '50%' : p.shape === 'star' ? '2px' : '3px',
            fontSize: p.shape === 'emoji' ? `${p.size}px` : undefined,
            boxShadow: p.shape === 'emoji' ? undefined : `0 0 10px ${p.color}cc`,
          }}
        >
          {p.shape === 'emoji' ? p.emoji : null}
        </motion.div>
      ))}
    </div>
  );
};
