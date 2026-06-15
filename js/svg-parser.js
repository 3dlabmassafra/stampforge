import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';

export async function parseSVGFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        resolve(parseSVGFromString(text));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsText(file);
  });
}

export function parseSVGFromString(svgString) {
  const loader = new SVGLoader();
  const svgData = loader.parse(svgString);
  const shapes = [];

  for (const path of svgData.paths) {
    const pathShapes = SVGLoader.createShapes(path);
    for (const shape of pathShapes) {
      shapes.push(shape);
    }
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');
  const svgElement = doc.querySelector('svg');
  
  let originalWidth = 100;
  let originalHeight = 100;

  if (svgElement) {
    const viewBox = svgElement.getAttribute('viewBox');
    if (viewBox) {
      const parts = viewBox.split(/[\s,]+/).map(parseFloat);
      if (parts.length === 4) {
        originalWidth = parts[2];
        originalHeight = parts[3];
      }
    } else {
      const w = parseFloat(svgElement.getAttribute('width'));
      const h = parseFloat(svgElement.getAttribute('height'));
      if (!isNaN(w) && !isNaN(h)) {
        originalWidth = w;
        originalHeight = h;
      }
    }
  }

  const flippedShapes = [];
  for (const shape of shapes) {
    const newShape = new THREE.Shape();
    const pts = shape.getPoints(64);
    if (pts.length > 0) {
      newShape.moveTo(pts[0].x, -pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        newShape.lineTo(pts[i].x, -pts[i].y);
      }
      newShape.closePath();
    }

    if (shape.holes) {
      for (const hole of shape.holes) {
        const holePts = hole.getPoints(64);
        if (holePts.length > 0) {
          const newHole = new THREE.Path();
          newHole.moveTo(holePts[0].x, -holePts[0].y);
          for (let i = 1; i < holePts.length; i++) {
            newHole.lineTo(holePts[i].x, -holePts[i].y);
          }
          newHole.closePath();
          newShape.holes.push(newHole);
        }
      }
    }
    flippedShapes.push(newShape);
  }

  return { shapes: flippedShapes, originalWidth, originalHeight };
}
