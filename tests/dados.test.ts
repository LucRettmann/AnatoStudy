import { describe, expect, it } from 'vitest'
import manifesto from '../src/data/generated/manifesto.json'
import termos from '../src/data/generated/termos.json'
import sistemasBase from '../src/data/sistemas.json'
import { ARQUIVOS_CURADOS, estruturaPorFma, estruturas, pecasDoModelo, sistemas } from '../src/data'
import { fichaSchema, sistemaSchema } from '../src/data/schema'

const pecas = manifesto.pecas as Record<string, { sistema: string }>
const fichas = ARQUIVOS_CURADOS.flat()

describe('sistemas.json', () => {
  it('valida contra o schema', () => {
    for (const sistema of sistemasBase) expect(() => sistemaSchema.parse(sistema)).not.toThrow()
  })

  it('todo sistema declarado tem um .glb no manifesto', () => {
    for (const sistema of sistemasBase) expect(manifesto.sistemas).toHaveProperty(sistema.id)
    expect(sistemas.length).toBe(sistemasBase.length)
  })
})

describe('fichas curadas', () => {
  it('validam contra o schema', () => {
    for (const ficha of fichas) {
      expect(() => fichaSchema.parse(ficha), `ficha ${ficha.id}`).not.toThrow()
    }
  })

  it('não repetem ids', () => {
    const vistos = new Set<string>()
    for (const ficha of fichas) {
      expect(vistos.has(ficha.id), `id duplicado: ${ficha.id}`).toBe(false)
      vistos.add(ficha.id)
    }
  })

  it('referenciam apenas peças existentes no modelo', () => {
    for (const ficha of fichas) {
      for (const fmaId of ficha.fmaIds) {
        expect(pecas[fmaId], `${ficha.id} -> ${fmaId}`).toBeDefined()
      }
    }
  })

  it('só agrupam peças do próprio sistema', () => {
    for (const ficha of fichas) {
      for (const fmaId of ficha.fmaIds) {
        expect(pecas[fmaId].sistema, `${ficha.id} -> ${fmaId}`).toBe(ficha.sistema)
      }
    }
  })

  it('não disputam a mesma peça', () => {
    const dono = new Map<string, string>()
    for (const ficha of fichas) {
      for (const fmaId of ficha.fmaIds) {
        expect(dono.get(fmaId), `${fmaId} em ${ficha.id} e ${dono.get(fmaId)}`).toBeUndefined()
        dono.set(fmaId, ficha.id)
      }
    }
  })

  it('usam um sistema declarado em sistemas.json', () => {
    const ids = new Set(sistemasBase.map((s) => s.id))
    for (const ficha of fichas) expect(ids.has(ficha.sistema), ficha.id).toBe(true)
  })
})

describe('índice montado em src/data', () => {
  it('toda peça do modelo chega a alguma ficha', () => {
    for (const fmaId of Object.keys(pecas)) {
      expect(estruturaPorFma.get(fmaId), fmaId).toBeDefined()
    }
  })

  it('toda peça tem nome em português e latim', () => {
    const dicionario = termos as Record<string, { pt: string | null; la: string | null }>
    for (const fmaId of Object.keys(pecas)) {
      expect(dicionario[fmaId]?.pt, fmaId).toBeTruthy()
      expect(dicionario[fmaId]?.la, fmaId).toBeTruthy()
    }
  })

  it('expõe uma entrada de busca por peça e centros finitos', () => {
    expect(pecasDoModelo.length).toBe(Object.keys(pecas).length)
    for (const estrutura of estruturas) {
      expect(estrutura.centro.every(Number.isFinite), estrutura.id).toBe(true)
      expect(estrutura.extensao).toBeGreaterThan(0)
    }
  })
})
