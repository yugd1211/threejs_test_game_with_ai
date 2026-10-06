import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { type Level, platformX } from './levels';
import { type GameState } from './physics';

const mat = (color: THREE.ColorRepresentation, extra: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...extra });
export class World {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(43, 1, 0.1, 180);
  root = new THREE.Group();
  avatar = new THREE.Group();
  islands: THREE.Group[] = [];
  crystals: THREE.Mesh[] = [];
  hazards: THREE.Group[] = [];
  clouds: THREE.Group[] = [];
  portal = new THREE.Group();
  shadow: THREE.Mesh;
  target = new THREE.Vector3();
  reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  private disposed = false;
  private resizeObserver: ResizeObserver;
  private frameTime = 0;
  private level: Level;
  private particles: THREE.Points;
  constructor(
    private container: HTMLElement,
    level: Level,
  ) {
    this.level = level;
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.domElement.setAttribute('aria-label', '3D 공중섬 파쿠르 게임 화면');
    this.renderer.domElement.setAttribute('role', 'img');
    container.prepend(this.renderer.domElement);
    this.scene.add(new THREE.HemisphereLight(0xf6ffff, 0x889ca0, 1.9));
    const sun = new THREE.DirectionalLight(0xfff5dc, 2.7);
    sun.position.set(-12, 28, 12);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, {
      left: -30,
      right: 30,
      top: 35,
      bottom: -35,
      near: 1,
      far: 85,
    });
    sun.shadow.bias = -0.001;
    sun.target.position.set(0, 0, -15);
    this.scene.add(sun, sun.target);
    this.scene.add(this.root);
    this.makeAvatar();
    this.scene.add(this.avatar);
    this.shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.49, 24),
      new THREE.MeshBasicMaterial({
        color: 0x345e55,
        transparent: true,
        opacity: 0.18,
        depthWrite: false,
      }),
    );
    this.shadow.rotation.x = -Math.PI / 2;
    this.scene.add(this.shadow);
    const positions = new Float32Array(90 * 3);
    for (let i = 0; i < 90; i++) {
      positions[i * 3] = Math.sin(i * 123.4) * 24;
      positions[i * 3 + 1] = Math.cos(i * 32.4) * 8 + 5;
      positions[i * 3 + 2] = -i * 0.55 + 8;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.particles = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({ color: 0xffffff, size: 0.085, transparent: true, opacity: 0.65 }),
    );
    this.scene.add(this.particles);
    this.setLevel(level);
    this.camera.position.set(19, 23, 22);
    this.target.set(0, 0, -14);
    this.camera.lookAt(this.target);
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();
  }
  box(w: number, h: number, d: number, material: THREE.Material, r = 0.08) {
    const mesh = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, r), material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }
  makeAvatar() {
    const body = mat(0xffa06c),
      white = mat(0xfff3dc),
      ink = mat(0x284c50),
      green = mat(0xc5f279);
    const torso = this.box(0.55, 0.56, 0.4, body, 0.11);
    torso.position.y = 0.69;
    this.avatar.add(torso);
    const helmet = this.box(0.65, 0.58, 0.57, white, 0.18);
    helmet.position.y = 1.2;
    this.avatar.add(helmet);
    const face = this.box(0.46, 0.22, 0.065, ink, 0.065);
    face.position.set(0, 1.19, -0.284);
    this.avatar.add(face);
    const glint = this.box(0.15, 0.04, 0.02, mat(0x9bdad8), 0.01);
    glint.position.set(-0.09, 1.23, -0.322);
    this.avatar.add(glint);
    for (const sign of [-1, 1]) {
      const leg = this.box(0.21, 0.33, 0.26, ink, 0.07);
      leg.position.set(sign * 0.17, 0.23, 0);
      leg.name = 'leg' + sign;
      this.avatar.add(leg);
      const foot = this.box(0.23, 0.12, 0.34, white, 0.04);
      foot.position.set(sign * 0.17, 0.07, -0.035);
      this.avatar.add(foot);
      const arm = this.box(0.19, 0.4, 0.22, body, 0.065);
      arm.position.set(sign * 0.38, 0.72, 0);
      arm.name = 'arm' + sign;
      this.avatar.add(arm);
    }
    const pack = this.box(0.35, 0.36, 0.18, green, 0.07);
    pack.position.set(0, 0.74, 0.28);
    this.avatar.add(pack);
    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.2, 6), ink);
    antenna.position.set(0.2, 1.57, 0);
    this.avatar.add(antenna);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), body);
    tip.position.set(0.2, 1.7, 0);
    this.avatar.add(tip);
  }
  tree(group: THREE.Group, x: number, z: number, size: number, color: number) {
    const tree = new THREE.Group();
    tree.position.set(x, 0, z);
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.11, size * 0.7, 6),
      mat(0x8b8367),
    );
    trunk.position.y = size * 0.35;
    trunk.castShadow = true;
    tree.add(trunk);
    for (let i = 0; i < 2; i++) {
      const crown = new THREE.Mesh(
        new THREE.IcosahedronGeometry(size * (0.45 - i * 0.08), 1),
        mat(color),
      );
      crown.scale.set(1, 1.25, 1);
      crown.position.set(i * 0.13, size * (0.8 + i * 0.28), 0);
      crown.castShadow = true;
      tree.add(crown);
    }
    group.add(tree);
  }
  disposeGroup(group: THREE.Group) {
    group.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((m) => m.dispose());
      }
    });
    group.clear();
  }
  setLevel(level: Level) {
    this.level = level;
    this.disposeGroup(this.root);
    this.islands = [];
    this.crystals = [];
    this.hazards = [];
    this.clouds = [];
    this.scene.background = new THREE.Color(level.sky);
    this.scene.fog = new THREE.Fog(level.sky, 55, 110);
    level.platforms.forEach((p, i) => {
      const group = new THREE.Group();
      group.position.set(p.x, p.y, p.z);
      const grass = mat(level.grass),
        cream = mat(0xf4edd9);
      const top = this.box(p.w, 0.32, p.d, grass, 0.13);
      top.position.y = -0.16;
      group.add(top);
      const soil = this.box(p.w - 0.16, 0.65, p.d - 0.16, cream, 0.14);
      soil.position.y = -0.61;
      group.add(soil);
      const stone = new THREE.Mesh(new THREE.CylinderGeometry(1, 0.48, 1.4, 4), mat(0xd9d9c8));
      stone.rotation.y = Math.PI / 4;
      stone.scale.set((p.w - 0.25) / Math.sqrt(2), 1, (p.d - 0.25) / Math.sqrt(2));
      stone.position.y = -1.58;
      stone.castShadow = true;
      group.add(stone);
      for (let j = 0; j < 3; j++) {
        const fleck = this.box(0.23, 0.12, 0.19, mat(0xf0e7ce), 0.015);
        fleck.position.set((j - 1) * p.w * 0.27, -0.51, p.d / 2 - 0.05);
        group.add(fleck);
      }
      if (i === 0 || i === 3 || i === 6 || i === 8) {
        this.tree(
          group,
          -p.w * 0.33,
          -p.d * 0.28,
          i === 0 ? 1.8 : 1.35,
          level.id === 'moonlight-run' ? 0x9b99bc : 0x7ca984,
        );
        if (i === 0 || i === 8) this.tree(group, p.w * 0.33, -p.d * 0.26, 1.25, level.grass);
      }
      for (let j = 0; j < 3; j++) {
        const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.25, 4), mat(0x719f79));
        tuft.position.set(p.w * 0.39 + j * 0.06, 0.1, p.d * 0.23 + j * 0.14);
        tuft.rotation.z = (j - 1) * 0.2;
        group.add(tuft);
      }
      if (i > 0 && i < level.platforms.length - 1) {
        const crystal = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.31),
          mat(0xffd56b, {
            metalness: 0.2,
            roughness: 0.25,
            emissive: 0x9f6215,
            emissiveIntensity: 0.18,
          }),
        );
        crystal.position.set(0, 1.1, 0);
        crystal.scale.y = 1.45;
        crystal.castShadow = true;
        group.add(crystal);
        this.crystals[i] = crystal;
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(0.45, 0.014, 6, 32),
          mat(0xffffcc, { transparent: true, opacity: 0.5 }),
        );
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 0.06;
        group.add(ring);
      }
      if (p.checkpoint) {
        const pole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.035, 0.035, 1.7, 6),
          mat(0xf5f3e3),
        );
        pole.position.set(p.w * 0.32, 0.85, -p.d * 0.23);
        group.add(pole);
        const flag = this.box(0.57, 0.34, 0.035, mat(0xf5866b), 0.012);
        flag.position.set(p.w * 0.32 + 0.27, 1.49, -p.d * 0.23);
        group.add(flag);
        const circle = new THREE.Mesh(
          new THREE.RingGeometry(0.68, 0.78, 32),
          new THREE.MeshBasicMaterial({ color: 0xf6ffd4, side: THREE.DoubleSide }),
        );
        circle.rotation.x = -Math.PI / 2;
        circle.position.y = 0.025;
        group.add(circle);
      }
      if (p.moving) {
        const band = this.box(
          p.w + 0.015,
          0.07,
          p.d + 0.015,
          mat(0xffd27b, { emissive: 0xffbb55, emissiveIntensity: 0.15 }),
          0.04,
        );
        band.position.y = -0.18;
        group.add(band);
      }
      if (p.hazard) {
        const spin = new THREE.Group();
        const bar = this.box(3.5, 0.23, 0.26, mat(0xea806d), 0.09);
        bar.position.y = 0.35;
        spin.add(bar);
        const pivot = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.6, 12), mat(0xffe6c8));
        pivot.position.y = 0.3;
        spin.add(pivot);
        group.add(spin);
        this.hazards[i] = spin;
      }
      this.root.add(group);
      this.islands.push(group);
    });
    const end = level.platforms.at(-1)!;
    this.portal = new THREE.Group();
    this.portal.position.set(end.x, end.y, end.z);
    const gateMat = mat(0xe5f7d5, { emissive: 0x8cbf84, emissiveIntensity: 0.15 });
    const gate = new THREE.Mesh(new THREE.TorusGeometry(1.13, 0.14, 8, 36), gateMat);
    gate.position.y = 1.35;
    gate.castShadow = true;
    this.portal.add(gate);
    const inner = new THREE.Mesh(
      new THREE.CircleGeometry(0.98, 40),
      new THREE.MeshBasicMaterial({
        color: 0xecffda,
        transparent: true,
        opacity: 0.38,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    inner.position.y = 1.35;
    this.portal.add(inner);
    const base = this.box(2.7, 0.15, 1.3, mat(0xecf3d6), 0.12);
    base.position.y = 0.075;
    this.portal.add(base);
    this.root.add(this.portal);
    for (let i = 0; i < 15; i++) {
      const cloud = new THREE.Group();
      const side = i % 2 ? -1 : 1;
      cloud.position.set(side * (8 + (i % 4) * 4), -4 - (i % 3) * 2, 12 - i * 4.9);
      const cloudMat = mat(0xf5f7ed, { transparent: true, opacity: 0.78 });
      for (let j = 0; j < 4; j++) {
        const mesh = new THREE.Mesh(new THREE.SphereGeometry(1.2 + (j % 2) * 0.6, 12, 8), cloudMat);
        mesh.position.set(j * 1.25, Math.sin(j * 2) * 0.35, (j % 2) * 0.4);
        mesh.scale.y = 0.52;
        cloud.add(mesh);
      }
      cloud.rotation.y = i * 0.8;
      this.root.add(cloud);
      this.clouds.push(cloud);
    }
    for (let i = 0; i < 9; i++) {
      const island = new THREE.Group();
      island.position.set((i % 2 ? -1 : 1) * (12 + (i % 3) * 5), -3 - (i % 3) * 3, -5 - i * 5.7);
      const s = 0.6 + (i % 3) * 0.4;
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(s * 1.5, 0.25, s * 2, 5),
        mat(0xd5dccb),
      );
      base.position.y = -s;
      island.add(base);
      const top = new THREE.Mesh(
        new THREE.CylinderGeometry(s * 1.55, s * 1.5, 0.15, 5),
        mat(level.grass),
      );
      island.add(top);
      this.tree(island, 0, 0, s * 1.1, level.grass);
      this.root.add(island);
    }
  }
  resize() {
    const { width, height } = this.container.getBoundingClientRect();
    if (width === 0 || height === 0) return;
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }
  quality(high: boolean) {
    this.renderer.setPixelRatio(high ? Math.min(devicePixelRatio, 2) : 1);
    this.renderer.shadowMap.enabled = high;
    this.resize();
  }
  update(state: GameState, dt: number, moving: boolean) {
    if (this.disposed) return;
    this.frameTime += dt;
    const t = this.frameTime,
      p = state.player;
    this.avatar.position.set(p.x, p.y, p.z);
    if (moving && state.phase === 'running') {
      this.avatar.getObjectByName('arm-1')!.rotation.x = Math.sin(t * 15) * 0.5;
      this.avatar.getObjectByName('arm1')!.rotation.x = -Math.sin(t * 15) * 0.5;
      this.avatar.getObjectByName('leg-1')!.rotation.x = -Math.sin(t * 15) * 0.3;
      this.avatar.getObjectByName('leg1')!.rotation.x = Math.sin(t * 15) * 0.3;
    } else
      this.avatar.children.forEach((c) => {
        if (c.name.startsWith('arm') || c.name.startsWith('leg')) c.rotation.x = 0;
      });
    this.avatar.visible = state.invulnerable > 0 ? Math.sin(t * 35) > -0.5 : true;
    this.islands.forEach((group, i) => {
      group.position.x = platformX(this.level.platforms[i], state.worldTime);
      const crystal = this.crystals[i];
      if (crystal) {
        crystal.visible = !state.collected.has(i);
        if (!this.reducedMotion) {
          crystal.rotation.y = t * 1.3;
          crystal.position.y = 1.1 + Math.sin(t * 2 + i) * 0.12;
        }
      }
      if (this.hazards[i]) this.hazards[i].rotation.y = -state.worldTime * 1.8;
    });
    if (!this.reducedMotion) {
      this.clouds.forEach((cloud, i) => {
        cloud.position.y = -4 - (i % 3) * 2 + Math.sin(t * 0.25 + i) * 0.25;
      });
      this.particles.rotation.y = Math.sin(t * 0.07) * 0.025;
    }
    const island = state.level.platforms[p.platform >= 0 ? p.platform : state.farthest];
    this.shadow.visible =
      p.y >= island.y &&
      Math.abs(p.z - island.z) < island.d / 2 &&
      Math.abs(p.x - platformX(island, state.worldTime)) < island.w / 2;
    this.shadow.position.set(p.x, island.y + 0.028, p.z);
    this.shadow.scale.setScalar(1 + Math.max(0, p.y - island.y) * 0.15);
    let cameraPosition: THREE.Vector3, look: THREE.Vector3;
    if (state.phase === 'ready') {
      const narrow = this.camera.aspect < 0.85;
      cameraPosition = new THREE.Vector3(narrow ? 24 : 19, narrow ? 31 : 23, narrow ? 32 : 22);
      look = new THREE.Vector3(0, 0, -14);
    } else {
      cameraPosition = new THREE.Vector3(p.x + 3.5, Math.max(p.y, 0) + 9.4, p.z + 12);
      look = new THREE.Vector3(p.x, Math.max(p.y, 0) + 0.2, p.z - 3);
    }
    const blend = this.reducedMotion ? 1 : 1 - Math.exp(-dt * 5);
    this.camera.position.lerp(cameraPosition, blend);
    this.target.lerp(look, blend);
    this.camera.lookAt(this.target);
    this.renderer.render(this.scene, this.camera);
  }
  dispose() {
    this.disposed = true;
    this.resizeObserver.disconnect();
    this.disposeGroup(this.root);
    this.disposeGroup(this.avatar);
    this.shadow.geometry.dispose();
    (this.shadow.material as THREE.Material).dispose();
    this.particles.geometry.dispose();
    (this.particles.material as THREE.Material).dispose();
    this.renderer.dispose();
  }
}
