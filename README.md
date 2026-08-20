# AnatoStudy

Atlas interativo de anatomia humana em 3D, em português. Modelo navegável de
**934 estruturas** organizadas em **12 camadas por sistema corporal**, com ficha
de estudo para cada uma: nome em português e em latim (Terminologia Anatomica),
localização, função e — para os músculos — origem, inserção, ação e inervação.

> **Modelos reais, não ilustrações.** A geometria vem do BodyParts3D, banco de
> estruturas segmentadas de um mesmo corpo, publicado pelo Database Center for
> Life Science (Japão). A nomenclatura vem da Terminologia Anatomica 2.
> Créditos e licenças em [`NOTICE.md`](NOTICE.md).

## Funcionalidades

- **Modelo 3D navegável** — arrastar para girar, rolagem para zoom, botão
  direito (ou dois dedos) para deslocar.
- **Camadas independentes por sistema** — ligar/desligar cada sistema, ajustar a
  transparência e isolar uma camada para estudar por planos.
- **Clique em qualquer estrutura** → ficha lateral com nome PT + latim,
  localização, função e, nos músculos, origem/inserção/ação/inervação.
- **Busca em dois níveis** — encontra tanto a ficha ("Costelas") quanto a peça
  individual do modelo ("5ª costela direita"), destaca no 3D e leva a câmera até
  ela.
- **Lista lateral navegável** por sistema, com filtro.
- **Responsivo** — três colunas no desktop; gaveta lateral e folha inferior no
  celular.
- **Link direto** para cada estrutura: `#/estrutura/<id>`.

## Rodando

```bash
npm install
npm run dev          # http://localhost:5173
```

Os arquivos `.glb` já estão versionados em `public/models/`, então o projeto
funciona logo após o `npm install` — não é preciso baixar nada.

| Script | O que faz |
| --- | --- |
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` | build de produção em `dist/` |
| `npm run preview` | serve o build |
| `npm test` | testes de integridade dos dados (vitest) |
| `npm run typecheck` | checagem de tipos |
| `npm run data:resolver` | preenche os `fmaIds` das fichas a partir do campo `pecas` |
| `npm run models` | regenera os `.glb` a partir do BodyParts3D (precisa de rede) |
| `npm run models:terms` | regenera os nomes PT/latim a partir da TA2 |
| `npm run artefato` | gera a versão em página única, autocontida (ver abaixo) |

## Como adicionar ou editar conteúdo

O conteúdo mora em JSON, um arquivo por sistema, e **não exige mexer em código**.

```
src/data/
  sistemas.json        cores, nomes e visibilidade padrão das camadas
  ossos.json           fichas do sistema esquelético
  musculos.json        fichas do sistema muscular
  nervoso.json  circulatorio.json  respiratorio.json  digestorio.json
  urinario.json endocrino.json     linfatico.json     tegumentar.json
  sentidos.json genital.json
  generated/           gerado pelos scripts — não editar à mão
    manifesto.json     peças de cada .glb, com centro e nº de triângulos
    termos.json        nome PT/latim de cada peça, vindo da TA2
```

### Editar uma ficha

Abra o JSON do sistema e altere os campos. Todos os campos de texto são
opcionais: o painel só mostra os que estiverem preenchidos.

```jsonc
{
  "id": "biceps-braquial",          // único no projeto; vira o link #/estrutura/<id>
  "sistema": "muscular",            // precisa existir em sistemas.json
  "nome": "Bíceps braquial",
  "nomeLatim": "Musculus biceps brachii",
  "sinonimos": ["bíceps"],          // entram na busca
  "pecas": ["(long|short) head of (right|left) biceps brachii"],
  "fmaIds": ["FMA37684", "FMA37685", "FMA37692", "FMA37693"],
  "localizacao": "Compartimento anterior do braço…",
  "origem": "Cabeça longa: tubérculo supraglenoidal…",
  "insercao": "Tuberosidade do rádio…",
  "acao": "Flexão do cotovelo e supinação do antebraço.",
  "inervacao": "Nervo musculocutâneo (C5–C6).",
  "curiosidade": "…"
}
```

Campos aceitos: `localizacao`, `funcao`, `origem`, `insercao`, `acao`,
`inervacao`, `irrigacao`, `tipo`, `articulacoes`, `acidentes`, `relacoes`,
`curiosidade`. Ossos e vísceras usam os que fizerem sentido.

### Criar uma ficha nova

1. Descubra as peças do modelo que ela representa — o nome em inglês de cada
   peça está em `src/data/generated/manifesto.json` (campo `nomeEn`).
2. Escreva a ficha com o campo `pecas`, uma lista de expressões regulares
   aplicadas a esses nomes (só casam peças do mesmo `sistema`).
3. Rode `npm run data:resolver`: ele preenche `fmaIds` e avisa se alguma
   expressão não casou com nada.
4. `npm test` confere que nenhuma peça ficou órfã ou disputada por duas fichas.

Peças que nenhuma ficha reivindicar continuam clicáveis: recebem
automaticamente o nome PT/latim da TA2 e aparecem marcadas como "descrição
pendente".

## Regerar os modelos 3D

O pipeline baixa os STL do BodyParts3D, simplifica e empacota um `.glb` por
sistema. Só é necessário para mudar o escopo ou o nível de detalhe.

```bash
npm run models         # ~1,2 GB baixados (fica em .cache/), gera public/models/*.glb
npm run models:terms   # recalcula src/data/generated/termos.json
```

- `scripts/sistemas.mjs` — quais sistemas existem, a raiz FMA de cada um e as
  atribuições manuais que corrigem classificações pouco didáticas da ontologia
  (por exemplo, a mandíbula sob o sistema alimentar).
- `scripts/build-models.mjs` — orçamento de triângulos por peça (`RAZAO`,
  `PISO`, `TETO`), cores das camadas e a transformação global mm → metros.

Estado atual: **15,5 MB** de `.glb` somados, 2,28 milhões de triângulos,
compressão `EXT_meshopt_compression`.

| Sistema | Peças | Tamanho |
| --- | ---: | ---: |
| Muscular | 436 | 9,44 MB |
| Esquelético | 248 | 2,56 MB |
| Nervoso | 98 | 1,53 MB |
| Circulatório | 65 | 0,50 MB |
| Digestório | 46 | 0,56 MB |
| Tegumentar | 4 | 0,36 MB |
| Respiratório | 10 | 0,30 MB |
| Demais (genital, urinário, endócrino, linfático, sentidos) | 27 | 0,26 MB |

## Publicando

### GitHub Pages — fidelidade total

`.github/workflows/pages.yml` faz build e publica `dist/` a cada push. Só é
preciso habilitar uma vez: **Settings → Pages → Source: GitHub Actions**. A
partir daí o atlas fica em `https://<usuário>.github.io/AnatoStudy/`, com os
16,3 MB de modelos e todo o detalhe.

### Página única autocontida

`npm run artefato` gera `.cache/artefato/anatostudy.html`: **um** arquivo com
JS, CSS e os doze `.glb` embutidos como `data:` URI, sem nenhuma dependência
externa. Serve para hospedagens que só aceitam um arquivo, ou para abrir o
atlas offline.

Como tudo viaja dentro da página, essa versão usa o perfil leve do pipeline
(`PERFIL=leve`, ~6,9 MB de modelos em vez de 16,3 MB) e o script falha se o
HTML passar de 15 MB. A malha é menos densa; o conjunto de 934 estruturas, as
fichas e a interface são idênticos.

## Stack

React 19 · TypeScript · Vite · react-three-fiber + drei (three.js) ·
Tailwind CSS 4 · zustand · Fuse.js · vitest.
Pipeline de assets: gltf-transform + meshoptimizer.

## Licenças

- Código: MIT ([`LICENSE`](LICENSE)).
- Modelos 3D, nomenclatura e textos das fichas: CC BY-SA — ver
  [`LICENSE-CONTENT.md`](LICENSE-CONTENT.md) e [`NOTICE.md`](NOTICE.md).

Material de estudo; não substitui atlas, dissecção ou orientação profissional.
