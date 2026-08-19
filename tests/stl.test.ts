import { describe, expect, it } from 'vitest'
import { lerStlBinario } from '../scripts/lib/malha.mjs'

/** Constrói um STL binário mínimo com um triângulo conhecido. */
function stlDeUmTriangulo() {
  const buffer = Buffer.alloc(84 + 50)
  buffer.writeUInt32LE(1, 80)
  const valores = [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0]
  valores.forEach((v, i) => buffer.writeFloatLE(v, 84 + i * 4))
  return buffer
}

describe('leitura de STL binário', () => {
  it('lê o número de triângulos e as posições', () => {
    const { posicoes, nTri } = lerStlBinario(stlDeUmTriangulo())
    expect(nTri).toBe(1)
    expect(posicoes.length).toBe(9)
    expect(Array.from(posicoes.slice(0, 3))).toEqual([0, 0, 0])
    expect(Array.from(posicoes.slice(3, 6))).toEqual([1, 0, 0])
  })

  it('recusa arquivos truncados', () => {
    const truncado = stlDeUmTriangulo().subarray(0, 100)
    expect(() => lerStlBinario(truncado)).toThrow(/truncado/)
  })
})
