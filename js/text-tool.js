import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { parseSVGFromString } from './svg-parser.js';

export const AVAILABLE_FONTS = [
  { name: 'Lobster', family: 'Lobster', url: 'https://fonts.gstatic.com/s/lobster/v30/neILzCirqoNuEjz2lCkh.ttf' },
  { name: 'Pacifico', family: 'Pacifico', url: 'https://fonts.gstatic.com/s/pacifico/v22/FwZY7-Qmy14u9lezJ96A.ttf' },
  { name: 'Permanent Marker', family: 'Permanent Marker', url: 'https://fonts.gstatic.com/s/permanentmarker/v16/Fh4uPib9Iyv2ucM6pGQMWimMp004HaqI.ttf' },
  { name: 'Playfair Display', family: 'Playfair Display', url: 'https://fonts.gstatic.com/s/playfairdisplay/v37/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvXDXbtM.ttf' },
  { name: 'Roboto', family: 'Roboto', url: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlfBBc4.ttf' },
  { name: 'Righteous', family: 'Righteous', url: 'https://fonts.gstatic.com/s/righteous/v17/1cXxaUPXBpj2rGoU7C9mj3uE.ttf' },
  { name: 'Abril Fatface', family: 'Abril Fatface', url: 'https://fonts.gstatic.com/s/abrilfatface/v23/zOL64pLDlL1D99S8HAFadkA0rciL.ttf' },
  { name: 'Fredoka One', family: 'Fredoka One', url: 'https://fonts.gstatic.com/s/fredokaone/v14/k3kUo8kEI-tA1RRcTZGmTmHB.ttf' },
  { name: 'Bebas Neue', family: 'Bebas Neue', url: 'https://fonts.gstatic.com/s/bebasneue/v14/JTUSjIg69CK48gW7PXooxW4.ttf' },
  { name: 'Anton', family: 'Anton', url: 'https://fonts.gstatic.com/s/anton/v25/1Ptgg87GJOGpg078.ttf' },
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
