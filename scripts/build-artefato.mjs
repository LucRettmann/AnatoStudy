// Gera uma versão do AnatoStudy em UM único arquivo HTML autocontido.
//
// É o formato exigido pelas páginas publicadas no claude.ai: nada pode ser
// buscado de fora, então JS, CSS e os doze .glb entram embutidos — os modelos
// como `data:` URI, lidos por `src/lib/modelos.ts`. Use o perfil leve do
// pipeline, senão a página estoura o teto de 16 MB.
//
//   PERFIL=leve SAIDA_MODELOS=.cache/models-leve node scripts/build-models.mjs
//   node scripts/build-artefato.mjs
import { execFileSync } from 'node:child_process'
import { mkdir, readFile, readdir, writeFile, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { RAIZ } from './lib/source.mjs'

const MODELOS = process.env.MODELOS_ARTEFATO ?? join(RAIZ, '.cache', 'models-leve')
const SAIDA = join(RAIZ, '.cache', 'artefato')
const TETO_BYTES = 15 * 1024 * 1024

const mb = (n) => `${(n / 1048576).toFixed(2)} MB`

console.log('build do Vite…')
execFileSync('npx', ['vite', 'build'], { cwd: RAIZ, stdio: 'inherit' })

const dirAssets = join(RAIZ, 'dist', 'assets')
const assets = await readdir(dirAssets)
const arquivoJs = assets.find((a) => a.endsWith('.js'))
const arquivoCss = assets.find((a) => a.endsWith('.css'))
if (!arquivoJs || !arquivoCss) throw new Error('não encontrei o bundle em dist/assets')

const js = await readFile(join(dirAssets, arquivoJs), 'utf8')
const css = await readFile(join(dirAssets, arquivoCss), 'utf8')

// Os modelos entram na mesma chave que o manifesto usa ("models/<sistema>.glb").
const embutidos = {}
let bytesModelos = 0
for (const nome of (await readdir(MODELOS)).filter((n) => n.endsWith('.glb')).sort()) {
  const buf = await readFile(join(MODELOS, nome))
  bytesModelos += buf.length
  embutidos[`models/${nome}`] = `data:model/gltf-binary;base64,${buf.toString('base64')}`
}
const nModelos = Object.keys(embutidos).length
if (nModelos === 0) throw new Error(`nenhum .glb em ${MODELOS}`)
console.log(`${nModelos} modelos · ${mb(bytesModelos)} originais`)

// `</script>` dentro de uma string quebraria a tag que a envolve.
const seguro = (texto) => texto.replaceAll('</script', '<\\/script')

const pagina = `<title>AnatoStudy</title>
<meta name="description" content="Atlas 3D interativo de anatomia humana em português: camadas por sistema, busca por estrutura e fichas com nome em latim, localização, função, origem, inserção e ação." />
<style>
${css}
</style>
<div id="raiz"></div>
<script>
window.__MODELOS__ = ${seguro(JSON.stringify(embutidos))};
</script>
<script type="module">
${seguro(js)}
</script>
`

await mkdir(SAIDA, { recursive: true })
const destino = join(SAIDA, 'anatostudy.html')
await writeFile(destino, pagina)

const { size } = await stat(destino)
console.log(`${destino} · ${mb(size)}`)
if (size > TETO_BYTES) {
  throw new Error(
    `página com ${mb(size)} — acima do teto de ${mb(TETO_BYTES)}. ` +
      'Reduza `razao`/`teto` do perfil leve em scripts/build-models.mjs e refaça os modelos.',
  )
}
