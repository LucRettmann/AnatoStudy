import { describe, expect, it } from 'vitest'
import termos from '../src/data/generated/termos.json'
import { termoPorRegra } from '../scripts/lib/regras-termos.mjs'

const dicionario = termos as Record<string, { pt: string | null; la: string | null; en: string }>

describe('nomes derivados da Terminologia Anatomica', () => {
  it('acerta casos de referência', () => {
    expect(dicionario.FMA24474.pt).toBe('Fêmur direito')
    expect(dicionario.FMA24474.la).toBe('Os femoris dextrum')
    expect(dicionario.FMA7148.pt).toBe('Estômago')
    expect(dicionario.FMA7197.pt).toBe('Fígado')
  })

  it('concorda o gênero com o núcleo do termo composto', () => {
    // "Parte ascendente do músculo trapézio" concorda com "músculo", não com "parte".
    expect(dicionario.FMA33581.pt).toBe('Parte ascendente do músculo trapézio direito')
    expect(dicionario.FMA3818.pt).toBe('Ramo marginal da artéria coronária direita')
  })
})

describe('regras de nomenclatura regular', () => {
  it('resolve vértebras, discos, costelas e falanges', () => {
    expect(termoPorRegra('ninth thoracic vertebra')).toEqual({
      pt: 'Vértebra torácica T9',
      la: 'Vertebra thoracica IX',
    })
    expect(termoPorRegra('intervertebral disk of fourth lumbar vertebra')?.pt).toBe(
      'Disco intervertebral abaixo de L4',
    )
    expect(termoPorRegra('right third costal cartilage')?.pt).toBe('3ª cartilagem costal direita')
    expect(termoPorRegra('middle phalanx of left index finger')?.pt).toBe(
      'Falange média do dedo indicador esquerdo',
    )
  })

  it('devolve null para nomes fora dos padrões', () => {
    expect(termoPorRegra('stomach')).toBeNull()
  })
})
