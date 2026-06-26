// js/stl-exporter.js - Versione browser-compatibile (no ES modules)
// STLExporter vanilla, usa THREE dal namespace globale

(function(global) {

  // Mini STLExporter (binary) - non dipende da three/addons
  function STLExporter() {}

  STLExporter.prototype.parse = function(scene, options) {
    options = options || {};
    const binary = options.binary !== false;

    const objects = [];
    scene.traverse(function(obj) {
      if (obj.isMesh && obj.geometry) {
        objects.push(obj);
      }
    });

    if (binary) {
      // Conta triangoli totali
      let triangleCount = 0;
      objects.forEach(obj => {
        const geo = obj.geometry.index
          ? new THREE.BufferGeometry().copy(obj.geometry)
          : obj.geometry;
        triangleCount += (geo.attributes.position.count / 3) | 0;
        if (obj.geometry.index) triangleCount = (obj.geometry.index.count / 3) | 0;
      });

      const bufferLen = 80 + 4 + triangleCount * 50;
      const arrayBuffer = new ArrayBuffer(bufferLen);
      const output = new DataView(arrayBuffer);
      let offset = 80; // header
      output.setUint32(offset, triangleCount, true); offset += 4;

      const matrix = new THREE.Matrix4();
      const normalMatrix = new THREE.Matrix3();
      const vA = new THREE.Vector3();
      const vB = new THREE.Vector3();
      const vC = new THREE.Vector3();
      const cb = new THREE.Vector3();
      const ab = new THREE.Vector3();

      objects.forEach(obj => {
        const geo = obj.geometry;
        const posAttr = geo.attributes.position;
        const index = geo.index;

        matrix.copy(obj.matrixWorld);
        normalMatrix.getNormalMatrix(matrix);

        if (index !== null) {
          for (let i = 0; i < index.count; i += 3) {
            const a = index.getX(i);
            const b = index.getX(i + 1);
            const c = index.getX(i + 2);
            vA.fromBufferAttribute(posAttr, a).applyMatrix4(matrix);
            vB.fromBufferAttribute(posAttr, b).applyMatrix4(matrix);
            vC.fromBufferAttribute(posAttr, c).applyMatrix4(matrix);
            cb.subVectors(vC, vB);
            ab.subVectors(vA, vB);
            cb.cross(ab).normalize();
            output.setFloat32(offset, cb.x, true); offset += 4;
            output.setFloat32(offset, cb.y, true); offset += 4;
            output.setFloat32(offset, cb.z, true); offset += 4;
            output.setFloat32(offset, vA.x, true); offset += 4;
            output.setFloat32(offset, vA.y, true); offset += 4;
            output.setFloat32(offset, vA.z, true); offset += 4;
            output.setFloat32(offset, vB.x, true); offset += 4;
            output.setFloat32(offset, vB.y, true); offset += 4;
            output.setFloat32(offset, vB.z, true); offset += 4;
            output.setFloat32(offset, vC.x, true); offset += 4;
            output.setFloat32(offset, vC.y, true); offset += 4;
            output.setFloat32(offset, vC.z, true); offset += 4;
            output.setUint16(offset, 0, true); offset += 2;
          }
        } else {
          for (let i = 0; i < posAttr.count; i += 3) {
            vA.fromBufferAttribute(posAttr, i).applyMatrix4(matrix);
            vB.fromBufferAttribute(posAttr, i + 1).applyMatrix4(matrix);
            vC.fromBufferAttribute(posAttr, i + 2).applyMatrix4(matrix);
            cb.subVectors(vC, vB);
            ab.subVectors(vA, vB);
            cb.cross(ab).normalize();
            output.setFloat32(offset, cb.x, true); offset += 4;
            output.setFloat32(offset, cb.y, true); offset += 4;
            output.setFloat32(offset, cb.z, true); offset += 4;
            output.setFloat32(offset, vA.x, true); offset += 4;
            output.setFloat32(offset, vA.y, true); offset += 4;
            output.setFloat32(offset, vA.z, true); offset += 4;
            output.setFloat32(offset, vB.x, true); offset += 4;
            output.setFloat32(offset, vB.y, true); offset += 4;
            output.setFloat32(offset, vB.z, true); offset += 4;
            output.setFloat32(offset, vC.x, true); offset += 4;
            output.setFloat32(offset, vC.y, true); offset += 4;
            output.setFloat32(offset, vC.z, true); offset += 4;
            output.setUint16(offset, 0, true); offset += 2;
          }
        }
      });

      return arrayBuffer;
    }
  };

  function exportSTL(mesh, filename) {
    filename = filename || 'stamp';
    if (!mesh) return;
    const exporter = new STLExporter();
    const tmpScene = new THREE.Scene();
    // Aggiunge tutti i mesh figli aggiornando le world matrix
    mesh.updateMatrixWorld(true);
    mesh.traverse(obj => {
      if (obj.isMesh && obj.geometry) {
        const clone = obj.clone();
        clone.matrixWorld.copy(obj.matrixWorld);
        tmpScene.add(clone);
      }
    });
    tmpScene.updateMatrixWorld(true);
    const result = exporter.parse(tmpScene, { binary: true });
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

  function exportBothSTL(positiveMesh, negativeMesh) {
    if (positiveMesh) exportSTL(positiveMesh, 'stampforge_positivo');
    setTimeout(function() {
      if (negativeMesh) exportSTL(negativeMesh, 'stampforge_negativo');
    }, 500);
  }

  function exportSingleSTL(meshes, filename) {
    filename = filename || 'stampforge_print_in_place';
    if (!meshes || meshes.length === 0) return;
    const tmpScene = new THREE.Scene();
    meshes.forEach(function(mesh) {
      if (!mesh) return;
      mesh.updateMatrixWorld(true);
      mesh.traverse(function(obj) {
        if (obj.isMesh && obj.geometry) {
          const clone = obj.clone();
          clone.matrixWorld.copy(obj.matrixWorld);
          tmpScene.add(clone);
        }
      });
    });
    tmpScene.updateMatrixWorld(true);
    if (tmpScene.children.length === 0) return;
    const exporter = new STLExporter();
    const result = exporter.parse(tmpScene, { binary: true });
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

  global.StampExporter = { exportSTL, exportBothSTL, exportSingleSTL };

})(window);
