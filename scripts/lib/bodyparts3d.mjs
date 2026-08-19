// Leitura da ontologia do BodyParts3D e do vocabulário TA2.
import { baixar, BP3D, TA2_URL } from './source.mjs'

function linhasTsv(texto) {
  return texto
    .split(/\r?\n/)
    .slice(1) // cabeçalho
    .filter((l) => l.trim().length > 0)
    .map((l) => l.split('\t').map((c) => c.replace(/^"|"$/g, '').trim()))
}

/**
 * Carrega:
 *  - nomes:      FMAID -> nome em inglês
 *  - partesDe:   pai   -> filhos (conventional_part_of)
 *  - primitivas: composto -> peças elementares (composite_parts)
 */
export async function carregarOntologia() {
  const [lista, partOf, compostos] = await Promise.all([
    baixar(`${BP3D}/parts_list_e.txt`, 'bp3d/parts_list_e.txt', { texto: true }),
    baixar(`${BP3D}/conventional_part_of.txt`, 'bp3d/conventional_part_of.txt', { texto: true }),
    baixar(`${BP3D}/composite_parts.txt`, 'bp3d/composite_parts.txt', { texto: true }),
  ])

  const nomes = new Map()
  for (const [id, en] of linhasTsv(lista)) if (id) nomes.set(id, en)

  const partesDe = new Map()
  for (const [pai, nomePai, filho, nomeFilho] of linhasTsv(partOf)) {
    if (!pai || !filho) continue
    if (!nomes.has(pai) && nomePai) nomes.set(pai, nomePai)
    if (!nomes.has(filho) && nomeFilho) nomes.set(filho, nomeFilho)
    if (!partesDe.has(pai)) partesDe.set(pai, new Set())
    partesDe.get(pai).add(filho)
  }

  const primitivas = new Map()
  for (const [composto, nomeComposto, primitiva, nomePrimitiva] of linhasTsv(compostos)) {
    if (!composto || !primitiva) continue
    if (!nomes.has(composto) && nomeComposto) nomes.set(composto, nomeComposto)
    if (!nomes.has(primitiva) && nomePrimitiva) nomes.set(primitiva, nomePrimitiva)
    if (!primitivas.has(composto)) primitivas.set(composto, new Set())
    primitivas.get(composto).add(primitiva)
  }

  return { nomes, partesDe, primitivas }
}

/**
 * Todos os descendentes de `raiz` (part_of + decomposição em primitivas),
 * incluindo a própria raiz. Protegido contra ciclos.
 */
export function descendentes({ partesDe, primitivas }, raiz, profundidadeMax = 12) {
  const vistos = new Set()
  const pilha = [[raiz, 0]]
  while (pilha.length) {
    const [id, d] = pilha.pop()
    if (vistos.has(id) || d > profundidadeMax) continue
    vistos.add(id)
    for (const filho of partesDe.get(id) ?? []) pilha.push([filho, d + 1])
    for (const p of primitivas.get(id) ?? []) pilha.push([p, d + 1])
  }
  return vistos
}

/** TA2: id;English;Latin;Français;Español;Portugues;Italiano;Parsi */
export async function carregarTa2() {
  const texto = await baixar(TA2_URL, 'z-anatomy/TA2.csv', { texto: true })
  const termos = []
  for (const linha of texto.split(/\r?\n/).slice(1)) {
    const limpa = linha.trim().replace(/^"|"$/g, '')
    if (!limpa) continue
    const [id, en, la, , , pt] = limpa.split(';')
    if (!en || !pt) continue
    termos.push({ ta2id: id, en: en.trim(), la: (la ?? '').trim(), pt: pt.trim() })
  }
  return termos
}
