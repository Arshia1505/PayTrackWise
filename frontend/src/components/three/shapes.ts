import * as THREE from "three";

/** Heater shield outline centred on the origin, `w` wide and `h` tall. */
export function shieldShape(w = 1, h = 1.25) {
  const s = new THREE.Shape();
  s.moveTo(0, h * 0.5);
  s.bezierCurveTo(w * 0.22, h * 0.53, w * 0.4, h * 0.5, w * 0.5, h * 0.42);
  s.bezierCurveTo(w * 0.53, h * 0.02, w * 0.4, -h * 0.3, 0, -h * 0.5);
  s.bezierCurveTo(-w * 0.4, -h * 0.3, -w * 0.53, h * 0.02, -w * 0.5, h * 0.42);
  s.bezierCurveTo(-w * 0.4, h * 0.5, -w * 0.22, h * 0.53, 0, h * 0.5);
  return s;
}

/** The ₹ glyph built from primitive strokes, roughly 1 unit tall and centred. */
export function rupeeShapes() {
  const shapes: THREE.Shape[] = [];
  const rect = (x0: number, y0: number, x1: number, y1: number) => {
    const r = new THREE.Shape();
    r.moveTo(x0, y0);
    r.lineTo(x1, y0);
    r.lineTo(x1, y1);
    r.lineTo(x0, y1);
    r.closePath();
    return r;
  };

  shapes.push(rect(-0.42, 0.61, 0.42, 0.73));
  shapes.push(rect(-0.42, 0.35, 0.42, 0.46));

  const cx = 0;
  const cy = 0.4;
  const ro = 0.33;
  const ri = 0.21;
  const bowl = new THREE.Shape();
  bowl.moveTo(cx, cy + ro);
  bowl.absarc(cx, cy, ro, Math.PI / 2, -Math.PI / 2, true);
  bowl.lineTo(cx, cy - ri);
  bowl.absarc(cx, cy, ri, -Math.PI / 2, Math.PI / 2, false);
  bowl.closePath();
  shapes.push(bowl);

  shapes.push(rect(-0.42, cy - ro, 0.02, cy - ri));

  const leg = new THREE.Shape();
  leg.moveTo(-0.42, cy - ri);
  leg.lineTo(-0.2, cy - ri);
  leg.lineTo(0.42, -0.75);
  leg.lineTo(0.18, -0.75);
  leg.closePath();
  shapes.push(leg);

  return shapes;
}
