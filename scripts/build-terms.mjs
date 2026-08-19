// Casa os nomes em inglês do BodyParts3D com a Terminologia Anatomica 2
// (arquivo TA2.csv do projeto Z-Anatomy) para obter nome em Português e Latim.
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { RAIZ } from './lib/source.mjs'
import { carregarTa2 } from './lib/bodyparts3d.mjs'
import { termoPorRegra } from './lib/regras-termos.mjs'

const semParenteses = (s) => s.replace(/\[[^\]]*\]/g, ' ').replace(/\([^)]*\)/g, ' ')

const normalizar = (s) =>
  semParenteses(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/,\s*nsn\b/g, '')
    .replace(/[^a-z0-9 ]+/g, ' ')
    // Grafia britânica do TA2 (oesophagus, caecum, coeliac) -> grafia do BodyParts3D.
    .replace(/oe/g, 'e')
    .replace(/ae/g, 'e')
    .replace(/\s+/g, ' ')
    .trim()

// Palavras femininas em Português cuja terminação engana a heurística do -a.
const FEMININAS = new Set(['mao', 'articulacao', 'regiao', 'falange', 'ponte', 'base', 'parte'])
const MASCULINAS = new Set(['musculo', 'osso', 'nervo', 'lobo', 'ramo', 'seio', 'canal', 'ducto'])

function concordancia(termoPt) {
  // Em "Parte ascendente do músculo trapézio" a lateralidade concorda com o
  // último núcleo introduzido por "do/da/dos/das", não com a primeira palavra.
  const normal = normalizar(termoPt)
  const comComplemento = normal.match(/\b(?:do|da|dos|das)\s+(\w+)(?!.*\b(?:do|da|dos|das)\b)/)
  const primeira = comComplemento ? comComplemento[1] : (normal.split(' ')[0] ?? '')
  if (MASCULINAS.has(primeira)) return 'o'
  if (FEMININAS.has(primeira)) return 'a'
  return primeira.endsWith('a') ? 'a' : 'o'
}

/** "right femur" -> { base: "femur", lado: 'direito' } */
function separarLado(nomeEn) {
  const n = normalizar(nomeEn)
  if (/\bright\b/.test(n)) return { base: n.replace(/\bright\b/g, '').replace(/\s+/g, ' ').trim(), lado: 'direito' }
  if (/\bleft\b/.test(n)) return { base: n.replace(/\bleft\b/g, '').replace(/\s+/g, ' ').trim(), lado: 'esquerdo' }
  return { base: n, lado: null }
}

function comLado(termoPt, lado) {
  if (!lado) return termoPt
  const g = concordancia(termoPt)
  const sufixo = lado === 'direito' ? (g === 'a' ? 'direita' : 'direito') : g === 'a' ? 'esquerda' : 'esquerdo'
  return `${termoPt} ${sufixo}`
}

function comLadoLatim(termoLa, lado) {
  if (!termoLa || !lado) return termoLa
  return `${termoLa} ${lado === 'direito' ? 'dextrum' : 'sinistrum'}`
}

// Palavras que não distinguem estruturas e podem ser ignoradas na comparação
// por conjunto de tokens (usada como último recurso).
const IRRELEVANTES = new Set(['the', 'of', 'secondary', 'muscle', 'bone', 'tooth', 'a', 'part'])

const assinatura = (s) =>
  normalizar(s)
    .split(' ')
    .filter((t) => t && !IRRELEVANTES.has(t))
    .sort()
    .join(' ')

// Nomes que o BodyParts3D grafa de forma diferente da Terminologia Anatomica.
const SINONIMOS = {
  'adrenal gland': 'suprarenal gland',
  'deferent duct': 'ductus deferens',
  'seminal vesicle': 'seminal gland',
  appendix: 'vermiform appendix',
  'pineal body': 'pineal gland',
  'vermiform appendix': 'vermiform appendix',
  'urinary bladder': 'bladder',
  'vertebral column': 'vertebral column',
  'spinal cord': 'spinal cord',
  'large intestine': 'large intestine',
  'gall bladder': 'gallbladder',
  'thyroid gland': 'thyroid gland',
  'oral cavity': 'oral cavity',
  'arch of aorta': 'aortic arch',
  'tricuspid valve': 'right atrioventricular valve',
  'mitral valve': 'left atrioventricular valve',
  'celiac artery': 'celiac trunk',
  'pulmonary artery': 'pulmonary trunk',
  'brachiocephalic artery': 'brachiocephalic trunk',
  'upper lobe of lung': 'superior lobe of lung',
  'lower lobe of lung': 'inferior lobe of lung',
  'middle lobe of lung': 'middle lobe of right lung',
}

/** Trocas de vocabulário equivalentes entre BodyParts3D e TA2. */
const EQUIVALENTES = [
  [/\bupper\b/g, 'superior'],
  [/\blower\b/g, 'inferior'],
  [/\bfront\b/g, 'anterior'],
  [/\bback\b/g, 'posterior'],
]

// Variantes de escrita para aumentar o índice de acerto.
function variantes(base) {
  const v = new Set([base])
  v.add(base.replace(/^muscle of /, '').trim())
  v.add(`muscle ${base}`)
  v.add(base.replace(/\bmuscle\b/g, '').replace(/\s+/g, ' ').trim())
  v.add(base.replace(/\bbone\b/g, '').replace(/\s+/g, ' ').trim())
  v.add(base.replace(/\bthe\b/g, '').replace(/\s+/g, ' ').trim())
  // "body of sternum" <-> "sternum body"
  const m = base.match(/^(.+) of (.+)$/)
  if (m) {
    v.add(`${m[2]} ${m[1]}`)
    v.add(m[1])
  }
  v.add(base.replace(/^set of /, '').trim())
  v.add(base.replace(/^set of /, '').replace(/s\b/g, '').trim())
  v.add(`${base} muscle`)
  v.add(`${base} bone`)
  v.add(`${base} tooth`)
  v.add(base.replace(/\bsecondary\b/g, '').replace(/\s+/g, ' ').trim())
  v.add(base.replace(/s\b/g, '').trim())
  if (SINONIMOS[base]) v.add(SINONIMOS[base])
  for (const atual of [...v]) {
    let trocado = atual
    for (const [de, para] of EQUIVALENTES) trocado = trocado.replace(de, para)
    if (trocado !== atual) v.add(trocado)
    if (SINONIMOS[trocado]) v.add(SINONIMOS[trocado])
  }
  return [...v].filter(Boolean)
}

async function main() {
  const manifesto = JSON.parse(
    await readFile(join(RAIZ, 'src', 'data', 'generated', 'manifesto.json'), 'utf8'),
  )
  const ta2 = await carregarTa2()
  const manuais = JSON.parse(await readFile(join(RAIZ, 'scripts', 'termos-manuais.json'), 'utf8'))
  const porManual = new Map()
  for (const [chave, valor] of Object.entries(manuais)) {
    if (chave.startsWith('_')) continue
    porManual.set(normalizar(chave), valor)
  }

  const porEn = new Map()
  const porAssinatura = new Map()
  for (const t of ta2) {
    // A coluna inglesa às vezes traz sinônimos separados por ';'.
    for (const sinonimo of t.en.split(';')) {
      const chave = normalizar(sinonimo)
      if (chave && !porEn.has(chave)) porEn.set(chave, t)
      const assin = assinatura(sinonimo)
      if (assin && !porAssinatura.has(assin)) porAssinatura.set(assin, t)
    }
  }

  const termos = {}
  const semCorrespondencia = []
  for (const [id, peca] of Object.entries(manifesto.pecas)) {
    const { base, lado } = separarLado(peca.nomeEn)
    let achado = null
    let ladoAplicado = lado

    // 1) padrões regulares (vértebras, discos, costelas, falanges...)
    const porRegra = termoPorRegra(peca.nomeEn)
    if (porRegra) {
      termos[id] = { pt: porRegra.pt, la: porRegra.la, en: peca.nomeEn, ta2id: null }
      continue
    }

    // 2) dicionário conferido à mão — primeiro com lateralidade, depois sem
    const manualCompleto = porManual.get(normalizar(peca.nomeEn))
    const manualBase = porManual.get(base)
    if (manualCompleto || manualBase) {
      const escolhido = manualCompleto ?? manualBase
      const aplicar = manualCompleto ? null : lado
      termos[id] = {
        pt: comLado(escolhido.pt, aplicar),
        la: comLadoLatim(escolhido.la, aplicar),
        en: peca.nomeEn,
        ta2id: null,
      }
      continue
    }

    // O TA2 muitas vezes já traz a lateralidade no termo ("Superior lobe of
    // right lung"); nesse caso o nome completo é a correspondência mais fiel.
    for (const v of variantes(normalizar(peca.nomeEn))) {
      achado = porEn.get(v)
      if (achado) {
        ladoAplicado = null
        break
      }
    }

    if (achado) {
      // já resolvido com o nome completo
    } else
    for (const v of variantes(base)) {
      achado = porEn.get(v)
      if (achado) break
    }
    if (!achado) {
      for (const v of variantes(base)) {
        achado = porAssinatura.get(assinatura(v))
        if (achado) break
      }
    }
    if (achado) {
      termos[id] = {
        pt: comLado(achado.pt, ladoAplicado),
        la: comLadoLatim(achado.la, ladoAplicado),
        en: peca.nomeEn,
        ta2id: achado.ta2id,
      }
    } else {
      termos[id] = { pt: null, la: null, en: peca.nomeEn, ta2id: null }
      semCorrespondencia.push(`${id}\t${peca.nomeEn}`)
    }
  }

  await writeFile(
    join(RAIZ, 'src', 'data', 'generated', 'termos.json'),
    `${JSON.stringify(termos, null, 1)}\n`,
  )
  await writeFile(join(RAIZ, '.cache', 'termos-sem-correspondencia.txt'), `${semCorrespondencia.join('\n')}\n`)

  const total = Object.keys(termos).length
  console.log(`${total - semCorrespondencia.length}/${total} peças com termo TA2 (PT/Latim)`)
}

await main()
