// js/app.js
let scene, camera, renderer, controls;
let currentShapes = [];
let positiveMesh, negativeMesh;

function init() {
  const canvas = document.getElementById('canvas');
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a0a);

  camera = new THREE.PerspectiveCamera(45, window.innerWidth * 0.65 / window.innerHeight, 0.1, 1000);
  camera.position.set(100, 80, 150);

  renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  renderer.setSize(window.innerWidth * 0.65, window.innerHeight - 70);
  renderer.shadowMap.enabled = true;

  // Luci
  scene.add(new THREE.AmbientLight(0xffffff, 0.7));
  const light = new THREE.DirectionalLight(0xffffff, 1.1);
  light.position.set(60, 100, 80);
  scene.add(light);

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.target.set(30, 0, 0);

  animate();
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

function createMoldMesh(shapes, isPositive) {
  const group = new THREE.Group();
  const params = currentParams;

  // Base
  const baseShape = createRoundedRectShape(params.width, params.height, params.cornerRadius);
  const baseGeo = new THREE.ExtrudeGeometry(baseShape, {
    depth: params.baseThickness,
    bevelEnabled: true,
    bevelThickness: 0.4,
    bevelSize: 0.3
  });
  const baseMat = new THREE.MeshPhysicalMaterial({
    color: isPositive ? 0x00ff88 : 0x4488ff,
    metalness: 0.3,
    roughness: 0.4,
    clearcoat: 0.6
  });
  const baseMesh = new THREE.Mesh(baseGeo, baseMat);
  group.add(baseMesh);

  // Rilievo o Cavità
  if (shapes && shapes.length > 0) {
    const extrudeSettings = {
      depth: params.reliefDepth,
      bevelEnabled: true,
      bevelThickness: 0.3,
      bevelSize: 0.2
    };

    shapes.forEach(shape => {
      const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      const mesh = new THREE.Mesh(geo, baseMat);
      mesh.position.z = params.baseThickness;
      group.add(mesh);
    });
  }

  return group;
}

function updateStampVisualization() {
  // Rimuovi vecchi modelli
  if (positiveMesh) scene.remove(positiveMesh);
  if (negativeMesh) scene.remove(negativeMesh);

  if (currentShapes.length === 0) return;

  const { shapes } = window.generateStampMolds(currentShapes, currentParams);

  positiveMesh = createMoldMesh(shapes, true);
  negativeMesh = createMoldMesh(shapes, false);
  negativeMesh.position.x = currentParams.width + 25;

  scene.add(positiveMesh);
  scene.add(negativeMesh);
}

// ====================== UI ======================
document.addEventListener('DOMContentLoaded', () => {
  init();

  // Slider updates
  ['width', 'height', 'relief'].forEach(id => {
    const slider = document.getElementById(id);
    const val = document.getElementById('val-' + id);
    if (slider && val) {
      slider.addEventListener('input', () => {
        currentParams[id === 'relief' ? 'reliefDepth' : id] = parseFloat(slider.value);
        val.textContent = slider.value;
      });
    }
  });

  // Mirror
  document.getElementById('mirror-toggle').addEventListener('change', (e) => {
    currentParams.mirror = e.target.checked;
    if (currentShapes.length > 0) updateStampVisualization();
  });

  // Generate
  document.getElementById('btn-generate').addEventListener('click', () => {
    const loader = document.getElementById('loader');
    loader.style.display = 'flex';
    setTimeout(() => {
      updateStampVisualization();
      loader.style.display = 'none';
    }, 100);
  });

  // Reset Camera
  document.getElementById('btn-reset-camera').addEventListener('click', () => {
    camera.position.set(100, 80, 150);
    controls.target.set(30, 0, 0);
    controls.update();
  });

  // SVG Upload
  document.getElementById('svg-upload').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
      const loader = new THREE.SVGLoader();
      const svgData = loader.parse(event.target.result);
      currentShapes = svgData.paths.map(path => {
        const shape = SVGLoader.createShapes(path)[0];
        return shape;
      });
      updateStampVisualization();
    };
    reader.readAsText(file);
  });
});
