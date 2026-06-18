import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { generateStampMolds, updateStampMolds, DEFAULT_PARAMS } from './stamp-generator.js';

let scene, camera, renderer, controls;
let currentShapes = [];
let currentParams = { ...DEFAULT_PARAMS };

const loader = document.getElementById('loader');

function showLoader() {
  loader.style.display = 'flex';
}

function hideLoader() {
  loader.style.display = 'none';
}

function initThree() {
  const canvas = document.getElementById('canvas');
  
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111111);

  camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
  camera.position.set(80, 60, 120);

  renderer = new THREE.WebGLRenderer({ 
    canvas: canvas, 
    antialias: true,
    alpha: false 
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.shadowMap.enabled = true;

  // Luci migliorate (stile Sellomaker)
  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
  dirLight.position.set(50, 80, 60);
  dirLight.castShadow = true;
  scene.add(dirLight);

  const dirLight2 = new THREE.DirectionalLight(0x88ccff, 0.8);
  dirLight2.position.set(-60, 40, -50);
  scene.add(dirLight2);

  // Luce di riempimento
  const hemiLight = new THREE.HemisphereLight(0xaaaaaa, 0x444444, 0.5);
  scene.add(hemiLight);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.target.set(35, 5, 0);
  controls.update();

  window.addEventListener('resize', onResize);
  animate();
}

function onResize() {
  const canvas = document.getElementById('canvas');
  camera.aspect = canvas.clientWidth / canvas.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

function resetCamera() {
  camera.position.set(80, 60, 120);
  controls.target.set(35, 5, 0);
  controls.update();
}

// ====================== UI ======================
document.getElementById('btn-reset-camera').addEventListener('click', resetCamera);

document.getElementById('btn-generate').addEventListener('click', () => {
  if (currentShapes.length === 0) return;
  
  showLoader();
  
  setTimeout(() => {
    updateStampMolds(currentShapes, currentParams, scene);
    hideLoader();
  }, 50);
});

document.getElementById('mirror-toggle').addEventListener('change', (e) => {
  currentParams.mirror = e.target.checked;
  if (currentShapes.length > 0) {
    showLoader();
    setTimeout(() => {
      updateStampMolds(currentShapes, currentParams, scene);
      hideLoader();
    }, 30);
  }
});

// Gestione slider e input (esempio)
document.querySelectorAll('input[type="range"], input[type="number"]').forEach(input => {
  input.addEventListener('input', () => {
    currentParams[input.name] = parseFloat(input.value);
    // Aggiorna valore visualizzato se necessario
  });
});

// ====================== INIT ======================
window.addEventListener('load', () => {
  initThree();
  
  // Esempio: carica un SVG di default se vuoi
  // loadDefaultSVG();
});

export { currentShapes, currentParams };
