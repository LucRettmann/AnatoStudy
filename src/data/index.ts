import manifesto from './generated/manifesto.json'
import termos from './generated/termos.json'
import sistemasBase from './sistemas.json'
import type { EntradaCurada, Estrutura, Sistema } from './tipos'

import ossos from './ossos.json'
import musculos from './musculos.json'
import nervoso from './nervoso.json'
import circulatorio from './circulatorio.json'
import respiratorio from './respiratorio.json'
import digestorio from './digestorio.json'
import urinario from './urinario.json'
import endocrino from './endocrino.json'
import linfatico from './linfatico.json'
import tegumentar from './tegumentar.json'
import sentidos from './sentidos.json'
import genital from './genital.json'

type PecaBruta = { sistema: string; nomeEn: string; triangulos: number; centro: number[]; tamanho: number[] }
type Termo = { pt: string | null; la: string | null; en: string; ta2id: string | null }

const pecas = manifesto.pecas as Record<string, PecaBruta>
const termosPorId = termos as Record<string, Termo>

/** Arquivos curados: é aqui que se acrescenta conteúdo novo ao atlas. */
export const ARQUIVOS_CURADOS: EntradaCurada[][] = [
  ossos,
  musculos,
  nervoso,
  circulatorio,
  respiratorio,
  digestorio,
  urinario,
  endocrino,
  linfatico,
  tegumentar,
  sentidos,
  genital,
] as EntradaCurada[][]

const curadas: EntradaCurada[] = ARQUIVOS_CURADOS.flat()

function caixaDe(fmaIds: string[]): { centro: [number, number, number]; extensao: number } {
  const min = [Infinity, Infinity, Infinity]
  const max = [-Infinity, -Infinity, -Infinity]
  for (const id of fmaIds) {
    const p = pecas[id]
    if (!p) continue
    for (let k = 0; k < 3; k++) {
      min[k] = Math.min(min[k], p.centro[k] - p.tamanho[k] / 2)
      max[k] = Math.max(max[k], p.centro[k] + p.tamanho[k] / 2)
    }
  }
  if (!Number.isFinite(min[0])) return { centro: [0, 0, 0], extensao: 0.3 }
  return {
    centro: [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2],
    extensao: Math.max(max[0] - min[0], max[1] - min[1], max[2] - min[2]),
  }
}

const reivindicadas = new Set<string>()
for (const c of curadas) for (const id of c.fmaIds) reivindicadas.add(id)

const curadasCompletas: Estrutura[] = curadas.map((c) => {
  const caixa = caixaDe(c.fmaIds)
  const primeiro = c.fmaIds.find((id) => termosPorId[id])
  return {
    ...c,
    nomeLatim: c.nomeLatim ?? (primeiro ? (termosPorId[primeiro].la ?? undefined) : undefined),
    nomeIngles: c.nomeIngles ?? (primeiro ? termosPorId[primeiro].en : undefined),
    gerada: false,
    ...caixa,
  }
})

const geradas: Estrutura[] = Object.entries(pecas)
  .filter(([id]) => !reivindicadas.has(id))
  .map(([id, peca]) => {
    const termo = termosPorId[id]
    const caixa = caixaDe([id])
    return {
      id,
      sistema: peca.sistema,
      nome: termo?.pt ?? peca.nomeEn,
      nomeLatim: termo?.la ?? undefined,
      nomeIngles: peca.nomeEn,
      fmaIds: [id],
      gerada: true,
      ...caixa,
    }
  })

export const estruturas: Estrutura[] = [...curadasCompletas, ...geradas].sort((a, b) =>
  a.nome.localeCompare(b.nome, 'pt-BR'),
)

export const estruturaPorId = new Map(estruturas.map((e) => [e.id, e]))

/** Peça do modelo 3D -> ficha correspondente. */
export const estruturaPorFma = new Map<string, Estrutura>()
for (const e of estruturas) for (const fma of e.fmaIds) estruturaPorFma.set(fma, e)

export const sistemas: Sistema[] = (sistemasBase as Omit<Sistema, 'arquivo' | 'totalPecas'>[])
  .filter((s) => s.id in manifesto.sistemas)
  .map((s) => {
    const info = (manifesto.sistemas as Record<string, { arquivo: string; pecas: number }>)[s.id]
    return { ...s, arquivo: info.arquivo, totalPecas: info.pecas }
  })

export const sistemaPorId = new Map(sistemas.map((s) => [s.id, s]))

export const estruturasPorSistema = new Map<string, Estrutura[]>(
  sistemas.map((s) => [s.id, estruturas.filter((e) => e.sistema === s.id)]),
)

/** Cada peça individual do modelo 3D, com o seu nome próprio na TA2. */
export interface Peca {
  fmaId: string
  sistema: string
  nome: string
  nomeLatim?: string
  nomeIngles: string
  estruturaId: string
  centro: [number, number, number]
  extensao: number
}

export const pecasDoModelo: Peca[] = Object.entries(pecas).map(([fmaId, peca]) => {
  const termo = termosPorId[fmaId]
  const caixa = caixaDe([fmaId])
  return {
    fmaId,
    sistema: peca.sistema,
    nome: termo?.pt ?? peca.nomeEn,
    nomeLatim: termo?.la ?? undefined,
    nomeIngles: peca.nomeEn,
    estruturaId: estruturaPorFma.get(fmaId)?.id ?? fmaId,
    ...caixa,
  }
})

export const pecaPorFma = new Map(pecasDoModelo.map((p) => [p.fmaId, p]))

export const creditos = manifesto.fonte
