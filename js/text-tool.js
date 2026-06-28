import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { parseSVGFromString } from './svg-parser.js';

export const AVAILABLE_FONTS = [
  { name: 'Lobster', family: 'Lobster', url: '/fonts/Lobster.ttf' },
  { name: 'Pacifico', family: 'Pacifico', url: '/fonts/Pacifico.ttf' },
  { name: 'Permanent Marker', family: 'Permanent Marker', url: '/fonts/PermanentMarker.ttf' },
  { name: 'Righteous', family: 'Righteous', url: '/fonts/Righteous.ttf' },
  { name: 'Anton', family: 'Anton', url: '/fonts/Anton.ttf' }
];

const fontCache = new Map();
let opentypeModule = null;

async function getOpentype() {
  if (!opentypeModule) {
    opentypeModule = await import('https://cdn.jsdelivr.net/npm/opentype.js@1.3.4/dist/opentype.module.js');
  }
  return opentypeModule;
}

export async function loadFont(fontName) {
  if (fontCache.has(fontName)) return fontCache.get(fontName);
  
  const fontInfo = AVAILABLE_FONTS.find(f => f.name === fontName);
  if (!fontInfo) throw new Error(`Font non trovato: ${fontName}`);
  
  const opentype = await getOpentype();
  const font = await opentype.load(fontInfo.url);
  fontCache.set(fontName, font);
  return font;
}

export async function textToShapes(text, fontName, fontSize = 72) {
  if (!text) return [];
  const font = await loadFont(fontName);
  
  const path = font.getPath(text, 0, 0, fontSize);
  const pathData = path.toPathData(2);
  
  const svgString = `<svg xmlns="http://www.w3.org/2000/svg"><path d="${pathData}" fill="black"/></svg>`;
  
  const { shapes } = parseSVGFromString(svgString);
  return shapes;
}


