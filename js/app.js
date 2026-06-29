import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { parseSVGFromFile, parseSVGFromString } from './svg-parser.js';
import { textToShapes } from './text-tool.js?v=6';
import { generateStampMolds, updateStampMolds } from './stamp-generator.js?v=6';
import { exportSTL, exportBothSTL, exportSingleSTL } from './stl-exporter.js';

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
    if (state.params.hinge) {
      const gap = 4;
      positiveMesh.position.set(-(state.params.width / 2 + gap), 0, 0);
      negativeMesh.position.set((state.params.width / 2 + gap), 0, 0);
    } else {
      positiveMesh.position.set(-state.params.width/2 - 5, 0, 0);
      negativeMesh.position.set(state.params.width/2 + 5, 0, 0);
    }
  } else if (state.viewMode === 'positive') {
    positiveMesh.visible = true;
    negativeMesh.visible = false;
    positiveMesh.position.set(0, 0, 0);
  } else if (state.viewMode === 'negative') {
    positiveMesh.visible = false;
    negativeMesh.visible = true;
    negativeMesh.position.set(0, 0, 0);
  }
  
  if (state.params.hinge) {
    document.getElementById('export-both-btn').textContent = "ESPORTA STAMPO UNICO";
    document.getElementById('export-positive-btn').style.display = "none";
    document.getElementById('export-negative-btn').style.display = "none";
  } else {
    document.getElementById('export-both-btn').textContent = "ESPORTA ENTRAMBI (STL)";
    document.getElementById('export-positive-btn').style.display = "inline-block";
    document.getElementById('export-negative-btn').style.display = "inline-block";
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
  
  const toggleHinge = document.getElementById('toggle-hinge');
  if (toggleHinge) {
    toggleHinge.checked = state.params.hinge;
    toggleHinge.addEventListener('change', (e) => {
      state.params.hinge = e.target.checked;
      updateMolds();
    });
  }

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
    if (positiveMesh && negativeMesh) {
      if (state.params.hinge) {
        exportSingleSTL([positiveMesh, negativeMesh], 'stampforge_print_in_place');
      } else {
        exportBothSTL(positiveMesh, negativeMesh);
      }
    }
  });

  document.getElementById('export-openscad-btn').addEventListener('click', () => {
    exportOpenSCAD();
  });
}

async function handleFileUpload(file) {
  const fileName = file.name.toLowerCase();
  const isSvg = fileName.endsWith('.svg');
  const isImg = fileName.endsWith('.png') || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.webp');

  if (!isSvg && !isImg) {
    alert('Carica un file valido (SVG, PNG, JPG, JPEG, WEBP).');
    return;
  }
  
  document.getElementById('file-name').textContent = file.name;
  document.getElementById('file-info').style.display = 'flex';
  
  const uploadBtn = document.getElementById('upload-btn');
  const originalText = uploadBtn.textContent;
  
  try {
    let shapes = [];
    if (isSvg) {
      const res = await parseSVGFromFile(file);
      shapes = res.shapes;
    } else {
      uploadBtn.textContent = 'TRACCIAMENTO...';
      const dataURL = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = err => reject(err);
        reader.readAsDataURL(file);
      });

      const svgString = await new Promise((resolve, reject) => {
        const options = {
          ltres: 1,
          qtres: 1,
          pathomit: 8,
          colorsampling: 1,
          numberofcolors: 2,
          mincolorratio: 0.1,
          colorquantcycles: 1,
          scale: 1
        };
        ImageTracer.imageToSVG(
          dataURL,
          svgstr => resolve(svgstr),
          options
        );
      });

      const res = parseSVGFromString(svgString);
      shapes = res.shapes;
    }

    if (shapes.length === 0) {
      alert('Nessun tracciato trovato nel file.');
      uploadBtn.textContent = originalText;
      return;
    }
    currentShapes = shapes;
    updateMolds();
  } catch (err) {
    alert('Errore caricamento: ' + err.message);
    console.error(err);
  } finally {
    uploadBtn.textContent = originalText;
  }
}

init();






function exportOpenSCAD() {
  const p = state.params;
  const scadContent = `//---------------------------------------------------------
// StampForge - Parametric Stamp Mold Generator
// Developed by 3DLabMassafra.it
// Downloaded from StampForge WebApp
//---------------------------------------------------------

/* [Stamp Dimensions] */
// Width of the stamp mold (mm)
width = ${p.width}; // [20:150]
// Height of the stamp mold (mm)
height = ${p.height}; // [20:150]
// Base plate thickness (mm)
base_thickness = ${p.baseThickness}; // [1.0:10.0]
// Relief/engraving depth (mm)
relief_depth = ${p.reliefDepth}; // [0.3:5.0]
// Corner radius (mm)
corner_radius = ${p.cornerRadius}; // [0.0:15.0]

/* [Features] */
// Add alignment pins for manual closing (disabled if hinge is on)
alignment_pins = ${p.alignmentPins};
// Enable Print-in-Place Hinge to connect the molds
hinge = ${p.hinge};
// Mirror the logo design on the positive mold
mirror_design = ${p.mirror};

/* [Logo Source] */
// Upload your SVG logo (must be named default.svg on MakerWorld)
logo_file = "default.svg"; // [image]

// Internal parameters
$fn = 64;
gap = 4.0; // distance between mold and hinge center

// Helper for rounded plates
module rounded_plate(w, h, r, d) {
    if (r > 0) {
        linear_extrude(height = d) {
            offset(r = r) {
                square([w - 2*r, h - 2*r], center = true);
            }
        }
    } else {
        linear_extrude(height = d) {
            square([w, h], center = true);
        }
    }
}

// Solid Knuckle helper
module solid_knuckle(length, r_outer, T, x_offset) {
    translate([x_offset, 0, T])
    rotate([-90, 0, 0])
    cylinder(h = length, r = r_outer, center = true);
}

// Hollow Knuckle helper
module hollow_knuckle(length, r_outer, r_inner, T, x_offset) {
    translate([x_offset, 0, T])
    rotate([-90, 0, 0])
    difference() {
        cylinder(h = length, r = r_outer, center = true);
        cylinder(h = length + 0.2, r = r_inner, center = true);
    }
}

// Hinge pin helper
module hinge_pin(length, r_pin, T, x_offset) {
    translate([x_offset, 0, T])
    rotate([-90, 0, 0])
    cylinder(h = length, r = r_pin, center = true);
}

// Alignment Pin (Positive)
module alignment_pin(x, y, h, r, T) {
    translate([x, y, T])
    cylinder(h = h, r = r);
}

// Alignment Hole (Negative Ring)
module alignment_ring(x, y, h, r_inner, r_outer, T) {
    translate([x, y, T])
    difference() {
        cylinder(h = h, r = r_outer);
        translate([0, 0, -0.1])
        cylinder(h = h + 0.2, r = r_inner);
    }
}

module positive_mold() {
    // Base
    rounded_plate(width, height, corner_radius, base_thickness);
    
    // Logo Extrusion
    translate([0, 0, base_thickness]) {
        mirror([mirror_design ? 1 : 0, 0, 0]) {
            linear_extrude(height = relief_depth) {
                import(file = logo_file, center = true);
            }
        }
    }
    
    // Alignment Pins
    if (alignment_pins && !hinge) {
        px = width/2 - 5;
        py = height/2 - 5;
        alignment_pin(-px, -py, relief_depth + 1, 1.5, base_thickness);
        alignment_pin(px, -py, relief_depth + 1, 1.5, base_thickness);
        alignment_pin(-px, py, relief_depth + 1, 1.5, base_thickness);
        alignment_pin(px, py, relief_depth + 1, 1.5, base_thickness);
    }
    
    // Hinge Knuckles (Positive gets outer knuckles with pin inside) on the left side
    if (hinge) {
        L = max(10, min(47, height - 10));
        k_len = L / 3;
        v_gap = 0.4;
        cap_len = 2.0;
        
        T = base_thickness + relief_depth;
        
        // Outer Knuckles (top and bottom) on the left side
        translate([0, L/2 - k_len/2, 0]) {
            hollow_knuckle(k_len - v_gap/2, 3.5, 2.2, T, -(width/2 + gap));
            hinge_pin(k_len - v_gap/2, 1.8, T, -(width/2 + gap));
        }
        translate([0, -L/2 + k_len/2, 0]) {
            hollow_knuckle(k_len - v_gap/2, 3.5, 2.2, T, -(width/2 + gap));
            hinge_pin(k_len - v_gap/2, 1.8, T, -(width/2 + gap));
        }
    }
}

module negative_mold() {
    difference() {
        // Base plate (base + relief depth)
        rounded_plate(width, height, corner_radius, base_thickness + relief_depth);
        
        // Subtract Logo for engraving
        translate([0, 0, base_thickness]) {
            mirror([1, 0, 0]) { // Negative is always mirrored relative to normal view
                linear_extrude(height = relief_depth + 0.1) {
                    import(file = logo_file, center = true);
                }
            }
        }
    }
    
    // Alignment rings for negative mold
    if (alignment_pins && !hinge) {
        px = width/2 - 5;
        py = height/2 - 5;
        alignment_ring(-px, -py, 1.0, 1.65, 2.5, base_thickness + relief_depth);
        alignment_ring(px, -py, 1.0, 1.65, 2.5, base_thickness + relief_depth);
        alignment_ring(-px, py, 1.0, 1.65, 2.5, base_thickness + relief_depth);
        alignment_ring(px, py, 1.0, 1.65, 2.5, base_thickness + relief_depth);
    }
    
    // Hinge Knuckles (Negative gets the middle solid knuckle) on the right side
    if (hinge) {
        L = max(10, min(47, height - 10));
        k_len = L / 3;
        v_gap = 0.4;
        
        T = base_thickness + relief_depth;
        
        // Middle Knuckle (hollow for pin)
        hollow_knuckle(k_len - v_gap, 3.5, 2.2, T, width/2 + gap);
    }
}

// Assemble the molds in print position
if (hinge) {
    // Centered around the hinge axes
    translate([-(width/2 + gap), 0, 0])
        positive_mold();
        
    translate([width/2 + gap, 0, 0])
        negative_mold();
} else {
    // Side by side
    translate([-width/2 - 5, 0, 0])
        positive_mold();
        
    translate([width/2 + 5, 0, 0])
        negative_mold();
}
`;

  const blob = new Blob([scadContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.style.display = 'none';
  link.href = url;
  link.download = 'stampforge_customizer.scad';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
