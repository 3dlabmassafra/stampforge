// js/app.js
let scene, camera, renderer, controls;
let currentShapes = [];
let positiveMesh, negativeMesh;

function init() {
  const canvas = document.getElementById('canvas');
  if (!canvas) return;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a0a);

  camera = new THREE.PerspectiveCamera(45, (window.innerWidth * 0.65) / (window.innerHeight - 70), 0.1, 1000);
  camera.position.set(120, 90, 180);

  renderer = new THREE.WebGLRenderer({ 
    canvas: canvas, 
    antialias: true 
  });
  renderer.setSize(window.innerWidth * 0.65, window.innerHeight - 70);
  renderer.shadowMap.enabled = true;

  // Luci migliori
  scene.add(new THREE.AmbientLight(0xffffff, 0.8));
  const light1 = new THREE.DirectionalLight(0xffffff, 1.2);
  light1.position.set(80, 120, 100);
  scene.add(light1);

  const light2 = new THREE.DirectionalLight(0x66aaff, 0.6);
  light2.position.set(-80, 50, -100);
  scene.add(light2);

  // OrbitControls
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

// Crea uno stampo (positivo o negativo)
function createMoldMesh(shapes, isPositive) {
  const group = new THREE.Group();
  const p = currentParams;

  // Base
  const baseShape = createRoundedRectShape(p.width, p.height, p.cornerRadius);
  const baseGeo = new THREE.ExtrudeGeometry(baseShape, {
    depth: p.baseThickness,
    bevelEnabled: true,
    bevelThickness: 0.5,
    bevelSize: 0.4,
    bevelSegments: 3
  });

  const material = new THREE.MeshPhysicalMaterial({
    color: isPositive ? 0x00ff88 : 0x4488ff,
    metalness: 0.4,
    roughness: 0.3,
    clearcoat: 0.7,
    clearcoatRoughness: 0.2
  });

  const baseMesh = new THREE.Mesh(baseGeo, material);
  group.add(baseMesh);

  // Rilievo / Cavità
  if (shapes && shapes.length > 0) {
    const extrudeSettings = {
      depth: p.reliefDepth,
      bevelEnabled: true,
      bevelThickness: 0.35,
      bevelSize: 0.25,
      bevelSegments: 3
    };

    shapes.forEach(shape => {
      try {
        const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        const mesh = new THREE.Mesh(geo, material);
        mesh.position.z = p.baseThickness;
        group.add(mesh);
      } catch(e) { console.error(e); }
    });
  }

  return group;
}

function updateStampVisualization() {
  // Pulisci vecchi modelli
  if (positiveMesh) { scene.remove(positiveMesh); positiveMesh = null; }
  if (negativeMesh) { scene.remove(negativeMesh); negativeMesh = null; }

  if (currentShapes.length === 0) return;

  const { shapes } = window.generateStampMolds(currentShapes, currentParams);

  positiveMesh = createMoldMesh(shapes, true);
  negativeMesh = createMoldMesh(shapes, false);
  negativeMesh.position.x = currentParams.width + 30;

  scene.add(positiveMesh);
  scene.add(negativeMesh);
}

// ====================== INIT UI ======================
document.addEventListener('DOMContentLoaded', () => {
  init();

  // Aggiorna valori slider
  const sliders = ['width', 'height', 'relief'];
  sliders.forEach(id => {
    const slider = document.getElementById(id);
    const valEl = document.getElementById('val-' + id);
    if (slider) {
      slider.addEventListener('input', () => {
        currentParams[id === 'relief' ? 'reliefDepth' : id] = parseFloat(slider.value);
        if (valEl) valEl.textContent = slider.value;
        if (currentShapes.length > 0) updateStampVisualization();
      });
    }
  });

  // Mirror
  document.getElementById('mirror-toggle').addEventListener('change', e => {
    currentParams.mirror = e.target.checked;
    if (currentShapes.length > 0) updateStampVisualization();
  });

  // Genera
  document.getElementById('btn-generate').addEventListener('click', () => {
    const loader = document.getElementById('loader');
    loader.style.display = 'flex';
    setTimeout(() => {
      updateStampVisualization();
      loader.style.display = 'none';
    }, 80);
  });

  // Reset Camera
  document.getElementById('btn-reset-camera').addEventListener('click', () => {
    camera.position.set(120, 90, 180);
    controls.target.set(40, 0, 0);
    controls.update();
  });

  // Caricamento SVG
  document.getElementById('svg-upload').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(ev) {
      try {
        const loader = new THREE.SVGLoader();
        const svgData = loader.parse(ev.target.result);
        
        currentShapes = [];
        svgData.paths.forEach(path => {
          const shapes = THREE.SVGLoader.createShapes(path);
          if (shapes && shapes.length > 0) currentShapes.push(shapes[0]);
        });

        console.log("SVG caricato con", currentShapes.length, "shape");
        updateStampVisualization();
      } catch(err) {
        console.error("Errore parsing SVG:", err);
        alert("Errore nel caricamento SVG");
      }
    };
    reader.readAsText(file);
  });
});
