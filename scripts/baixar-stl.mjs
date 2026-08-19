// Pré-carrega no cache local todos os STL usados pelo atlas.
import { baixar, BP3D, emParalelo } from './lib/source.mjs'
import { carregarOntologia, descendentes } from './lib/bodyparts3d.mjs'
import { indiceStl } from './lib/indice-stl.mjs'
import { SISTEMAS } from './sistemas.mjs'

const onto = await carregarOntologia()
const idx = await indiceStl([...onto.nomes.keys()])

const usados = new Set()
for (const s of SISTEMAS) {
  for (const id of descendentes(onto, s.raiz)) {
    if (idx[id] > 0) usados.add(id)
  }
}

const ids = [...usados]
const total = ids.reduce((a, id) => a + idx[id], 0)
console.log(`${ids.length} malhas · ${(total / 1048576).toFixed(0)} MB`)

let feitos = 0
let bytes = 0
await emParalelo(ids, 12, async (id) => {
  const buf = await baixar(`${BP3D}/stl/${id}.stl`, `bp3d/stl/${id}.stl`)
  bytes += buf?.length ?? 0
  if (++feitos % 50 === 0) {
    console.log(`  ${feitos}/${ids.length} · ${(bytes / 1048576).toFixed(0)} MB`)
  }
})
console.log(`pronto: ${feitos} malhas`)
