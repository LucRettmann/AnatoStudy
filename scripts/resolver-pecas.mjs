// Preenche o campo `fmaIds` das fichas curadas a partir do campo `pecas`,
// que lista expressões regulares aplicadas ao nome em inglês do BodyParts3D.
//
// Fluxo de autoria: escreva a ficha com "pecas": ["^right femur$"], rode
// `npm run data:resolver` e o script grava os FMAIDs correspondentes.
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { RAIZ } from './lib/source.mjs'

const manifesto = JSON.parse(await readFile(join(RAIZ, 'src', 'data', 'generated', 'manifesto.json'), 'utf8'))
const pecas = Object.entries(manifesto.pecas)

const arquivos = [
  'ossos', 'musculos', 'nervoso', 'circulatorio', 'respiratorio', 'digestorio',
  'urinario', 'endocrino', 'linfatico', 'tegumentar', 'sentidos', 'genital',
]

let semCorrespondencia = 0
for (const nome of arquivos) {
  const caminho = join(RAIZ, 'src', 'data', `${nome}.json`)
  const fichas = JSON.parse(await readFile(caminho, 'utf8'))
  let alteradas = 0

  for (const ficha of fichas) {
    if (!ficha.pecas?.length) continue
    const expressoes = ficha.pecas.map((p) => new RegExp(p, 'i'))
    const ids = pecas
      .filter(([, peca]) => peca.sistema === ficha.sistema && expressoes.some((r) => r.test(peca.nomeEn)))
      .map(([id]) => id)
      .sort()
    if (ids.length === 0) {
      console.warn(`  ! ${nome}/${ficha.id}: nenhuma peça casou com ${JSON.stringify(ficha.pecas)}`)
      semCorrespondencia++
    }
    if (JSON.stringify(ids) !== JSON.stringify(ficha.fmaIds)) alteradas++
    ficha.fmaIds = ids
  }

  await writeFile(caminho, `${JSON.stringify(fichas, null, 2)}\n`)
  const total = fichas.length
  if (total) console.log(`${nome.padEnd(13)} ${String(total).padStart(3)} fichas · ${alteradas} atualizadas`)
}

if (semCorrespondencia) {
  console.error(`\n${semCorrespondencia} ficha(s) sem peça correspondente no modelo.`)
  process.exitCode = 1
}
