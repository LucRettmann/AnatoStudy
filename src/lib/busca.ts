import Fuse from 'fuse.js'
import { estruturas, pecasDoModelo } from '../data'
import type { Estrutura } from '../data/tipos'

/**
 * A busca cobre dois níveis: as fichas redigidas (ex.: "Costelas") e cada peça
 * individual do modelo, com o seu nome próprio na Terminologia Anatomica
 * (ex.: "5ª costela direita").
 */
export interface Resultado {
  chave: string
  nome: string
  nomeLatim?: string
  sistema: string
  estruturaId: string
  /** Definido quando o resultado é uma peça específica do modelo. */
  fmaId?: string
  ficha: boolean
}

const itens: Resultado[] = [
  ...estruturas.map((e: Estrutura) => ({
    chave: `ficha:${e.id}`,
    nome: e.nome,
    nomeLatim: e.nomeLatim,
    sistema: e.sistema,
    estruturaId: e.id,
    ficha: true,
    sinonimos: e.sinonimos,
    nomeIngles: e.nomeIngles,
  })),
  ...pecasDoModelo.map((p) => ({
    chave: `peca:${p.fmaId}`,
    nome: p.nome,
    nomeLatim: p.nomeLatim,
    sistema: p.sistema,
    estruturaId: p.estruturaId,
    fmaId: p.fmaId,
    ficha: false,
    sinonimos: undefined,
    nomeIngles: p.nomeIngles,
  })),
]

const fuse = new Fuse(itens, {
  keys: [
    { name: 'nome', weight: 0.55 },
    { name: 'nomeLatim', weight: 0.25 },
    { name: 'sinonimos', weight: 0.12 },
    { name: 'nomeIngles', weight: 0.08 },
  ],
  threshold: 0.34,
  ignoreLocation: true,
  minMatchCharLength: 2,
})

export function buscar(termo: string, limite = 40): Resultado[] {
  const limpo = termo.trim()
  if (limpo.length < 2) return []
  return fuse
    .search(limpo, { limit: limite })
    .map((r) => r.item)
    // As fichas redigidas aparecem antes das peças isoladas do modelo.
    .sort((a, b) => Number(b.ficha) - Number(a.ficha))
}
