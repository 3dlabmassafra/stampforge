// js/stamp-generator.js
let currentParams = {
  width: 60,
  height: 80,
  baseThickness: 3.5,
  reliefDepth: 1.8,
  borderMargin: 6,
  cornerRadius: 4,
  mirror: false
};

function createRoundedRectShape(w, h, r) {
  const shape = new THREE.Shape();
  const hw = w / 2, hh = h / 2;
  r = Math.min(r, hw * 0.8, hh * 0.8);

  shape.moveTo(-hw + r, -hh);
  shape.lineTo(hw - r, -hh);
  shape.quadraticCurveTo(hw, -hh, hw, -hh + r);
  shape.lineTo(hw, hh - r);
  shape.quadraticCurveTo(hw, hh, hw - r, hh);
  shape.lineTo(-hw + r, hh);
  shape.quadraticCurveTo(-hw, hh, -hw, hh - r);
  shape.lineTo(-hw, -hh + r);
  shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
  return shape;
}

function fitAndCenterShapes(shapes, params) {
  if (!shapes || shapes.length === 0) return shapes;
  
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  
  shapes.forEach(shape => {
    const points = shape.getPoints(50);
    points.forEach(p => {
      minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
    });
  });

  const scaleX = (params.width - params.borderMargin * 2) / (maxX - minX);
  const scaleY = (params.height - params.borderMargin * 2) / (maxY - minY);
  const scale = Math.min(scaleX, scaleY) * 0.92;

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  return shapes.map(shape => {
    const newShape = new THREE.Shape();
    const pts = shape.getPoints(50).map(p => 
      new THREE.Vector2((p.x - centerX) * scale, (p.y - centerY) * scale)
    );
    
    newShape.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) newShape.lineTo(pts[i].x, pts[i].y);
    newShape.closePath();
    return newShape;
  });
}

window.generateStampMolds = function(shapes, params = {}) {
  const p = { ...currentParams, ...params };
  let processedShapes = fitAndCenterShapes(shapes, p);
  if (p.mirror) {
    processedShapes = processedShapes.map(s => {
      const ns = new THREE.Shape();
      const pts = s.getPoints(50).map(pt => new THREE.Vector2(-pt.x, pt.y));
      ns.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ns.lineTo(pts[i].x, pts[i].y);
      ns.closePath();
      return ns;
    });
  }
  return { shapes: processedShapes, params: p };
};
