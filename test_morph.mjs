import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const geo1 = new THREE.BoxGeometry(1, 1, 1);
const geo2 = new THREE.BoxGeometry(1, 1, 1);
// What if we don't have morphAttributes?
geo1.morphAttributes = null;
try {
    mergeGeometries([geo1, geo2]);
} catch (e) {
    console.log("Error 1:");
    console.log(e.stack);
}

const g1 = new THREE.BufferGeometry();
const g2 = new THREE.BufferGeometry();
g1.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0,0,0]), 3));
g2.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0,0,0]), 3));
delete g1.morphAttributes;
try {
    mergeGeometries([g1, g2]);
} catch (e) {
    console.log("Error 2:");
    console.log(e.stack);
}

