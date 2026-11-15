import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useApp } from '../../state/store';
import { glowing } from '../../lib/materials';
import { pavilion } from '../../data/building';

// Two lighting states; everything is interpolated between them so switching
// reads as time passing rather than a cut.
const DAY = {
  sun: new THREE.Vector3(-70, 110, 60),
  sunColor: new THREE.Color('#FFF4E2'),
  sunIntensity: 3.0,
  hemiSky: new THREE.Color('#DDE6EE'),
  hemiGround: new THREE.Color('#9C8F78'),
  hemiIntensity: 1.25,
  skyTop: new THREE.Color('#A9C3D9'),
  skyHorizon: new THREE.Color('#EFE9DC'),
  fog: new THREE.Color('#E9E5DA'),
  exposure: 1.0,
};
const EVENING = {
  sun: new THREE.Vector3(-150, 22, -40),
  sunColor: new THREE.Color('#FF9A55'),
  sunIntensity: 0.9,
  hemiSky: new THREE.Color('#58658A'),
  hemiGround: new THREE.Color('#3A2B26'),
  hemiIntensity: 0.55,
  skyTop: new THREE.Color('#2A3352'),
  skyHorizon: new THREE.Color('#E39A6B'),
  fog: new THREE.Color('#5C5266'),
  exposure: 1.05,
};

const skyVert = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const skyFrag = /* glsl */ `
uniform vec3 top;
uniform vec3 horizon;
varying vec3 vDir;
void main() {
  float h = clamp(vDir.y, 0.0, 1.0);
  vec3 c = mix(horizon, top, pow(h, 0.55));
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`;

export function Environment() {
  const env = useApp((s) => s.env);
  const xr = useApp((s) => s.xrActive);
  const sun = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const warm = useRef<THREE.PointLight>(null);
  const plazaLight = useRef<THREE.PointLight>(null);
  const k = useRef(0); // 0 = day, 1 = evening
  const { scene, gl } = useThree();
  const sky = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { top: { value: DAY.skyTop.clone() }, horizon: { value: DAY.skyHorizon.clone() } },
        vertexShader: skyVert,
        fragmentShader: skyFrag,
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
      }),
    [],
  );
  const fog = useMemo(() => new THREE.Fog(DAY.fog.clone(), 260, 720), []);
  const tmp = useMemo(() => new THREE.Color(), []);

  useFrame((_, dt) => {
    k.current = THREE.MathUtils.damp(k.current, env === 'evening' ? 1 : 0, 2.2, dt);
    const t = k.current;
    if (sun.current) {
      sun.current.position.lerpVectors(DAY.sun, EVENING.sun, t);
      sun.current.color.lerpColors(DAY.sunColor, EVENING.sunColor, t);
      sun.current.intensity = THREE.MathUtils.lerp(DAY.sunIntensity, EVENING.sunIntensity, t);
    }
    if (hemi.current) {
      hemi.current.color.lerpColors(DAY.hemiSky, EVENING.hemiSky, t);
      hemi.current.groundColor.lerpColors(DAY.hemiGround, EVENING.hemiGround, t);
      hemi.current.intensity = THREE.MathUtils.lerp(DAY.hemiIntensity, EVENING.hemiIntensity, t);
    }
    if (warm.current) warm.current.intensity = 900 * t;
    if (plazaLight.current) plazaLight.current.intensity = 700 * t;
    sky.uniforms.top.value.lerpColors(DAY.skyTop, EVENING.skyTop, t);
    sky.uniforms.horizon.value.lerpColors(DAY.skyHorizon, EVENING.skyHorizon, t);
    fog.color.lerpColors(DAY.fog, EVENING.fog, t);
    gl.toneMappingExposure = THREE.MathUtils.lerp(DAY.exposure, EVENING.exposure, t);
    const glowK = Math.max(0, (t - 0.15) / 0.85);
    for (const m of glowing) m.emissiveIntensity = (m.userData.glow as number) * glowK;
    tmp.copy(fog.color);
  });

  // Fog and sky are removed in AR so the camera feed shows through.
  scene.fog = xr === 'ar' ? null : fog;

  return (
    <>
      {xr !== 'ar' && (
        <mesh material={sky} scale={900} renderOrder={-1} frustumCulled={false}>
          <sphereGeometry args={[1, 32, 16]} />
        </mesh>
      )}
      <hemisphereLight ref={hemi} args={[DAY.hemiSky, DAY.hemiGround, DAY.hemiIntensity]} />
      <directionalLight
        ref={sun}
        position={DAY.sun}
        intensity={DAY.sunIntensity}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
        shadow-camera-left={-95}
        shadow-camera-right={95}
        shadow-camera-top={95}
        shadow-camera-bottom={-95}
        shadow-camera-near={10}
        shadow-camera-far={420}
      />
      {/* warm uplight under the canopy and over the plaza in the evening */}
      <pointLight ref={warm} position={[pavilion.cx, pavilion.baseY + 3, pavilion.cz]} color="#FFC07A" intensity={0} distance={40} decay={2} />
      <pointLight ref={plazaLight} position={[24, 6, 20]} color="#FFC98A" intensity={0} distance={40} decay={2} />
    </>
  );
}
