import { useEffect, useRef } from "react";

export function useAnimationFrame(callback: (delta: number) => void) {
  const last = useRef<number>(performance.now());
  const raf = useRef<number>();

  useEffect(() => {
    function loop(now: number) {
      const delta = (now - last.current) / 1000;
      last.current = now;
      callback(delta);
      raf.current = requestAnimationFrame(loop);
    }
    raf.current = requestAnimationFrame(loop);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [callback]);
}
