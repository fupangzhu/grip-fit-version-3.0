import { motion, AnimatePresence } from 'framer-motion';
import type { Stage } from '../data/stages';
import StackCard from './StackCard';
import './CardDeck.css';

type Props = {
  stages: Stage[];
  front: number;
  onSelect?: (i: number) => void;
};

/**
 * Depth = (i - front + count) % count
 * depth 0 = front card; depth 1/2/3 fan out to the right.
 * Keeps 4 cards on screen at once; switching is a poker-style lift-slide-drop.
 */
const depthTransform = (depth: number) => {
  switch (depth) {
    case 0:
      return { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1, filter: 'blur(0px)', zIndex: 40 };
    case 1:
      return { x: 48, y: 18, rotate: 4, scale: 0.97, opacity: 0.74, filter: 'blur(0.6px)', zIndex: 30 };
    case 2:
      return { x: 90, y: 34, rotate: 9, scale: 0.94, opacity: 0.46, filter: 'blur(0.9px)', zIndex: 20 };
    case 3:
    default:
      return { x: 128, y: 52, rotate: 14, scale: 0.91, opacity: 0.28, filter: 'blur(1.2px)', zIndex: 10 };
  }
};

export default function CardDeck({ stages, front, onSelect }: Props) {
  const count = stages.length;

  return (
    <div className="deck-wrap">
      <div className="deck">
        <AnimatePresence initial={false}>
          {stages.map((stage, i) => {
            const depth = (i - front + count) % count;
            const t = depthTransform(depth);
            const isFront = depth === 0;
            return (
              <motion.div
                key={stage.id}
                className={`deck-slot ${isFront ? 'is-front' : ''}`}
                style={{ zIndex: t.zIndex }}
                initial={false}
                animate={{
                  x: t.x,
                  y: t.y,
                  rotate: isFront && front === 0 ? -4 : t.rotate,
                  scale: t.scale,
                  opacity: t.opacity,
                  filter: t.filter,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 220,
                  damping: 26,
                  mass: 0.9,
                  opacity: { duration: 0.45 },
                  filter: { duration: 0.45 },
                }}
                whileHover={
                  isFront
                    ? undefined
                    : {
                        y: t.y - 8,
                        scale: t.scale + 0.01,
                        opacity: Math.min(1, t.opacity + 0.1),
                        transition: { type: 'spring', stiffness: 260, damping: 22 },
                      }
                }
                onClick={() => !isFront && onSelect?.(i)}
              >
                <StackCard stage={stage} isFront={isFront} />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
