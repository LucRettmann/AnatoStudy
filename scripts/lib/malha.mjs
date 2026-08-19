// Leitura de STL binário, soldagem de vértices, simplificação e normais.
import { MeshoptSimplifier } from 'meshoptimizer'

/** STL binário: 80 B de cabeçalho, uint32 com o nº de triângulos, 50 B por triângulo. */
export function lerStlBinario(buffer) {
  const dv = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength)
  const nTri = dv.getUint32(80, true)
  const esperado = 84 + nTri * 50
  if (buffer.byteLength < esperado) {
    throw new Error(`STL truncado: ${buffer.byteLength} B para ${nTri} triângulos`)
  }
  const posicoes = new Float32Array(nTri * 9)
  let o = 84
  for (let t = 0; t < nTri; t++) {
    o += 12 // normal por face — recalculamos depois da simplificação
    for (let v = 0; v < 9; v++) {
      posicoes[t * 9 + v] = dv.getFloat32(o, true)
      o += 4
    }
    o += 2 // attribute byte count
  }
  return { posicoes, nTri }
}

/** Índices sequenciais colapsados sobre vértices de mesma posição. */
export function soldar(posicoes) {
  const n = posicoes.length / 3
  const remap = MeshoptSimplifier.generatePositionRemap(posicoes, 3)
  const indices = new Uint32Array(n)
  for (let i = 0; i < n; i++) indices[i] = remap[i]
  return indices
}

/** Reindexa mantendo apenas os vértices realmente referenciados. */
export function compactar(indices, posicoes) {
  const mapa = new Int32Array(posicoes.length / 3).fill(-1)
  const novosIndices = new Uint32Array(indices.length)
  let usados = 0
  for (let i = 0; i < indices.length; i++) {
    const v = indices[i]
    if (mapa[v] < 0) mapa[v] = usados++
    novosIndices[i] = mapa[v]
  }
  const novasPosicoes = new Float32Array(usados * 3)
  for (let v = 0; v < mapa.length; v++) {
    const d = mapa[v]
    if (d < 0) continue
    novasPosicoes[d * 3] = posicoes[v * 3]
    novasPosicoes[d * 3 + 1] = posicoes[v * 3 + 1]
    novasPosicoes[d * 3 + 2] = posicoes[v * 3 + 2]
  }
  return { indices: novosIndices, posicoes: novasPosicoes }
}

/** Normais suavizadas ponderadas pela área das faces. */
export function calcularNormais(indices, posicoes) {
  const normais = new Float32Array(posicoes.length)
  for (let i = 0; i < indices.length; i += 3) {
    const a = indices[i] * 3
    const b = indices[i + 1] * 3
    const c = indices[i + 2] * 3
    const abx = posicoes[b] - posicoes[a]
    const aby = posicoes[b + 1] - posicoes[a + 1]
    const abz = posicoes[b + 2] - posicoes[a + 2]
    const acx = posicoes[c] - posicoes[a]
    const acy = posicoes[c + 1] - posicoes[a + 1]
    const acz = posicoes[c + 2] - posicoes[a + 2]
    const nx = aby * acz - abz * acy
    const ny = abz * acx - abx * acz
    const nz = abx * acy - aby * acx
    for (const base of [a, b, c]) {
      normais[base] += nx
      normais[base + 1] += ny
      normais[base + 2] += nz
    }
  }
  for (let i = 0; i < normais.length; i += 3) {
    const l = Math.hypot(normais[i], normais[i + 1], normais[i + 2]) || 1
    normais[i] /= l
    normais[i + 1] /= l
    normais[i + 2] /= l
  }
  return normais
}

/**
 * STL bruto -> malha soldada, simplificada e compactada.
 * `alvoTriangulos` é um teto; malhas já simples passam intactas.
 */
export async function prepararMalha(buffer, alvoTriangulos, erroAlvo = 0.02) {
  await MeshoptSimplifier.ready
  const { posicoes: brutas, nTri } = lerStlBinario(buffer)

  // Soldagem: o STL repete cada vértice por face. Compactamos antes de
  // simplificar porque o meshoptimizer espera um buffer de vértices denso.
  const denso = compactar(soldar(brutas), brutas)
  let indices = denso.indices
  const posicoes = denso.posicoes

  if (nTri > alvoTriangulos) {
    const [simplificados] = MeshoptSimplifier.simplify(
      indices,
      posicoes,
      3,
      alvoTriangulos * 3,
      erroAlvo,
      ['Prune'],
    )
    indices = simplificados
  }

  const malha = compactar(indices, posicoes)
  return {
    ...malha,
    normais: calcularNormais(malha.indices, malha.posicoes),
    trianguloOriginal: nTri,
    triangulos: malha.indices.length / 3,
  }
}
