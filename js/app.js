import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { parseSVGFromFile } from './svg-parser.js';
import { textToShapes } from './text-tool.js';
import { generateStampMolds, updateStampMolds } from './stamp-generator.js';
import { exportSTL, exportBothSTL } from './stl-exporter.js';

let scene, camera, renderer, controls;
let currentShapes = [];
let positiveMesh, negativeMesh;

const state = {
  viewMode: 'both', // both, positive, negative
  params: {
    width: 60,
    height: 80,
    baseThickness: 3,
    reliefDepth: 1.5,
    borderMargin: 5,
    cornerRadius: 3,
    alignmentPins: true,
    mirror: false
  }
};

function init() {
  const canvas = document.getElementById('three-canvas');
  const container = document.getElementById('viewport');
  
  scene = new THREE.Scene();
  
  camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
  camera.position.set(0, -150, 150);
  camera.up.set(0, 0, 1);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight1.position.set(100, 100, 100);
  scene.add(dirLight1);

  const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
  dirLight2.position.set(-100, -100, 50);
  scene.add(dirLight2);

  const gridHelper = new THREE.GridHelper(200, 20);
  gridHelper.rotation.x = Math.PI / 2;
  gridHelper.material.opacity = 0.2;
  gridHelper.material.transparent = true;
  scene.add(gridHelper);

  window.addEventListener('resize', onWindowResize);
  
  setupUI();
  animate();
}

function onWindowResize() {
  const container = document.getElementById('viewport');
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

function updateMolds() {
  if (currentShapes.length === 0) return;
  
  document.getElementById('viewport-hint').style.display = 'none';

  const res = updateStampMolds(currentShapes, state.params, scene);
  positiveMesh = res.positive;
  negativeMesh = res.negative;
  
  applyViewMode();
}

function applyViewMode() {
  if (!positiveMesh || !negativeMesh) return;

  if (state.viewMode === 'both') {
    positiveMesh.visible = true;
    negativeMesh.visible = true;
    positiveMesh.position.set(-state.params.width/2 - 5, 0, 0);
    negativeMesh.position.set(state.params.width/2 + 5, 0, 0);
  } else if (state.viewMode === 'positive') {
    positiveMesh.visible = true;
    negativeMesh.visible = false;
    positiveMesh.position.set(0, 0, 0);
  } else if (state.viewMode === 'negative') {
    positiveMesh.visible = false;
    negativeMesh.visible = true;
    negativeMesh.position.set(0, 0, 0);
  }
}

function setupUI() {
  const uploadBtn = document.getElementById('upload-btn');
  const svgInput = document.getElementById('svg-input');
  const dropZone = document.getElementById('drop-zone');
  
  uploadBtn.addEventListener('click', () => svgInput.click());
  
  svgInput.addEventListener('change', async (e) => {
    if (e.target.files.length > 0) {
      await handleFileUpload(e.target.files[0]);
    }
  });

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });
  
  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
  });
  
  dropZone.addEventListener('drop', async (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    if (e.dataTransfer.files.length > 0) {
      await handleFileUpload(e.dataTransfer.files[0]);
    }
  });
  
  document.getElementById('remove-file-btn').addEventListener('click', () => {
    document.getElementById('file-info').style.display = 'none';
    svgInput.value = '';
    currentShapes = [];
    if (positiveMesh) scene.remove(positiveMesh);
    if (negativeMesh) scene.remove(negativeMesh);
    document.getElementById('viewport-hint').style.display = 'block';
  });

  const applyTextBtn = document.getElementById('apply-text-btn');
  applyTextBtn.addEventListener('click', async () => {
    const text = document.getElementById('text-input').value;
    const font = document.getElementById('font-select').value;
    if (!text.trim()) return;
    
    applyTextBtn.textContent = 'CARICAMENTO...';
    try {
      const shapes = await textToShapes(text, font);
      currentShapes = shapes;
      updateMolds();
      document.getElementById('file-info').style.display = 'none';
      svgInput.value = '';
    } catch (err) {
      alert('Errore generazione testo: ' + err.message);
    }
    applyTextBtn.textContent = 'APPLICA TESTO ALLO STAMPO';
  });

  const textInput = document.getElementById('text-input');
  textInput.addEventListener('input', () => {
    document.getElementById('char-count').textContent = textInput.value.length + '/40';
  });

  const params = ['width', 'height', 'base', 'depth', 'margin', 'radius'];
  params.forEach(param => {
    const el = document.getElementById('param-' + param);
    const valEl = document.getElementById('val-' + param);
    el.addEventListener('input', (e) => {
      valEl.textContent = e.target.value;
      let stateKey = param;
      if (param === 'base') stateKey = 'baseThickness';
      if (param === 'depth') stateKey = 'reliefDepth';
      if (param === 'margin') stateKey = 'borderMargin';
      if (param === 'radius') stateKey = 'cornerRadius';
      
      state.params[stateKey] = parseFloat(e.target.value);
      updateMolds();
    });
  });

  document.getElementById('toggle-pins').addEventListener('change', (e) => {
    state.params.alignmentPins = e.target.checked;
    updateMolds();
  });
  
  document.getElementById('toggle-mirror').addEventListener('change', (e) => {
    state.params.mirror = e.target.checked;
    updateMolds();
  });

  const viewBtns = document.querySelectorAll('.view-btn');
  viewBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      viewBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      state.viewMode = e.target.dataset.view;
      applyViewMode();
    });
  });

  document.getElementById('export-positive-btn').addEventListener('click', () => {
    if (positiveMesh) exportSTL(positiveMesh, 'stampforge_positivo');
  });
  
  document.getElementById('export-negative-btn').addEventListener('click', () => {
    if (negativeMesh) exportSTL(negativeMesh, 'stampforge_negativo');
  });
  
  document.getElementById('export-both-btn').addEventListener('click', () => {
    if (positiveMesh && negativeMesh) exportBothSTL(positiveMesh, negativeMesh);
  });
}

async function handleFileUpload(file) {
  if (!file.name.toLowerCase().endsWith('.svg')) {
    alert('Per favore carica un file SVG valido.');
    return;
  }
  
  document.getElementById('file-name').textContent = file.name;
  document.getElementById('file-info').style.display = 'flex';
  
  try {
    const { shapes } = await parseSVGFromFile(file);
    if (shapes.length === 0) {
      alert('Nessun path trovato nel file SVG.');
      return;
    }
    currentShapes = shapes;
    updateMolds();
  } catch (err) {
    alert('Errore lettura SVG: ' + err.message);
  }
}

init();
