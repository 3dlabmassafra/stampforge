// js/stamp-generator.js - Versione browser-compatibile (no ES modules)
// Usa THREE dal namespace globale caricato via CDN

(function(global) {

  function generatePositiveMold(shapes, params) {
    const group = new THREE.Group();

    const baseShape = new THREE.Shape();
    baseShape.moveTo(0, 0);
    baseShape.lineTo(params.width, 0);
    baseShape.lineTo(params.width, params.height);
    baseShape.lineTo(0, params.height);
    baseShape.closePath();

    const baseGeo = new THREE.ExtrudeGeometry(baseShape, { depth: params.baseThickness, bevelEnabled: false });
    const baseMesh = new THREE.Mesh(baseGeo, new THREE.MeshPhongMaterial({ color: 0x00ff88 }));
    group.add(baseMesh);

    shapes.forEach(shape => {
      const geo = new THREE.ExtrudeGeometry(shape, { depth: params.reliefDepth, bevelEnabled: false });
      const mesh = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({ color: 0x00ff88 }));
      mesh.position.z = params.baseThickness;
      group.add(mesh);
    });

    group.name = "positive";
    return group;
  }

  function generateNegativeMold(shapes, params) {
    const group = new THREE.Group();

    const baseShape = new THREE.Shape();
    baseShape.moveTo(0, 0);
    baseShape.lineTo(params.width, 0);
    baseShape.lineTo(params.width, params.height);
    baseShape.lineTo(0, params.height);
    baseShape.closePath();

    const baseGeo = new THREE.ExtrudeGeometry(baseShape, { depth: params.baseThickness, bevelEnabled: false });
    const baseMesh = new THREE.Mesh(baseGeo, new THREE.MeshPhongMaterial({ color: 0x4488ff }));
    group.add(baseMesh);

    if (shapes.length > 0) {
      const topShape = new THREE.Shape();
      topShape.moveTo(0, 0);
      topShape.lineTo(params.width, 0);
      topShape.lineTo(params.width, params.height);
      topShape.lineTo(0, params.height);
      topShape.closePath();

      shapes.forEach(shape => {
        const hole = new THREE.Path();
        const points = shape.getPoints(50);
        hole.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          hole.lineTo(points[i].x, points[i].y);
        }
        hole.closePath();
        topShape.holes.push(hole);
      });

      const topGeo = new THREE.ExtrudeGeometry(topShape, { depth: params.reliefDepth, bevelEnabled: false });
      const topMesh = new THREE.Mesh(topGeo, new THREE.MeshPhongMaterial({ color: 0x4488ff }));
      topMesh.position.z = params.baseThickness;
      group.add(topMesh);
    }

    group.name = "negative";
    group.position.x = params.width + 20;
    return group;
  }

  function createRoundedRectShape(w, h, r) {
    const shape = new THREE.Shape();
    shape.moveTo(r, 0);
    shape.lineTo(w - r, 0);
    shape.quadraticCurveTo(w, 0, w, r);
    shape.lineTo(w, h - r);
    shape.quadraticCurveTo(w, h, w - r, h);
    shape.lineTo(r, h);
    shape.quadraticCurveTo(0, h, 0, h - r);
    shape.lineTo(0, r);
    shape.quadraticCurveTo(0, 0, r, 0);
    return shape;
  }

  global.StampGenerator = {
    generatePositiveMold,
    generateNegativeMold,
    createRoundedRectShape
  };

})(window);
