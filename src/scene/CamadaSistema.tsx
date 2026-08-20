import { useEffect, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { Color, DoubleSide, Mesh, MeshStandardMaterial } from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import { estruturaPorFma } from '../data'
import { urlDoModelo } from '../lib/modelos'
import type { Sistema } from '../data/tipos'
import { useAtlas } from '../store/useAtlas'

interface Props {
  sistema: Sistema
}

/**
 * Uma camada = um arquivo .glb. Cada malha dentro dele é nomeada com o FMAID da
 * peça, o que permite ligar um clique no 3D à ficha correspondente.
 */
export function CamadaSistema({ sistema }: Props) {
  // `false` desativa o DRACOLoader do drei, que apontaria para uma CDN externa;
  // `true` mantém o decodificador meshopt, que vem embutido no bundle.
  const { scene } = useGLTF(urlDoModelo(sistema.arquivo), false, true)

  const selecionada = useAtlas((e) => e.selecionada)
  const hover = useAtlas((e) => e.hover)
  const destacados = useAtlas((e) => e.destacados)
  const opacidade = useAtlas((e) => e.opacidade[sistema.id] ?? 1)
  const selecionar = useAtlas((e) => e.selecionar)
  const definirHover = useAtlas((e) => e.definirHover)

  const malhas = useMemo(() => {
    const lista: Mesh[] = []
    scene.traverse((obj) => {
      if ((obj as Mesh).isMesh) lista.push(obj as Mesh)
    })
    return lista
  }, [scene])

  const materiais = useMemo(() => {
    const base = new MeshStandardMaterial({
      color: new Color(sistema.cor),
      roughness: 0.72,
      metalness: 0.02,
      side: DoubleSide,
    })
    const passando = base.clone()
    passando.emissive = new Color('#ffffff')
    passando.emissiveIntensity = 0.28

    const escolhida = base.clone()
    escolhida.color = new Color('#ffd45e')
    escolhida.emissive = new Color('#f59e0b')
    escolhida.emissiveIntensity = 0.45

    const achada = base.clone()
    achada.emissive = new Color('#38bdf8')
    achada.emissiveIntensity = 0.55

    return { base, passando, escolhida, achada }
  }, [sistema.cor])

  useEffect(() => {
    return () => {
      for (const m of Object.values(materiais)) m.dispose()
    }
  }, [materiais])

  // Transparência da camada inteira.
  useEffect(() => {
    for (const material of Object.values(materiais)) {
      material.transparent = opacidade < 1
      material.opacity = opacidade
      material.depthWrite = opacidade > 0.95
      material.needsUpdate = true
    }
  }, [materiais, opacidade])

  // Estado visual peça a peça.
  useEffect(() => {
    for (const malha of malhas) {
      const estrutura = estruturaPorFma.get(malha.name)
      if (estrutura && estrutura.id === selecionada) malha.material = materiais.escolhida
      else if (estrutura && estrutura.id === hover) malha.material = materiais.passando
      else if (destacados.has(malha.name)) malha.material = materiais.achada
      else malha.material = materiais.base
    }
  }, [malhas, materiais, selecionada, hover, destacados])

  const alvoDoEvento = (evento: ThreeEvent<PointerEvent | MouseEvent>) => {
    const malha = evento.object as Mesh
    const estrutura = estruturaPorFma.get(malha.name)
    return estrutura ? { estruturaId: estrutura.id, fmaId: malha.name } : null
  }

  return (
    <group
      name={sistema.id}
      onPointerOver={(evento) => {
        evento.stopPropagation()
        definirHover(alvoDoEvento(evento)?.estruturaId ?? null)
      }}
      onPointerMove={(evento) => {
        evento.stopPropagation()
        const id = alvoDoEvento(evento)?.estruturaId ?? null
        if (id !== useAtlas.getState().hover) definirHover(id)
      }}
      onPointerOut={(evento) => {
        evento.stopPropagation()
        definirHover(null)
      }}
      onClick={(evento) => {
        evento.stopPropagation()
        const alvo = alvoDoEvento(evento)
        if (alvo) selecionar(alvo.estruturaId, { peca: alvo.fmaId })
      }}
    >
      <primitive object={scene} />
    </group>
  )
}
