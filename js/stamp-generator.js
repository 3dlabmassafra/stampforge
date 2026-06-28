/**
 * StampForge — Stamp Generator Module
 * 
 * Generates parametric 3D positive and negative stamp mold geometries
 * from Three.js Shape objects. Uses ExtrudeGeometry and Shape holes
 * approach.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const DEFAULT_PARAMS = {
  width: 60,
  height: 80,
  baseThickness: 3,
  reliefDepth: 1.5,
  borderMargin: 5,
  cornerRadius: 3,
  alignmentPins: true,
  mirror: false,
  hinge: false
};

function createRoundedRectShape(w, h, r) {
  const shape = new THREE.Shape();
  const hw = w / 2;
  const hh = h / 2;
  r = Math.min(r, hw, hh);

  shape.moveTo(-hw + r, -hh);
  shape.lineTo(hw - r, -hh);
  if (r > 0) shape.quadraticCurveTo(hw, -hh, hw, -hh + r);
  shape.lineTo(hw, hh - r);
  if (r > 0) shape.quadraticCurveTo(hw, hh, hw - r, hh);
  shape.lineTo(-hw + r, hh);
  if (r > 0) shape.quadraticCurveTo(-hw, hh, -hw, hh - r);
  shape.lineTo(-hw, -hh + r);
  if (r > 0) shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh);

  return shape;
}

function getShapesBounds(shapes) {
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  for (const shape of shapes) {
    const pts = shape.getPoints(64);
    for (const pt of pts) {
      minX = Math.min(minX, pt.x);
      maxX = Math.max(maxX, pt.x);
      minY = Math.min(minY, pt.y);
      maxY = Math.max(maxY, pt.y);
    }
    if (shape.holes) {
      for (const hole of shape.holes) {
        const holePts = hole.getPoints(64);
        for (const pt of holePts) {
          minX = Math.min(minX, pt.x);
          maxX = Math.max(maxX, pt.x);
          minY = Math.min(minY, pt.y);
          maxY = Math.max(maxY, pt.y);
        }
      }
    }
  }

  return {
    minX, maxX, minY, maxY,
    width: maxX - minX,
    height: maxY - minY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  };
}

function fitShapes(shapes, params) {
  if (!shapes || shapes.length === 0) return [];

  const bounds = getShapesBounds(shapes);
  if (bounds.width === 0 || bounds.height === 0) return shapes;

  const availW = params.width - 2 * params.borderMargin;
  const availH = params.height - 2 * params.borderMargin;
  const scale = Math.min(availW / bounds.width, availH / bounds.height);

  const fitted = [];
  for (const shape of shapes) {
    const newShape = new THREE.Shape();
    const pts = shape.getPoints(64);
    const transformed = pts.map(pt => new THREE.Vector2(
      (pt.x - bounds.centerX) * scale,
      (pt.y - bounds.centerY) * scale
    ));

    if (transformed.length > 0) {
      newShape.moveTo(transformed[0].x, transformed[0].y);
      for (let i = 1; i < transformed.length; i++) {
        newShape.lineTo(transformed[i].x, transformed[i].y);
      }
      newShape.closePath();
    }

    if (shape.holes && shape.holes.length > 0) {
      for (const hole of shape.holes) {
        const holePts = hole.getPoints(64);
        const holeTransformed = holePts.map(pt => new THREE.Vector2(
          (pt.x - bounds.centerX) * scale,
          (pt.y - bounds.centerY) * scale
        ));
        if (holeTransformed.length > 0) {
          const newHole = new THREE.Path();
          newHole.moveTo(holeTransformed[0].x, holeTransformed[0].y);
          for (let i = 1; i < holeTransformed.length; i++) {
            newHole.lineTo(holeTransformed[i].x, holeTransformed[i].y);
          }
          newHole.closePath();
          newShape.holes.push(newHole);
        }
      }
    }

    fitted.push(newShape);
  }

  return fitted;
}

function mirrorShapes(shapes) {
  const mirrored = [];
  for (const shape of shapes) {
    const pts = shape.getPoints(64);
    const newShape = new THREE.Shape();
    const mPts = pts.map(pt => new THREE.Vector2(-pt.x, pt.y));

    if (mPts.length > 0) {
      newShape.moveTo(mPts[0].x, mPts[0].y);
      for (let i = 1; i < mPts.length; i++) {
        newShape.lineTo(mPts[i].x, mPts[i].y);
      }
      newShape.closePath();
    }

    if (shape.holes) {
      for (const hole of shape.holes) {
        const holePts = hole.getPoints(64);
        const newHole = new THREE.Path();
        const mhPts = holePts.map(pt => new THREE.Vector2(-pt.x, pt.y));
        if (mhPts.length > 0) {
          newHole.moveTo(mhPts[0].x, mhPts[0].y);
          for (let i = 1; i < mhPts.length; i++) {
            newHole.lineTo(mhPts[i].x, mhPts[i].y);
          }
          newHole.closePath();
          newShape.holes.push(newHole);
        }
      }
    }

    mirrored.push(newShape);
  }
  return mirrored;
}

function createPinGeometry(x, y, height, radius, isHole = false) {
  const r = isHole ? radius + 0.15 : radius;
  const geo = new THREE.CylinderGeometry(r, r, height, 24).toNonIndexed();
  geo.rotateX(Math.PI / 2);
  geo.translate(x, y, height / 2);
  return geo;
}


function getOuterShape(type, hingeX, gap, T, R_hinge) {
  const shape = new THREE.Shape();
  if (type === 'pos') {
    shape.moveTo(hingeX - gap, 0);
    shape.lineTo(hingeX, 0);
    shape.lineTo(hingeX, T - R_hinge);
    shape.absarc(hingeX, T, R_hinge, -Math.PI/2, Math.PI, false);
    shape.lineTo(hingeX - gap, T);
  } else {
    shape.moveTo(hingeX + gap, 0);
    shape.lineTo(hingeX, 0);
    shape.lineTo(hingeX, T - R_hinge);
    shape.absarc(hingeX, T, R_hinge, -Math.PI/2, 0, true);
    shape.lineTo(hingeX + gap, T);
  }
  return shape;
}

function createSolidKnuckle(type, y_start, length, T, gap, hingeX) {
  const R_hinge = 3.5;
  const shape = getOuterShape(type, hingeX, gap, T, R_hinge);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: length, bevelEnabled: false, curveSegments: 24 }).toNonIndexed();
  geo.rotateX(Math.PI / 2);
  geo.translate(0, y_start, 0);
  return geo;
}

function createHollowKnuckle(type, y_start, length, T, gap, hingeX) {
  const R_hinge = 3.5;
  const r_hole = 2.2;
  const shape = getOuterShape(type, hingeX, gap, T, R_hinge);
  const hole = new THREE.Path();
  hole.absarc(hingeX, T, r_hole, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: length, bevelEnabled: false, curveSegments: 24 }).toNonIndexed();
  geo.rotateX(Math.PI / 2);
  geo.translate(0, y_start, 0);
  return geo;
}

function createPin(y_start, length, T, hingeX) {
  const r_pin = 1.8;
  const shape = new THREE.Shape();
  shape.absarc(hingeX, T, r_pin, 0, Math.PI * 2, false);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: length, bevelEnabled: false, curveSegments: 16 }).toNonIndexed();
  geo.rotateX(Math.PI / 2);
  geo.translate(0, y_start, 0);
  return geo;
}


function generatePositiveMold(shapes, params) {
  const geometries = [];

  const baseShape = createRoundedRectShape(params.width, params.height, params.cornerRadius);
  const baseGeo = new THREE.ExtrudeGeometry(baseShape, {
    depth: params.baseThickness,
    bevelEnabled: false,
  }).toNonIndexed();
  geometries.push(baseGeo);

  if (shapes.length > 0) {
    const extrudeSettings = {
      depth: params.reliefDepth,
      bevelEnabled: false,
    };

    for (const shape of shapes) {
      try {
        const shapeGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings).toNonIndexed();
        shapeGeo.translate(0, 0, params.baseThickness);
        geometries.push(shapeGeo);
      } catch (e) {
        console.warn('Failed to extrude shape:', e);
      }
    }
  }

  if (params.alignmentPins && !params.hinge) {
    const pinRadius = 1.5;
    const pinHeight = params.reliefDepth + 1;
    const px = params.width / 2 - params.borderMargin / 2;
    const py = params.height / 2 - params.borderMargin / 2;

    const pinPositions = [
      [-px, -py],
      [px, -py],
      [-px, py],
      [px, py],
    ];

    for (const [x, y] of pinPositions) {
      const pinGeo = createPinGeometry(x, y, pinHeight, pinRadius, false);
      pinGeo.translate(0, 0, params.baseThickness);
      geometries.push(pinGeo);
    }
  }

  if (params.hinge) {
    const gap = 4;
    const hingeX = params.width / 2 + gap;
    const T = params.baseThickness + params.reliefDepth;
    const L = Math.max(10, Math.min(47, params.height - 10));
      const k_len = L / 3;
      const v_gap = 0.4;
      const cap_len = 2.0;

      const top_y_start = L/2;
      const top_len = k_len - v_gap/2;
      const topCap = createSolidKnuckle('pos', top_y_start, cap_len, T, gap, hingeX);
      const topHollow = createHollowKnuckle('pos', top_y_start - cap_len, top_len - cap_len, T, gap, hingeX);

      const bot_y_start = -k_len/2 - v_gap/2;
      const bot_len = k_len - v_gap/2;
      const botHollow = createHollowKnuckle('pos', bot_y_start, bot_len - cap_len, T, gap, hingeX);
      const botCap = createSolidKnuckle('pos', bot_y_start - (bot_len - cap_len), cap_len, T, gap, hingeX);

      geometries.push(topCap, topHollow, botHollow, botCap);
  }

  const validGeometries = geometries.filter(g => g && g.attributes && g.attributes.position);
  let merged;
  if (validGeometries.length > 1) {
    merged = mergeGeometries(validGeometries);
  } else if (validGeometries.length === 1) {
    merged = validGeometries[0];
  } else {
    merged = new THREE.BufferGeometry();
  }
  
  const material = new THREE.MeshPhysicalMaterial({
    color: 0x00fe7b,
    metalness: 0.3,
    roughness: 0.4,
    clearcoat: 0.3,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(merged, material);
  mesh.name = 'positive_mold';
  return mesh;
}

function generateNegativeMold(shapes, params) {
  const geometries = [];
  const totalHeight = params.baseThickness + params.reliefDepth;

  const floorShape = createRoundedRectShape(params.width, params.height, params.cornerRadius);
  const floorGeo = new THREE.ExtrudeGeometry(floorShape, {
    depth: params.baseThickness,
    bevelEnabled: false,
  }).toNonIndexed();
  geometries.push(floorGeo);

  if (shapes.length > 0) {
    const borderShape = createRoundedRectShape(params.width, params.height, params.cornerRadius);

    for (const shape of shapes) {
      try {
        const pts = shape.getPoints(64);
        if (pts.length < 3) continue;

        const holePath = new THREE.Path();
        holePath.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          holePath.lineTo(pts[i].x, pts[i].y);
        }
        holePath.closePath();
        borderShape.holes.push(holePath);
      } catch (e) {
        console.warn('Failed to create hole from shape:', e);
      }
    }

    const wallGeo = new THREE.ExtrudeGeometry(borderShape, {
      depth: params.reliefDepth,
      bevelEnabled: false,
    }).toNonIndexed();
    wallGeo.translate(0, 0, params.baseThickness);
    geometries.push(wallGeo);
  } else {
    const topShape = createRoundedRectShape(params.width, params.height, params.cornerRadius);
    const topGeo = new THREE.ExtrudeGeometry(topShape, {
      depth: params.reliefDepth,
      bevelEnabled: false,
    }).toNonIndexed();
    topGeo.translate(0, 0, params.baseThickness);
    geometries.push(topGeo);
  }

  if (params.alignmentPins && !params.hinge) {
    const pinRadius = 1.5;
    const px = params.width / 2 - params.borderMargin / 2;
    const py = params.height / 2 - params.borderMargin / 2;

    const pinPositions = [
      [-px, -py],
      [px, -py],
      [-px, py],
      [px, py],
    ];

    for (const [x, y] of pinPositions) {
      const ringOuter = 2.5;
      const ringInner = pinRadius + 0.15;
      const ringShape = new THREE.Shape();
      ringShape.absarc(0, 0, ringOuter, 0, Math.PI * 2, false);
      const ringHole = new THREE.Path();
      ringHole.absarc(0, 0, ringInner, 0, Math.PI * 2, true);
      ringShape.holes.push(ringHole);

      const ringGeo = new THREE.ExtrudeGeometry(ringShape, {
        depth: 1,
        bevelEnabled: false,
      }).toNonIndexed();
      ringGeo.translate(x, y, totalHeight);
      geometries.push(ringGeo);
    }
  }

  if (params.hinge) {
    const gap = 4;
    const hingeX = -params.width / 2 - gap;
    const T = params.baseThickness + params.reliefDepth;
    const L = Math.max(10, Math.min(47, params.height - 10));
      const k_len = L / 3;
      const v_gap = 0.4;
      const cap_len = 2.0;

      const mid_y_start = k_len/2 - v_gap/2;
      const mid_len = k_len - v_gap;
      const midSolid = createSolidKnuckle('neg', mid_y_start, mid_len, T, gap, hingeX);

      const top_pin_y_start = L/2 - cap_len - v_gap;
      const top_pin_len = top_pin_y_start - mid_y_start;
      const topPin = createPin(top_pin_y_start, top_pin_len, T, hingeX);

      const bot_pin_y_start = mid_y_start - mid_len;
      const bot_pin_len = bot_pin_y_start - (-L/2 + cap_len + v_gap);
      const botPin = createPin(bot_pin_y_start, bot_pin_len, T, hingeX);

      geometries.push(midSolid, topPin, botPin);
  }

  const validGeometries = geometries.filter(g => g && g.attributes && g.attributes.position);
  let merged;
  if (validGeometries.length > 1) {
    merged = mergeGeometries(validGeometries);
  } else if (validGeometries.length === 1) {
    merged = validGeometries[0];
  } else {
    merged = new THREE.BufferGeometry();
  }
  
  const material = new THREE.MeshPhysicalMaterial({
    color: 0x4a9eff,
    metalness: 0.3,
    roughness: 0.4,
    clearcoat: 0.3,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(merged, material);
  mesh.name = 'negative_mold';
  return mesh;
}

export function generateStampMolds(rawShapes, userParams = {}) {
  const params = { ...DEFAULT_PARAMS, ...userParams };

  let shapes = fitShapes(rawShapes, params);

  if (params.mirror) {
    shapes = mirrorShapes(shapes);
  }

  const positive = generatePositiveMold(shapes, params);
  
  // ALWAYS mirror shapes for the negative mold so they physically match when closed face-to-face
  const negativeShapes = mirrorShapes(shapes);
  const negative = generateNegativeMold(negativeShapes, params);

  if (!params.hinge) {
    negative.position.x = params.width + 10;
  }

  return { positive, negative, params };
}

export function updateStampMolds(rawShapes, userParams, scene) {
  const oldPositive = scene.getObjectByName('positive_mold');
  const oldNegative = scene.getObjectByName('negative_mold');
  if (oldPositive) {
    oldPositive.geometry.dispose();
    oldPositive.material.dispose();
    scene.remove(oldPositive);
  }
  if (oldNegative) {
    oldNegative.geometry.dispose();
    oldNegative.material.dispose();
    scene.remove(oldNegative);
  }

  const { positive, negative } = generateStampMolds(rawShapes, userParams);
  scene.add(positive);
  scene.add(negative);

  return { positive, negative };
}

