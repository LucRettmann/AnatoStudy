// Regras para nomes que seguem padrões regulares (vértebras, discos, costelas,
// falanges, lumbricais e interósseos). O TA2 não lista cada um deles
// individualmente, mas a nomenclatura é totalmente previsível.

const ORDINAIS = {
  first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6,
  seventh: 7, eighth: 8, ninth: 9, tenth: 10, eleventh: 11, twelfth: 12,
}
const ROMANOS = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']

const REGIOES = {
  cervical: { sigla: 'C', pt: 'cervical', la: 'cervicalis' },
  thoracic: { sigla: 'T', pt: 'torácica', la: 'thoracica' },
  lumbar: { sigla: 'L', pt: 'lombar', la: 'lumbalis' },
}

const DEDOS_MAO = {
  thumb: { pt: 'polegar', la: 'pollicis' },
  'index finger': { pt: 'dedo indicador', la: 'indicis' },
  'middle finger': { pt: 'dedo médio', la: 'digiti medii' },
  'ring finger': { pt: 'dedo anular', la: 'digiti anularis' },
  'little finger': { pt: 'dedo mínimo', la: 'digiti minimi' },
}
const DEDOS_PE = {
  'great toe': { pt: 'hálux', la: 'hallucis' },
  'big toe': { pt: 'hálux', la: 'hallucis' },
  'second toe': { pt: 'segundo dedo do pé', la: 'digiti secundi pedis' },
  'third toe': { pt: 'terceiro dedo do pé', la: 'digiti tertii pedis' },
  'fourth toe': { pt: 'quarto dedo do pé', la: 'digiti quarti pedis' },
  'little toe': { pt: 'dedo mínimo do pé', la: 'digiti minimi pedis' },
}

const FALANGES = {
  proximal: { pt: 'Falange proximal', la: 'Phalanx proximalis' },
  middle: { pt: 'Falange média', la: 'Phalanx media' },
  distal: { pt: 'Falange distal', la: 'Phalanx distalis' },
}

const lado = (n) => (n === 'right' ? 'direito' : 'esquerdo')
const ladoF = (n) => (n === 'right' ? 'direita' : 'esquerda')
const ladoLa = (n) => (n === 'right' ? 'dextra' : 'sinistra')

/**
 * Recebe o nome em inglês do BodyParts3D e devolve { pt, la } ou null.
 * As entradas chegam já em minúsculas, sem ", nsn".
 */
export function termoPorRegra(en) {
  const n = en.toLowerCase().replace(/,\s*nsn\b/g, '').trim()
  let m

  // "ninth thoracic vertebra"
  if ((m = n.match(/^(\w+) (cervical|thoracic|lumbar) vertebra$/)) && ORDINAIS[m[1]]) {
    const r = REGIOES[m[2]]
    const i = ORDINAIS[m[1]]
    return { pt: `Vértebra ${r.pt} ${r.sigla}${i}`, la: `Vertebra ${r.la} ${ROMANOS[i]}` }
  }

  // "intervertebral disk of fourth lumbar vertebra"
  if ((m = n.match(/^intervertebral disk of (\w+) (cervical|thoracic|lumbar) vertebra$/)) && ORDINAIS[m[1]]) {
    const r = REGIOES[m[2]]
    const i = ORDINAIS[m[1]]
    return {
      pt: `Disco intervertebral abaixo de ${r.sigla}${i}`,
      la: `Discus intervertebralis ${r.la} ${ROMANOS[i]}`,
    }
  }

  // "right third costal cartilage" / "right costal cartilage"
  if ((m = n.match(/^(right|left) (?:(\w+) )?costal cartilage$/))) {
    const i = m[2] ? ORDINAIS[m[2]] : null
    return {
      pt: i ? `${i}ª cartilagem costal ${ladoF(m[1])}` : `Cartilagem costal ${ladoF(m[1])}`,
      la: i ? `Cartilago costalis ${ROMANOS[i]} ${ladoLa(m[1])}` : `Cartilago costalis ${ladoLa(m[1])}`,
    }
  }

  // "middle phalanx of right index finger"
  if ((m = n.match(/^(proximal|middle|distal) phalanx of (right|left) (.+)$/))) {
    const f = FALANGES[m[1]]
    const dedo = DEDOS_MAO[m[3]] ?? DEDOS_PE[m[3]]
    if (dedo) {
      return {
        pt: `${f.pt} do ${dedo.pt} ${lado(m[2])}`,
        la: `${f.la} ${dedo.la} ${ladoLa(m[2])}`,
      }
    }
  }

  // "first lumbrical of right foot"
  if ((m = n.match(/^(\w+) lumbrical of (right|left) (foot|hand)$/)) && ORDINAIS[m[1]]) {
    const i = ORDINAIS[m[1]]
    const regiao = m[3] === 'foot' ? 'do pé' : 'da mão'
    const regiaoLa = m[3] === 'foot' ? 'pedis' : 'manus'
    return {
      pt: `${i}º músculo lumbrical ${regiao} ${lado(m[2])}`,
      la: `Musculus lumbricalis ${ROMANOS[i]} ${regiaoLa} ${ladoLa(m[2])}`,
    }
  }

  // "second plantar interosseous of right foot" / "... dorsal interosseous ..."
  if ((m = n.match(/^(\w+) (plantar|dorsal|palmar) interosseous of (right|left) (foot|hand)$/)) && ORDINAIS[m[1]]) {
    const i = ORDINAIS[m[1]]
    const tipo = { plantar: 'plantar', dorsal: 'dorsal', palmar: 'palmar' }[m[2]]
    const tipoLa = { plantar: 'plantaris', dorsal: 'dorsalis', palmar: 'palmaris' }[m[2]]
    const regiao = m[4] === 'foot' ? 'do pé' : 'da mão'
    const regiaoLa = m[4] === 'foot' ? 'pedis' : 'manus'
    return {
      pt: `${i}º músculo interósseo ${tipo} ${regiao} ${lado(m[3])}`,
      la: `Musculus interosseus ${tipoLa} ${ROMANOS[i]} ${regiaoLa} ${ladoLa(m[3])}`,
    }
  }

  // "eighth rib"
  if ((m = n.match(/^(right|left) (\w+) rib$/)) && ORDINAIS[m[2]]) {
    const i = ORDINAIS[m[2]]
    return { pt: `${i}ª costela ${ladoF(m[1])}`, la: `Costa ${ROMANOS[i]} ${ladoLa(m[1])}` }
  }

  return null
}
