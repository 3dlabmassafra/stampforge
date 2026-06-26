// js/app.js - Versione browser-compatibile (no ES modules)
// Usa THREE, StampGenerator, StampExporter, TextTool dal namespace globale

let scene, camera, renderer, controls;
let currentShapes = [];
let positiveMesh, negativeMesh;

const currentParams = {
  width: 60,
  height: 80,
  baseThickness: 5,
  reliefDepth: 1.8,
  cornerRadius: 4,
  mirror: false,
  hinge: false
};

function init() {
  const canvas = document.getElementById('canvas');
  if (!canvas) return;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a0a);

  const viewerEl = document.querySelector('.viewer');
  const W = viewerEl ? viewerEl.clientWidth : window.innerWidth * 0.65;
  const H = viewerEl ? viewerEl.clientHeight : window.innerHeight - 70;

  camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 1000);
  camera.position.set(120, 90, 180);

  renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  renderer.setSize(W, H);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;

  scene.add(new THREE.AmbientLight(0xffffff, 0.8));
  const light1 = new THREE.DirectionalLight(0xffffff, 1.2);
  light1.position.set(80, 120, 100);
  scene.add(light1);
  const light2 = new THREE.DirectionalLight(0x66aaff, 0.6);
  light2.position.set(-80, 50, -100);
  scene.add(light2);

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.1;
  controls.target.set(40, 0, 0);
  controls.update();

  animate();
}

function animate() {
  requestAnimationFrame(animate);
  if (controls) controls.update();
  if (renderer && scene && camera) renderer.render(scene, camera);
}

function createMoldMesh(shapes, isPositive) {
  if (isPositive) {
    return StampGenerator.generatePositiveMold(shapes, currentParams);
  } else {
    return StampGenerator.generateNegativeMold(shapes, currentParams);
  }
}

function updateStampVisualization() {
  if (positiveMesh) { scene.remove(positiveMesh); positiveMesh = null; }
  if (negativeMesh) { scene.remove(negativeMesh); negativeMesh = null; }

  positiveMesh = createMoldMesh(currentShapes, true);
  negativeMesh = createMoldMesh(currentShapes, false);

  // Specchia il disegno per il negativo (lo stampo negativo deve essere lo specchio)
  if (currentParams.mirror) {
    negativeMesh.scale.x = -1;
    negativeMesh.position.x = currentParams.width * 2 + 20;
  }

  scene.add(positiveMesh);
  scene.add(negativeMesh);
}

function showLoader(show) {
  const loader = document.getElementById('loader');
  if (loader) loader.style.display = show ? 'flex' : 'none';
}

// ====================== INIT UI ======================
document.addEventListener('DOMContentLoaded', function() {
  init();

  // Populate font selector
  const fontSelect = document.getElementById('font-select');
  if (fontSelect && window.TextTool) {
    TextTool.AVAILABLE_FONTS.forEach(function(f) {
      const opt = document.createElement('option');
      opt.value = f.name;
      opt.textContent = f.name;
      fontSelect.appendChild(opt);
    });
  }

  // Sliders
  ['width', 'height', 'relief'].forEach(function(id) {
    const slider = document.getElementById(id);
    const valEl = document.getElementById('val-' + id);
    if (!slider) return;
    slider.addEventListener('input', function() {
      if (id === 'relief') currentParams.reliefDepth = parseFloat(slider.value);
      else currentParams[id] = parseFloat(slider.value);
      if (valEl) valEl.textContent = slider.value;
      if (currentShapes.length > 0) updateStampVisualization();
    });
  });

  // Mirror
  const mirrorToggle = document.getElementById('mirror-toggle');
  if (mirrorToggle) {
    mirrorToggle.addEventListener('change', function(e) {
      currentParams.mirror = e.target.checked;
      if (currentShapes.length > 0) updateStampVisualization();
    });
  }

  // Genera
  const btnGenerate = document.getElementById('btn-generate');
  if (btnGenerate) {
    btnGenerate.addEventListener('click', function() {
      showLoader(true);
      setTimeout(function() {
        updateStampVisualization();
        showLoader(false);
      }, 80);
    });
  }

  // Reset Camera
  const btnReset = document.getElementById('btn-reset-camera');
  if (btnReset) {
    btnReset.addEventListener('click', function() {
      camera.position.set(120, 90, 180);
      controls.target.set(40, 0, 0);
      controls.update();
    });
  }

  // Caricamento SVG
  const svgUpload = document.getElementById('svg-upload');
  if (svgUpload) {
    svgUpload.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function(ev) {
        try {
          const loader = new THREE.SVGLoader();
          const svgData = loader.parse(ev.target.result);
          currentShapes = [];
          svgData.paths.forEach(function(path) {
            const shapes = THREE.SVGLoader.createShapes(path);
            if (shapes && shapes.length > 0) currentShapes.push(shapes[0]);
          });
          console.log('SVG caricato con', currentShapes.length, 'shape');
          updateStampVisualization();
        } catch(err) {
          console.error('Errore parsing SVG:', err);
          alert('Errore nel caricamento SVG');
        }
      };
      reader.readAsText(file);
    });
  }

  // Applica Testo
  const applyTextBtn = document.getElementById('apply-text');
  if (applyTextBtn) {
    applyTextBtn.addEventListener('click', function() {
      const text = (document.getElementById('custom-text') || {}).value || '';
      const fontName = (document.getElementById('font-select') || {}).value || 'Anton';
      if (!text.trim()) { alert('Inserisci del testo prima'); return; }

      const errEl = document.getElementById('text-error');
      if (errEl) errEl.textContent = '';

      showLoader(true);
      TextTool.textToShapes(text, fontName, 60).then(function(shapes) {
        if (shapes.length === 0) { showLoader(false); alert('Nessuna forma generata dal testo'); return; }

        // Centra le shape sul piano dello stampo
        const box = new THREE.Box2();
        shapes.forEach(function(s) {
          s.getPoints(10).forEach(function(pt) { box.expandByPoint(pt); });
        });
        const cW = box.max.x - box.min.x;
        const cH = box.max.y - box.min.y;
        const scaleX = (currentParams.width * 0.8) / cW;
        const scaleY = (currentParams.height * 0.6) / cH;
        const scale = Math.min(scaleX, scaleY);
        const offX = (currentParams.width - cW * scale) / 2 - box.min.x * scale;
        const offY = (currentParams.height - cH * scale) / 2 - box.min.y * scale;

        currentShapes = shapes.map(function(s) {
          const pts = s.getPoints(32).map(function(p) {
            return new THREE.Vector2(p.x * scale + offX, p.y * scale + offY);
          });
          const ns = new THREE.Shape(pts);
          // Tratta le hole
          if (s.holes && s.holes.length > 0) {
            ns.holes = s.holes.map(function(h) {
              const hpts = h.getPoints(32).map(function(p) {
                return new THREE.Vector2(p.x * scale + offX, p.y * scale + offY);
              });
              return new THREE.Path(hpts);
            });
          }
          return ns;
        });

        updateStampVisualization();
        showLoader(false);
      }).catch(function(err) {
        showLoader(false);
        const errEl = document.getElementById('text-error');
        if (errEl) errEl.textContent = 'Errore: ' + err.message;
        else alert('Errore generazione testo: ' + err.message);
        console.error(err);
      });
    });
  }

  // Esporta Positivo
  const btnExportPos = document.getElementById('export-positive-btn');
  if (btnExportPos) {
    btnExportPos.addEventListener('click', function() {
      StampExporter.exportSTL(positiveMesh, 'stampforge_positivo');
    });
  }

  // Esporta Negativo
  const btnExportNeg = document.getElementById('export-negative-btn');
  if (btnExportNeg) {
    btnExportNeg.addEventListener('click', function() {
      StampExporter.exportSTL(negativeMesh, 'stampforge_negativo');
    });
  }

  // Esporta Stampo Unico (entrambi in un file)
  const btnExportBoth = document.getElementById('export-both-btn');
  if (btnExportBoth) {
    btnExportBoth.addEventListener('click', function() {
      StampExporter.exportSingleSTL([positiveMesh, negativeMesh], 'stampforge_print_in_place');
    });
  }

  // Resize responsive
  window.addEventListener('resize', function() {
    const viewerEl = document.querySelector('.viewer');
    const W = viewerEl ? viewerEl.clientWidth : window.innerWidth * 0.65;
    const H = viewerEl ? viewerEl.clientHeight : window.innerHeight - 70;
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    renderer.setSize(W, H);
  });
});
