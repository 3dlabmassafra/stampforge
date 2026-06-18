/**
 * StampForge - Versione migliorata (ispirata a Sellomaker)
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const DEFAULT_PARAMS = {
  width: 60,
  height: 80,
  baseThickness: 3,
  reliefDepth: 1.8,
  borderMargin: 6,
  cornerRadius: 4,
  alignmentPins: true,
  mirror: false,
  bevelEnabled: true,
};

function createRoundedRectShape(w, h, r) {
  const shape = new THREE.Shape();
  const hw = w / 2;
  const hh = h / 2;
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

function getShapesBounds(shapes) {
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  for (const shape of shapes) {
    const pts = shape.getPoints(48);
    for (const pt of pts) {
      minX = Math.min(minX, pt.x); maxX = Math.max(maxX, pt.x);
      minY = Math.min(minY, pt.y); maxY = Math.max(maxY, pt.y);
    }
  }
  return { minX, maxX, minY, maxY, width: maxX-minX, height: maxY-minY, centerX: (minX+maxX)/2, centerY: (minY+maxY)/2 };
}

function fitShapes(shapes, params) {
  if (!shapes?.length) return [];
  const bounds = getShapesBounds(shapes);
  if (bounds.width === 0 || bounds.height === 0) return shapes;

  const availW = params.width - 2 * params.borderMargin;
  const availH = params.height - 2 * params.borderMargin;
  const scale = Math.min(availW / bounds.width, availH / bounds.height) * 0.95; // margine extra

  return shapes.map(shape => {
    const newShape = new THREE.Shape();
    const pts = shape.getPoints(48);
    const transformed = pts.map(pt => new THREE.Vector2(
      (pt.x - bounds.centerX) * scale,
      (pt.y - bounds.centerY) * scale
    ));

    newShape.moveTo(transformed[0].x, transformed[0].y);
    for (let i = 1; i < transformed.length; i++) {
      newShape.lineTo(transformed[i].x, transformed[i].y);
    }
    newShape.closePath();

    // Gestione holes
    if (shape.holes) {
      newShape.holes = shape.holes.map(hole => {
        const hPts = hole.getPoints(48);
        const hTransformed = hPts.map(pt => new THREE.Vector2(
          (pt.x - bounds.centerX) * scale,
          (pt.y - bounds.centerY) * scale
        ));
        const newHole = new THREE.Path();
        newHole.moveTo(hTransformed[0].x, hTransformed[0].y);
        for (let i = 1; i < hTransformed.length; i++) {
          newHole.lineTo(hTransformed[i].x, hTransformed[i].y);
        }
        newHole.closePath();
        return newHole;
      });
    }
    return newShape;
  });
}

function mirrorShapes(shapes) {
  return shapes.map(shape => {
    const newShape = new THREE.Shape();
    const pts = shape.getPoints(48);
    const mPts = pts.map(pt => new THREE.Vector2(-pt.x, pt.y));
    newShape.moveTo(mPts[0].x, mPts[0].y);
    for (let i = 1; i < mPts.length; i++) newShape.lineTo(mPts[i].x, mPts[i].y);
    newShape.closePath();

    if (shape.holes) {
      newShape.holes = shape.holes.map(hole => {
        const hPts = hole.getPoints(48);
        const mhPts = hPts.map(pt => new THREE.Vector2(-pt.x, pt.y));
        const newHole = new THREE.Path();
        newHole.moveTo(mhPts[0].x, mhPts[0].y);
        for (let i = 1; i < mhPts.length; i++) newHole.lineTo(mhPts[i].x, mhPts[i].y);
        newHole.closePath();
        return newHole;
      });
    }
    return newShape;
  });
}

function createPinGeometry(x, y, height, radius, isHole = false) {
  const r = isHole ? radius + 0.2 : radius;
  const geo = new THREE.CylinderGeometry(r, r, height, 32);
  geo.rotateX(Math.PI / 2);
  geo.translate(x, y, height / 2);
  return geo;
}

function generatePositiveMold(shapes, params) {
  const geometries = [];
  const baseShape = createRoundedRectShape(params.width, params.height, params.cornerRadius);
  
  const baseGeo = new THREE.ExtrudeGeometry(baseShape, {
    depth: params.baseThickness,
    bevelEnabled: params.bevelEnabled,
    bevelThickness: 0.4,
    bevelSize: 0.3,
    bevelSegments: 4
  });
  geometries.push(baseGeo);

  if (shapes.length > 0) {
    const extrudeSettings = {
      depth: params.reliefDepth,
      bevelEnabled: params.bevelEnabled,
      bevelThickness: 0.4,
      bevelSize: 0.25,
      bevelSegments: 4
    };

    for (const shape of shapes) {
      const shapeGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      shapeGeo.translate(0, 0, params.baseThickness);
      geometries.push(shapeGeo);
    }
  }

  // Pin positivi
  if (params.alignmentPins) {
    const pinR = 1.6;
    const pinH = params.reliefDepth + 2;
    const offset = params.borderMargin * 0.7;
    const positions = [[-offset, -offset], [offset, -offset], [-offset, offset], [offset, offset]];
    
    for (const [x, y] of positions) {
      const pinGeo = createPinGeometry(x, y, pinH, pinR);
      pinGeo.translate(0, 0, params.baseThickness);
      geometries.push(pinGeo);
    }
  }

  const merged = geometries.length > 1 ? mergeGeometries(geometries) : geometries[0];
  
  const material = new THREE.MeshPhysicalMaterial({
    color: 0x00fe7b,
    metalness: 0.25,
    roughness: 0.35,
    clearcoat: 0.6,
    clearcoatRoughness: 0.2,
  });

  const mesh = new THREE.Mesh(merged, material);
  mesh.name = 'positive_mold';
  return mesh;
}

function generateNegativeMold(shapes, params) {
  const geometries = [];
  const baseShape = createRoundedRectShape(params.width, params.height, params.cornerRadius);
  
  const baseGeo = new THREE.ExtrudeGeometry(baseShape, {
    depth: params.baseThickness,
    bevelEnabled: params.bevelEnabled,
    bevelThickness: 0.4,
    bevelSize: 0.3,
    bevelSegments: 4
  });
  geometries.push(baseGeo);

  if (shapes.length > 0) {
    const topShape = createRoundedRectShape(params.width, params.height, params.cornerRadius);

    for (const shape of shapes) {
      try {
        const pts = shape.getPoints(48);
        if (pts.length < 3) continue;
        const holePath = new THREE.Path();
        holePath.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) holePath.lineTo(pts[i].x, pts[i].y
