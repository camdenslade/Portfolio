import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  Color,
  Group,
  Mesh,
  MeshStandardMaterial,
  Scene,
  BoxGeometry,
  CylinderGeometry,
} from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

const OUT_DIR = path.join(process.cwd(), 'public', 'models');
const OUT_FILE = path.join(OUT_DIR, 'computer-placeholder.gltf');

if (typeof globalThis.FileReader === 'undefined') {
  class NodeFileReader {
    constructor() {
      this.result = null;
      this.onloadend = null;
      this.onerror = null;
    }

    readAsArrayBuffer(blob) {
      blob.arrayBuffer().then((arrayBuffer) => {
        this.result = arrayBuffer;
        if (this.onloadend) this.onloadend();
      }).catch((error) => {
        if (this.onerror) this.onerror(error);
      });
    }

    readAsDataURL(blob) {
      blob.arrayBuffer().then((arrayBuffer) => {
        const mime = blob.type || 'application/octet-stream';
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        this.result = `data:${mime};base64,${base64}`;
        if (this.onloadend) this.onloadend();
      }).catch((error) => {
        if (this.onerror) this.onerror(error);
      });
    }
  }

  globalThis.FileReader = NodeFileReader;
}

function makeMesh(geometry, material, position = [0, 0, 0], rotation = [0, 0, 0], name) {
  const mesh = new Mesh(geometry, material);
  mesh.position.set(position[0], position[1], position[2]);
  mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
  if (name) mesh.name = name;
  return mesh;
}

function addKeyboard(parent, material) {
  const rows = 5;
  const cols = 12;
  const keyWidth = 0.082;
  const keyDepth = 0.074;
  const gapX = 0.011;
  const gapZ = 0.011;
  const startX = -((cols - 1) * (keyWidth + gapX)) / 2;
  const startZ = -0.18;

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      let width = keyWidth;
      if (row === 4 && col === 5) width = keyWidth * 2;
      if ((row === 4 && col === 0) || (row === 4 && col === 11)) width = keyWidth * 1.35;
      const x = startX + col * (keyWidth + gapX);
      const z = startZ + row * (keyDepth + gapZ);
      parent.add(makeMesh(new BoxGeometry(width, 0.007, keyDepth), material, [x, 0.052, z]));
    }
  }
}

async function generate() {
  const scene = new Scene();
  scene.background = new Color('#ffffff');

  const aluminum = new MeshStandardMaterial({ color: '#c8ccd2', roughness: 0.35, metalness: 0.72 });
  const aluminumDark = new MeshStandardMaterial({ color: '#9aa1ab', roughness: 0.4, metalness: 0.64 });
  const keyMaterial = new MeshStandardMaterial({ color: '#1f2937', roughness: 0.7, metalness: 0.1 });
  const bezelMaterial = new MeshStandardMaterial({ color: '#20242b', roughness: 0.65, metalness: 0.12 });
  const screenMaterial = new MeshStandardMaterial({ color: '#121417', roughness: 0.55, metalness: 0.02 });

  const laptop = new Group();
  laptop.name = 'macbook_style';

  // Bottom case with minimal layers.
  laptop.add(
    makeMesh(new BoxGeometry(2.2, 0.018, 1.42), aluminum, [0, 0.009, 0.02]),
    makeMesh(new BoxGeometry(2.12, 0.016, 1.26), aluminum, [0, 0.023, -0.06])
  );

  // Keyboard well, keys, and centered large trackpad.
  laptop.add(
    makeMesh(new BoxGeometry(1.62, 0.003, 0.7), aluminumDark, [0, 0.045, -0.07]),
    makeMesh(new BoxGeometry(0.84, 0.0025, 0.52), aluminumDark, [0, 0.046, 0.25])
  );
  addKeyboard(laptop, keyMaterial);

  // Hinge assembly aligned to back edge of the base.
  laptop.add(
    // Rotate around Z so hinge spans left-right instead of front-back.
    makeMesh(new CylinderGeometry(0.016, 0.016, 1.55, 24), aluminumDark, [0, 0.06, -0.63], [0, 0, Math.PI / 2]),
    makeMesh(new BoxGeometry(0.1, 0.026, 0.05), aluminumDark, [-0.63, 0.06, -0.62]),
    makeMesh(new BoxGeometry(0.1, 0.026, 0.05), aluminumDark, [0.63, 0.06, -0.62])
  );

  const displayGroup = new Group();
  // Place pivot at bottom-center of the lid so it rotates from the hinge line.
  displayGroup.position.set(0, 0.06, -0.62);
  displayGroup.rotation.set(-0.1, 0, 0);

  displayGroup.add(
    makeMesh(new BoxGeometry(1.86, 1.16, 0.026), aluminum, [0, 0.56, -0.01]),
    makeMesh(new BoxGeometry(1.76, 1.06, 0.012), bezelMaterial, [0, 0.56, 0.002]),
    makeMesh(new BoxGeometry(1.58, 0.9, 0.008), screenMaterial, [0, 0.56, 0.008], [0, 0, 0], 'screen'),
    makeMesh(new CylinderGeometry(0.008, 0.008, 0.004, 16), bezelMaterial, [0, 1.05, 0.008], [Math.PI / 2, 0, 0], 'camera_dot')
  );

  laptop.add(displayGroup);
  scene.add(laptop);

  const exporter = new GLTFExporter();

  const gltfJson = await new Promise((resolve, reject) => {
    exporter.parse(
      scene,
      (result) => {
        if (result instanceof ArrayBuffer) {
          reject(new Error('Expected JSON glTF output, received binary.'));
          return;
        }
        resolve(result);
      },
      (error) => reject(error),
      { binary: false, onlyVisible: true, trs: false }
    );
  });

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(OUT_FILE, JSON.stringify(gltfJson));
  console.log(`Wrote ${OUT_FILE}`);
}

generate().catch((error) => {
  console.error(error);
  process.exit(1);
});
