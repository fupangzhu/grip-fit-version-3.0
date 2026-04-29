import { motion } from 'framer-motion';
import './Dots.css';

type Props = {
  count: number;
  active: number;
  onSelect?: (i: number) => void;
};

export default function Dots({ count, active, onSelect }: Props) {
  return (
    <div className="gf-dots" role="tablist" aria-label="卡片指示器">
      {Array.from({ length: count }).map((_, i) => {
        const isActive = i === active;
        return (
          <motion.button
            key={i}
            className={`gf-dot ${isActive ? 'is-active' : ''}`}
            layout
            aria-selected={isActive}
            role="tab"
            onClick={() => onSelect?.(i)}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          />
        );
      })}
    </div>
  );
}
