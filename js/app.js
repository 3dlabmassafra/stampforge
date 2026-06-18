import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { generateStampMolds, updateStampMolds, DEFAULT_PARAMS } from './stamp-generator.js';

let scene, camera, renderer, controls;
let currentShapes = [];
let currentParams = { ...DEFAULT_PARAMS };

const loaderEl = document.getElementById('loader');

function showLoader() {
  if (loaderEl) loaderEl.style.display = 'flex';
}

function hideLoader() {
  if (loaderEl) loaderEl.style.display = 'none';
}

function initThree() {
  const canvas = document.getElementById('canvas');
  if (!canvas) {
    console.error("Canvas non trovato!");
    return;
  }

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111111);

  camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
  camera.position.set(80, 60, 120);

  renderer = new THREE.WebGLRenderer({ 
    canvas: canvas, 
    antialias: true 
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);

  // Luci
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.1);
  dirLight.position.set(50, 80, 60);
  scene.add(dirLight);

  const dirLight2 = new THREE.DirectionalLight(0x88ccff, 0.7);
  dirLight2.position.set(-50, 40, -60);
  scene.add(dirLight2);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.1;
  controls.target.set(35, 5, 0);
  controls.update();

  window.addEventListener('resize', () => {
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  });

  animate();
}

function animate() {
  requestAnimationFrame(animate);
  if (controls) controls.update();
  if (renderer && scene && camera) renderer.render(scene, camera);
}

// ====================== Event Listeners ======================
document.addEventListener('DOMContentLoaded', () => {
  initThree();

  const generateBtn = document.getElementById('btn-generate');
  if (generateBtn) {
    generateBtn.addEventListener('click', () => {
      if (currentShapes.length === 0) return;
      showLoader();
      setTimeout(() => {
        updateStampMolds(currentShapes, currentParams, scene);
        hideLoader();
      }, 80);
    });
  }

  const mirrorToggle = document.getElementById('mirror-toggle');
  if (mirrorToggle) {
    mirrorToggle.addEventListener('change', (e) => {
      currentParams.mirror = e.target.checked;
      if (currentShapes.length > 0) {
        showLoader();
        setTimeout(() => {
          updateStampMolds(currentShapes, currentParams, scene);
          hideLoader();
        }, 50);
      }
    });
  }

  const resetBtn = document.getElementById('btn-reset-camera');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (camera && controls) {
        camera.position.set(80, 60, 120);
        controls.target.set(35, 5, 0);
        controls.update();
      }
    });
  }
});

export { currentShapes, currentParams };
