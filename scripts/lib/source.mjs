// Download + cache das fontes públicas usadas pelo AnatoStudy.
//
// Geometria: BodyParts3D / Anatomography (Database Center for Life Science, Japão),
//            via o espelho no GitHub mantido por Kevin M. Moerman.
//            Licença CC Attribution-Share Alike 2.1 Japan.
// Nomenclatura: Terminologia Anatomica 2 (TA2.csv) do projeto Z-Anatomy,
//            licença CC BY-SA 4.0.
import { mkdir, readFile, writeFile, stat } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
export const CACHE = join(RAIZ, '.cache')

export const BP3D =
  'https://raw.githubusercontent.com/Kevin-Mattheus-Moerman/BodyParts3D/main/assets/BodyParts3D_data'
export const TA2_URL =
  'https://raw.githubusercontent.com/Z-Anatomy/Models-of-human-anatomy/master/TA2.csv'

async function existe(caminho) {
  try {
    const s = await stat(caminho)
    return s.size > 0
  } catch {
    return false
  }
}

/** Baixa `url` com retentativas e guarda em `.cache/<destino>`. Devolve um Buffer. */
export async function baixar(url, destino, { tentativas = 4, texto = false } = {}) {
  const caminho = join(CACHE, destino)
  if (await existe(caminho)) {
    const buf = await readFile(caminho)
    return texto ? buf.toString('utf8') : buf
  }
  await mkdir(dirname(caminho), { recursive: true })

  let ultimoErro
  for (let i = 0; i < tentativas; i++) {
    try {
      const resp = await fetch(url)
      if (resp.status === 404) return null
      if (!resp.ok) throw new Error(`HTTP ${resp.status} em ${url}`)
      const buf = Buffer.from(await resp.arrayBuffer())
      await writeFile(caminho, buf)
      return texto ? buf.toString('utf8') : buf
    } catch (erro) {
      ultimoErro = erro
      await new Promise((r) => setTimeout(r, 2000 * 2 ** i))
    }
  }
  throw ultimoErro
}

/** Executa `tarefa` sobre `itens` com no máximo `limite` execuções simultâneas. */
export async function emParalelo(itens, limite, tarefa) {
  const resultados = new Array(itens.length)
  let proximo = 0
  const trabalhadores = Array.from({ length: Math.min(limite, itens.length) }, async () => {
    while (true) {
      const i = proximo++
      if (i >= itens.length) return
      resultados[i] = await tarefa(itens[i], i)
    }
  })
  await Promise.all(trabalhadores)
  return resultados
}
