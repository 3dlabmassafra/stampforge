import * as THREE from 'three';
import { STLExporter } from 'three/addons/exporters/STLExporter.js';

const exporter = new STLExporter();

export function exportSTL(mesh, filename = 'stamp') {
  if (!mesh) return;

  const scene = new THREE.Scene();
  const clone = mesh.clone();
  clone.position.set(0, 0, 0);
  clone.rotation.set(0, 0, 0);
  scene.add(clone);

  const result = exporter.parse(scene, { binary: true });
  
  const blob = new Blob([result], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename + '.stl';
  link.click();
  URL.revokeObjectURL(url);
}

export function exportBothSTL(positiveMesh, negativeMesh) {
  if (positiveMesh) exportSTL(positiveMesh, 'stampforge_positivo');
  setTimeout(() => {
    if (negativeMesh) exportSTL(negativeMesh, 'stampforge_negativo');
  }, 500);
}


export function exportSingleSTL(meshes, filename = 'stamp') {
  if (!meshes || meshes.length === 0) return;
  const scene = new THREE.Scene();
  for (const mesh of meshes) {
    if (mesh && mesh.geometry) {
      const clone = mesh.clone();
      scene.add(clone);
    }
  }
  
  if (scene.children.length === 0) return;

  const result = exporter.parse(scene, { binary: true });
  const blob = new Blob([result], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.style.display = 'none';
  link.href = url;
  link.download = filename + '.stl';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
