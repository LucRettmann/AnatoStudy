import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Html, OrbitControls, useProgress } from '@react-three/drei'
import { sistemaPorId } from '../data'
import { useShallow } from 'zustand/react/shallow'
import { sistemasVisiveis, useAtlas } from '../store/useAtlas'
import { CamadaSistema } from './CamadaSistema'
import { Foco } from './Foco'
import { Enquadramento } from './Enquadramento'

function Carregando() {
  const { progress } = useProgress()
  return (
    <Html center>
      <div className="rounded-lg bg-slate-900/85 px-4 py-2 text-sm text-slate-200 ring-1 ring-slate-700">
        Carregando modelo… {Math.round(progress)}%
      </div>
    </Html>
  )
}

export function Cena() {
  // useShallow: o seletor devolve um array novo a cada chamada.
  const visiveis = useAtlas(useShallow(sistemasVisiveis))
  const selecionar = useAtlas((e) => e.selecionar)
  const definirHover = useAtlas((e) => e.definirHover)

  return (
    <Canvas
      camera={{ position: [0, 0, 3], fov: 38, near: 0.01, far: 60 }}
      dpr={[1, 2]}
      gl={{ antialias: true }}
      onPointerMissed={() => {
        selecionar(null)
        definirHover(null)
      }}
    >
      <color attach="background" args={['#0b1220']} />
      <hemisphereLight args={['#cbd5f5', '#1e293b', 1.1]} />
      <directionalLight position={[2.5, 3.5, 3]} intensity={2.1} />
      <directionalLight position={[-3, 1.5, -2.5]} intensity={0.75} />
      <directionalLight position={[0, -2.5, 1.5]} intensity={0.35} />

      <Suspense fallback={<Carregando />}>
        {visiveis.map((id) => {
          const sistema = sistemaPorId.get(id)
          return sistema ? <CamadaSistema key={id} sistema={sistema} /> : null
        })}
      </Suspense>

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={0.15}
        maxDistance={8}
        target={[0, 0, 0]}
      />
      <Enquadramento />
      <Foco />
    </Canvas>
  )
}
