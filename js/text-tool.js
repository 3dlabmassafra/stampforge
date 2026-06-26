// js/text-tool.js - Versione browser-compatibile (no ES modules)
// Usa opentype.js via CDN dinamico e THREE dal namespace globale

(function(global) {

  const AVAILABLE_FONTS = [
    { name: 'Lobster',          url: 'fonts/Lobster.ttf' },
    { name: 'Pacifico',         url: 'fonts/Pacifico.ttf' },
    { name: 'Permanent Marker', url: 'fonts/PermanentMarker.ttf' },
    { name: 'Righteous',        url: 'fonts/Righteous.ttf' },
    { name: 'Anton',            url: 'fonts/Anton.ttf' }
  ];

  const fontCache = {};
  let opentypeLib = null;

  function loadOpentype() {
    return new Promise(function(resolve, reject) {
      if (opentypeLib) { resolve(opentypeLib); return; }
      // Controlla se gia' presente globalmente
      if (window.opentype) { opentypeLib = window.opentype; resolve(opentypeLib); return; }
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/opentype.js@1.3.4/dist/opentype.min.js';
      script.onload = function() { opentypeLib = window.opentype; resolve(opentypeLib); };
      script.onerror = function() { reject(new Error('Impossibile caricare opentype.js')); };
      document.head.appendChild(script);
    });
  }

  function loadFont(fontName) {
    if (fontCache[fontName]) return Promise.resolve(fontCache[fontName]);
    const info = AVAILABLE_FONTS.find(function(f) { return f.name === fontName; });
    if (!info) return Promise.reject(new Error('Font non trovato: ' + fontName));

    return loadOpentype().then(function(opentype) {
      return new Promise(function(resolve, reject) {
        opentype.load(info.url, function(err, font) {
          if (err) { reject(err); return; }
          fontCache[fontName] = font;
          resolve(font);
        });
      });
    });
  }

  function textToShapes(text, fontName, fontSize) {
    fontSize = fontSize || 72;
    if (!text) return Promise.resolve([]);

    return loadFont(fontName).then(function(font) {
      const path = font.getPath(text, 0, 0, fontSize);
      const pathData = path.toPathData(2);

      // Parsa il path SVG usando THREE.SVGLoader
      const svgString = '<svg xmlns="http://www.w3.org/2000/svg"><path d="' + pathData + '" fill="black"/></svg>';
      const loader = new THREE.SVGLoader();
      const svgData = loader.parse(svgString);

      const shapes = [];
      svgData.paths.forEach(function(p) {
        const s = THREE.SVGLoader.createShapes(p);
        s.forEach(function(sh) { shapes.push(sh); });
      });
      return shapes;
    });
  }

  global.TextTool = {
    AVAILABLE_FONTS: AVAILABLE_FONTS,
    loadFont: loadFont,
    textToShapes: textToShapes
  };

})(window);
