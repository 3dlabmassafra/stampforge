import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { DOMParser } from 'xmldom';
import { generateStampMolds } from './js/stamp-generator.js';

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

console.log("Shapes count:", shapes.length);
try {
  generateStampMolds(shapes);
  console.log("Success!");
} catch (e) {
  console.log("ERROR!");
  console.log(e.stack);
}
