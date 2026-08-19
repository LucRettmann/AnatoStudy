import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import type { PerspectiveCamera } from 'three'
import { useAtlas } from '../store/useAtlas'

/** Altura e largura aproximadas do corpo no modelo, com folga. */
const ALTURA = 1.9
const LARGURA = 1.0

/**
 * Ajusta a distância inicial da câmera para o corpo inteiro caber na tela,
 * seja num monitor largo ou num celular em pé. Só reenquadra enquanto o
 * usuário não escolheu nenhuma estrutura.
 */
export function Enquadramento() {
  const camera = useThree((e) => e.camera) as PerspectiveCamera
  const tamanho = useThree((e) => e.size)
  const foco = useAtlas((e) => e.foco)
  const jaEnquadrado = useRef(false)

  useEffect(() => {
    if (foco && jaEnquadrado.current) return
    const vFov = (camera.fov * Math.PI) / 180
    const distanciaVertical = ALTURA / 2 / Math.tan(vFov / 2)
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect)
    const distanciaHorizontal = LARGURA / 2 / Math.tan(hFov / 2)
    camera.position.set(0, 0, Math.max(distanciaVertical, distanciaHorizontal))
    camera.updateProjectionMatrix()
    jaEnquadrado.current = true
  }, [camera, tamanho.width, tamanho.height, foco])

  return null
}
