// Gera public/models/<sistema>.glb a partir das malhas do BodyParts3D.
//
// Cada peça anatômica vira um nó/malha nomeado com o seu FMAID — é essa string
// que a aplicação usa para ligar um clique no 3D à ficha em src/data/*.json.
import { mkdir, writeFile } from 'node:fs/promises'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { Document, NodeIO } from '@gltf-transform/core'
import { EXTMeshoptCompression, KHRMeshQuantization } from '@gltf-transform/extensions'
import { quantize, reorder } from '@gltf-transform/functions'
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer'
import { RAIZ, baixar, BP3D } from './lib/source.mjs'
import { carregarOntologia, descendentes } from './lib/bodyparts3d.mjs'
import { indiceStl } from './lib/indice-stl.mjs'
import { SISTEMAS, sistemaManual } from './sistemas.mjs'
import { prepararMalha } from './lib/malha.mjs'

// Referencial do BodyParts3D: milímetros, Z para cima, -Y para a frente.
// Convertemos para o referencial glTF (metros, Y para cima, +Z para a frente)
// usando a caixa envolvente da pele (FMA7163), que engloba o corpo inteiro.
const CAIXA_CORPO = { min: [-329.9, -239.3, -13.5], max: [328.7, 46.3, 1641.7] }
const CENTRO = CAIXA_CORPO.min.map((v, i) => (v + CAIXA_CORPO.max[i]) / 2)
const ESCALA = 1 / 1000

function paraGltf(posicoes) {
  const saida = new Float32Array(posicoes.length)
  for (let i = 0; i < posicoes.length; i += 3) {
    saida[i] = (posicoes[i] - CENTRO[0]) * ESCALA
    saida[i + 1] = (posicoes[i + 2] - CENTRO[2]) * ESCALA
    saida[i + 2] = -(posicoes[i + 1] - CENTRO[1]) * ESCALA
  }
  return saida
}

function normaisParaGltf(normais) {
  const saida = new Float32Array(normais.length)
  for (let i = 0; i < normais.length; i += 3) {
    saida[i] = normais[i]
    saida[i + 1] = normais[i + 2]
    saida[i + 2] = -normais[i + 1]
  }
  return saida
}

// Orçamento de triângulos por peça: proporcional à complexidade original,
// com piso (peças pequenas continuam legíveis) e teto (peças enormes não
// dominam o arquivo). `tetoPorSistema` afina casos como a pele.
// O perfil "leve" existe para a versão autocontida do site (Artifact), em que
// todos os .glb viajam embutidos na página e precisam caber num teto de 16 MB.
const PERFIS = {
  padrao: { razao: 0.15, piso: 500, teto: 6000, porSistema: { tegumentar: 40000, nervoso: 6000 } },
  leve: { razao: 0.06, piso: 350, teto: 2000, porSistema: { tegumentar: 12000, nervoso: 2500 } },
}

const PERFIL = PERFIS[process.env.PERFIL ?? 'padrao']
if (!PERFIL) throw new Error(`perfil desconhecido: ${process.env.PERFIL}`)

const DESTINO = process.env.SAIDA_MODELOS ?? join('public', 'models')

function orcamento(sistema, triangulosOriginais) {
  const teto = PERFIL.porSistema[sistema] ?? PERFIL.teto
  return Math.min(
    triangulosOriginais,
    Math.max(PERFIL.piso, Math.min(teto, Math.round(triangulosOriginais * PERFIL.razao))),
  )
}

const CORES = {
  esqueletico: [0.92, 0.9, 0.84],
  muscular: [0.72, 0.24, 0.24],
  nervoso: [0.95, 0.85, 0.45],
  circulatorio: [0.78, 0.16, 0.2],
  respiratorio: [0.55, 0.72, 0.85],
  digestorio: [0.85, 0.62, 0.36],
  urinario: [0.63, 0.75, 0.6],
  endocrino: [0.7, 0.5, 0.78],
  linfatico: [0.55, 0.78, 0.72],
  tegumentar: [0.9, 0.75, 0.65],
  sentidos: [0.65, 0.7, 0.9],
  genital: [0.8, 0.6, 0.62],
}

async function main() {
  await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready])
  const onto = await carregarOntologia()
  const idx = await indiceStl([...onto.nomes.keys()])

  // Cada peça pertence a um único sistema: primeiro as atribuições manuais,
  // depois a hierarquia do FMA na ordem declarada em SISTEMAS.
  const atribuidas = new Set()
  const porSistema = new Map(SISTEMAS.map((s) => [s.id, []]))

  for (const [id, nomeEn] of onto.nomes) {
    if (!(idx[id] > 0)) continue
    const manual = sistemaManual(nomeEn)
    if (manual && porSistema.has(manual)) {
      porSistema.get(manual).push(id)
      atribuidas.add(id)
    }
  }

  for (const sistema of SISTEMAS) {
    for (const id of descendentes(onto, sistema.raiz)) {
      if (idx[id] > 0 && !atribuidas.has(id)) {
        atribuidas.add(id)
        porSistema.get(sistema.id).push(id)
      }
    }
  }
  for (const pecas of porSistema.values()) pecas.sort()

  const io = new NodeIO()
    .registerExtensions([EXTMeshoptCompression, KHRMeshQuantization])
    .registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder })
  const manifesto = { fonte: 'BodyParts3D/Anatomography (DBCLS) — CC BY-SA 2.1 JP', sistemas: {}, pecas: {} }
  await mkdir(join(RAIZ, DESTINO), { recursive: true })

  for (const sistema of SISTEMAS) {
    const pecas = porSistema.get(sistema.id)
    if (!pecas.length) continue

    const doc = new Document()
    const buffer = doc.createBuffer()
    const cena = doc.createScene(sistema.id)
    const material = doc
      .createMaterial(`mat-${sistema.id}`)
      .setBaseColorFactor([...(CORES[sistema.id] ?? [0.8, 0.8, 0.8]), 1])
      .setRoughnessFactor(0.75)
      .setMetallicFactor(0)
      .setDoubleSided(true)

    let triangulosSistema = 0
    for (const id of pecas) {
      const stl = await readFile(join(RAIZ, '.cache', 'bp3d', 'stl', `${id}.stl`)).catch(async () =>
        baixar(`${BP3D}/stl/${id}.stl`, `bp3d/stl/${id}.stl`),
      )
      if (!stl) continue

      const bruta = Math.round((stl.length - 84) / 50)
      const malha = await prepararMalha(stl, orcamento(sistema.id, bruta))
      const posicoes = paraGltf(malha.posicoes)
      const normais = normaisParaGltf(malha.normais)

      const acPos = doc.createAccessor(`${id}-pos`).setType('VEC3').setArray(posicoes).setBuffer(buffer)
      const acNor = doc.createAccessor(`${id}-nor`).setType('VEC3').setArray(normais).setBuffer(buffer)
      const acIdx = doc
        .createAccessor(`${id}-idx`)
        .setType('SCALAR')
        .setArray(new Uint32Array(malha.indices))
        .setBuffer(buffer)

      const prim = doc
        .createPrimitive()
        .setAttribute('POSITION', acPos)
        .setAttribute('NORMAL', acNor)
        .setIndices(acIdx)
        .setMaterial(material)
      const mesh = doc.createMesh(id).addPrimitive(prim)
      cena.addChild(doc.createNode(id).setMesh(mesh))

      const min = [Infinity, Infinity, Infinity]
      const max = [-Infinity, -Infinity, -Infinity]
      for (let i = 0; i < posicoes.length; i += 3) {
        for (let k = 0; k < 3; k++) {
          const v = posicoes[i + k]
          if (v < min[k]) min[k] = v
          if (v > max[k]) max[k] = v
        }
      }
      const arredonda = (v) => Number(v.toFixed(4))
      manifesto.pecas[id] = {
        sistema: sistema.id,
        nomeEn: onto.nomes.get(id) ?? id,
        triangulos: malha.triangulos,
        centro: min.map((v, k) => arredonda((v + max[k]) / 2)),
        tamanho: max.map((v, k) => arredonda(v - min[k])),
      }
      triangulosSistema += malha.triangulos
    }

    await doc.transform(reorder({ encoder: MeshoptEncoder }), quantize({ pattern: /^(POSITION|NORMAL)$/ }))
    doc.createExtension(KHRMeshQuantization).setRequired(true)
    doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({ method: 'quantize' })

    const glb = await io.writeBinary(doc)
    const arquivo = `${sistema.id}.glb`
    await writeFile(join(RAIZ, DESTINO, arquivo), glb)

    manifesto.sistemas[sistema.id] = {
      arquivo: `models/${arquivo}`,
      pecas: pecas.length,
      triangulos: triangulosSistema,
      bytes: glb.byteLength,
    }
    console.log(
      `${sistema.id.padEnd(13)} ${String(pecas.length).padStart(4)} peças  ` +
        `${String(Math.round(triangulosSistema / 1000)).padStart(5)}k tri  ` +
        `${(glb.byteLength / 1048576).toFixed(2)} MB`,
    )
  }

  // Só o perfil padrão escreve o manifesto que a aplicação consome; o perfil
  // leve muda apenas a densidade das malhas, não o conjunto de peças.
  if (!process.env.PERFIL || process.env.PERFIL === 'padrao') {
    await mkdir(join(RAIZ, 'src', 'data', 'generated'), { recursive: true })
    await writeFile(
      join(RAIZ, 'src', 'data', 'generated', 'manifesto.json'),
      `${JSON.stringify(manifesto, null, 1)}\n`,
    )
  }
  const totalBytes = Object.values(manifesto.sistemas).reduce((a, s) => a + s.bytes, 0)
  console.log(`\ntotal: ${Object.keys(manifesto.pecas).length} peças · ${(totalBytes / 1048576).toFixed(1)} MB`)
}

await main()
