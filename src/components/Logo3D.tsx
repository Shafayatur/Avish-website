import { useRef, Suspense, useEffect } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { useTexture, OrbitControls, Environment, Center } from "@react-three/drei";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import * as THREE from "three";

const LogoModel = () => {
  const meshRef = useRef<THREE.Group>(null);
  const obj = useLoader(OBJLoader, "/3d logo avish/base.obj");

  const [diffuse, normal, roughness, metallic] = useTexture([
    "/3d logo avish/texture_diffuse.png",
    "/3d logo avish/texture_normal.png",
    "/3d logo avish/texture_roughness.png",
    "/3d logo avish/texture_metallic.png",
  ]);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.4;
    }
  });

  obj.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.material = new THREE.MeshStandardMaterial({
        map: diffuse,
        normalMap: normal,
        roughnessMap: roughness,
        metalnessMap: metallic,
        metalness: 1,
        roughness: 1,
      });
    }
  });

  return (
    <Center>
      <primitive ref={meshRef} object={obj} scale={1.5} />
    </Center>
  );
};

const Logo3D = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 40 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1.5} />
        <directionalLight position={[-5, -5, -5]} intensity={0.3} />
        <Suspense fallback={null}>
          <LogoModel />
          <Environment preset="studio" />
        </Suspense>
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 1.5}
        />
      </Canvas>
    </div>
  );
};

export default Logo3D;
