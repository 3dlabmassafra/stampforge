import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { DOMParser } from 'xmldom';
import { generateStampMolds, DEFAULT_PARAMS } from './js/stamp-generator.js';

global.DOMParser = DOMParser;

const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="40" stroke="green" stroke-width="4" fill="yellow" /></svg>`;

const loader = new SVGLoader();
const svgData = loader.parse(svgString);
const shapes = [];

for (const path of svgData.paths) {
  const pathShapes = SVGLoader.createShapes(path);
  for (const shape of pathShapes) {
    shapes.push(shape);
  }
}

const params = { ...DEFAULT_PARAMS };
function createRoundedRectShape(w, h, r) {
  const shape = new THREE.Shape();
  shape.moveTo(0,0);
  shape.lineTo(10,0);
  shape.lineTo(10,10);
  shape.lineTo(0,10);
  return shape;
}
const baseGeo = new THREE.ExtrudeGeometry(createRoundedRectShape(10,10,0), { depth: 1 });
console.log("baseGeo has index:", baseGeo.index !== null);

const shapeGeo = new THREE.ExtrudeGeometry(shapes[0], { depth: 1 });
console.log("shapeGeo has index:", shapeGeo.index !== null);

const pinGeo = new THREE.CylinderGeometry(1, 1, 1, 24);
console.log("pinGeo has index:", pinGeo.index !== null);
