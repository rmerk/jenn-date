import { motion, useReducedMotion } from 'framer-motion';

interface CoupleCartoonProps {
  size?: number;
  className?: string;
  alt?: string;
  interactive?: boolean;
}

export function CoupleCartoon({
  size = 280,
  className = '',
  alt = 'Cartoon illustration of us',
  interactive = false,
}: CoupleCartoonProps) {
  const reduceMotion = useReducedMotion();

  const img = (
    <img
      src="/couple-cartoon.png"
      alt={alt}
      width={size}
      height={size}
      className="rounded-2xl object-cover select-none"
      draggable={false}
    />
  );

  if (!interactive || reduceMotion) {
    return (
      <span className={`inline-block ${className}`} style={{ width: size, height: size }}>
        {img}
      </span>
    );
  }

  return (
    <motion.span
      className={`couple-cartoon inline-block select-none ${className}`}
      style={{ width: size, height: size }}
      whileHover={{ scale: 1.04, rotate: -1 }}
      whileTap={{ scale: 0.96, rotate: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
    >
      {img}
    </motion.span>
  );
}

export function CoupleCartoonMini({ className = 'w-10 h-10' }: { className?: string }) {
  return <CoupleCartoon size={40} className={className} alt="" />;
}
