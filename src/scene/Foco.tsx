import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import { useAtlas } from '../store/useAtlas'

interface ControlesOrbitais {
  target: Vector3
  update: () => void
}

const semAnimacao = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Aproxima suavemente a câmera da estrutura escolhida na busca ou na lista. */
export function Foco() {
  const foco = useAtlas((e) => e.foco)
  const camera = useThree((e) => e.camera)
  const controles = useThree((e) => e.controls) as unknown as ControlesOrbitais | null

  const destino = useRef<{ posicao: Vector3; alvo: Vector3 } | null>(null)

  useEffect(() => {
    if (!foco || !controles) return
    const alvo = new Vector3(...foco.centro)
    // Distância proporcional ao tamanho da peça, com um mínimo confortável.
    const distancia = Math.max(0.22, foco.extensao * 2.4)
    const direcao = camera.position.clone().sub(controles.target)
    if (direcao.lengthSq() < 1e-6) direcao.set(0, 0, 1)
    const posicao = alvo.clone().add(direcao.normalize().multiplyScalar(distancia))

    if (semAnimacao()) {
      camera.position.copy(posicao)
      controles.target.copy(alvo)
      controles.update()
      return
    }
    destino.current = { posicao, alvo }
  }, [foco, controles, camera])

  useFrame((_, delta) => {
    const atual = destino.current
    if (!atual || !controles) return
    const passo = Math.min(1, delta * 3.5)
    camera.position.lerp(atual.posicao, passo)
    controles.target.lerp(atual.alvo, passo)
    controles.update()
    if (camera.position.distanceTo(atual.posicao) < 0.004) destino.current = null
  })

  return null
}
