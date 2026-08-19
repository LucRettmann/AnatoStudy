# Atribuições

O código do AnatoStudy é MIT (ver `LICENSE`). O **conteúdo** — modelos 3D e
nomenclatura — é derivado de bases externas com licença *share alike* e está
sujeito a `LICENSE-CONTENT.md`.

## Modelos 3D — `public/models/*.glb`

> BodyParts3D, © The Database Center for Life Science, licenciado sob
> CC Attribution-Share Alike 2.1 Japan.

Fonte: BodyParts3D/Anatomography, versão 3.0 (`20110915`), obtida do espelho
público <https://github.com/Kevin-Mattheus-Moerman/BodyParts3D>.

Os arquivos `.glb` deste repositório são **obras derivadas**: as malhas
originais em STL foram soldadas, simplificadas (meshoptimizer), quantizadas,
convertidas para o referencial glTF e agrupadas por sistema corporal pelo
script `scripts/build-models.mjs`.

Citação da base:

> Mitsuhashi N, Fujieda K, Tamura T, Kawamoto S, Takagi T, Okubo K.
> *BodyParts3D: 3D structure database for anatomical concepts.*
> Nucleic Acids Research. 2009 Jan;37(Database issue):D782-5.
> <https://doi.org/10.1093/nar/gkn613>
>
> DOI do arquivo de dados: <http://doi.org/10.18908/lsdba.nbdc00837-000>

## Nomenclatura — `src/data/generated/termos.json`

Os nomes em português e latim vêm da **Terminologia Anatomica 2 (TA2)**, a
partir da tabela multilíngue `TA2.csv` publicada pelo projeto
[Z-Anatomy](https://github.com/Z-Anatomy/Models-of-human-anatomy), licenciada
sob **CC BY-SA 4.0**.

Nomes que não têm entrada direta na TA2 foram completados por regras
determinísticas (`scripts/lib/regras-termos.mjs`) e por um dicionário conferido
à mão (`scripts/termos-manuais.json`).

## Textos das fichas — `src/data/*.json`

Os campos redigidos (localização, função, origem, inserção, ação, inervação,
irrigação e afins) são texto original escrito para este projeto e distribuído
sob a mesma licença do conteúdo, **CC BY-SA 4.0**.
