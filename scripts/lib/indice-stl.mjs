// Descobre quais FMAIDs possuem malha STL no espelho do BodyParts3D.
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { BP3D, CACHE, emParalelo } from './source.mjs'

const ARQUIVO = join(CACHE, 'stl-index.json')

export async function indiceStl(ids) {
  let conhecido = {}
  try {
    conhecido = JSON.parse(await readFile(ARQUIVO, 'utf8'))
  } catch {
    /* primeira execução */
  }

  const pendentes = ids.filter((id) => conhecido[id] === undefined)
  if (pendentes.length) {
    let feitos = 0
    await emParalelo(pendentes, 16, async (id) => {
      for (let t = 0; t < 4; t++) {
        try {
          const r = await fetch(`${BP3D}/stl/${id}.stl`, { method: 'HEAD' })
          conhecido[id] = r.ok ? Number(r.headers.get('content-length') ?? 0) : 0
          break
        } catch {
          await new Promise((res) => setTimeout(res, 1000 * 2 ** t))
        }
      }
      if (++feitos % 200 === 0) process.stderr.write(`  ...${feitos}/${pendentes.length}\n`)
    })
    await mkdir(CACHE, { recursive: true })
    await writeFile(ARQUIVO, JSON.stringify(conhecido))
  }
  return conhecido
}
