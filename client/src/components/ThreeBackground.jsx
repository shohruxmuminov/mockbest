import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sphere, Stars } from '@react-three/drei';

function FloatingObjects() {
  const group = useRef();
  
  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y = state.clock.getElapsedTime() * 0.05;
    }
  });

  return (
    <group ref={group}>
      {/* Background Objects */}
      <Float speed={2} rotationIntensity={1} floatIntensity={2}>
        <Sphere args={[1, 32, 32]} position={[-4, 2, -5]}>
          <meshStandardMaterial color="#E63946" opacity={0.15} transparent wireframe />
        </Sphere>
      </Float>

      <Float speed={1.5} rotationIntensity={1.5} floatIntensity={2}>
        <Sphere args={[1.5, 32, 32]} position={[5, -2, -8]}>
          <meshStandardMaterial color="#1D3557" opacity={0.1} transparent wireframe />
        </Sphere>
      </Float>

      <Float speed={2.5} rotationIntensity={0.5} floatIntensity={1.5}>
        <Sphere args={[0.8, 32, 32]} position={[0, 4, -10]}>
          <meshStandardMaterial color="#E63946" opacity={0.1} transparent />
        </Sphere>
      </Float>

      {/* Subtle particles */}
      <Stars radius={50} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />
    </group>
  );
}

export default function ThreeBackground() {
  return (
    <div className="canvas-container">
      <Canvas camera={{ position: [0, 0, 10], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <FloatingObjects />
      </Canvas>
    </div>
  );
}
