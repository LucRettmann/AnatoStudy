// Sistemas do atlas, na ordem de prioridade usada para atribuir cada peça a
// exatamente um sistema (a primeira ocorrência vence). Os órgãos vêm antes da
// musculatura para que, por exemplo, a língua não seja absorvida pelo sistema
// muscular.
export const SISTEMAS = [
  { id: 'sentidos', raiz: 'FMA78499', nome: 'Órgãos dos sentidos' },
  { id: 'endocrino', raiz: 'FMA9668', nome: 'Endócrino' },
  { id: 'urinario', raiz: 'FMA7159', nome: 'Urinário' },
  { id: 'genital', raiz: 'FMA7160', nome: 'Genital' },
  { id: 'linfatico', raiz: 'FMA74594', nome: 'Linfático' },
  { id: 'digestorio', raiz: 'FMA7152', nome: 'Digestório' },
  { id: 'respiratorio', raiz: 'FMA7158', nome: 'Respiratório' },
  { id: 'circulatorio', raiz: 'FMA7161', nome: 'Circulatório' },
  { id: 'nervoso', raiz: 'FMA7157', nome: 'Nervoso' },
  { id: 'muscular', raiz: 'FMA72954', nome: 'Muscular' },
  { id: 'esqueletico', raiz: 'FMA23881', nome: 'Esquelético' },
  { id: 'tegumentar', raiz: 'FMA72979', nome: 'Tegumentar' },
]

/**
 * A hierarquia do FMA classifica algumas peças de um jeito que não ajuda quem
 * estuda: os músculos da mastigação aparecem sob o sistema alimentar, a
 * mandíbula também, o nervo óptico sob os órgãos dos sentidos. Estas regras
 * têm prioridade sobre a hierarquia e são aplicadas ao nome em inglês da peça.
 */
export const ATRIBUICOES_MANUAIS = [
  // Ossos que a ontologia pendura em sistemas viscerais.
  [/\b(mandible|zygomatic bone|nasal bone|vomer|inferior nasal concha)\b/i, 'esqueletico'],
  // Músculos da face, da mastigação e do períneo.
  [
    /\b(masseter|medial pterygoid|lateral pterygoid|mentalis|orbicularis oris|orbicularis oculi|depressor labii inferioris|depressor septi nasi|nasalis|procerus|pubococcygeus|external anal sphincter)\b/i,
    'muscular',
  ],
  // Nervos cranianos pertencem ao sistema nervoso.
  [/\boptic nerve\b/i, 'nervoso'],
  // O pâncreas é estudado com o tubo digestório; a gônada, com o sistema genital.
  [/\bpancrea(s|tic)\b/i, 'digestorio'],
  [/\btestis\b/i, 'genital'],
]

/** Sistema definido manualmente para uma peça, ou null. */
export function sistemaManual(nomeEn) {
  for (const [padrao, sistema] of ATRIBUICOES_MANUAIS) {
    if (padrao.test(nomeEn)) return sistema
  }
  return null
}
