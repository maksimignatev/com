import React, { useMemo } from "react";
import { Graphics } from "pixi.js";

interface Props {
  x: number;
  y: number;
  name: string;
  selected: boolean;
  color: number;
  onClick: () => void;
  radius?: number;
}

export const EntityDot: React.FC<Props> = ({
  x,
  y,
  name,
  selected,
  color,
  onClick,
  radius = 8
}) => {
  const draw = useMemo(() => {
    return (g: PIXI.Graphics) => {
      g.clear();
      g.beginFill(color);
      g.lineStyle(selected ? 3 : 2, selected ? 0xffffff : 0x222222);
      g.drawCircle(0, 0, selected ? radius + 4 : radius);
      g.endFill();
    };
  }, [color, radius, selected]);

  return (
    <pixiGraphics
      x={x}
      y={y}
      draw={draw}
      interactive
      pointertap={onClick}
      cursor="pointer"
      title={name}
    />
  );
};
