import { useState } from 'react'
import { estruturaPorId, pecaPorFma, sistemaPorId } from '../data'
import type { Estrutura } from '../data/tipos'
import { useAtlas } from '../store/useAtlas'

function Campo({ rotulo, valor }: { rotulo: string; valor?: string }) {
  if (!valor) return null
  return (
    <div className="border-t border-slate-800 py-3">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-sky-400">{rotulo}</dt>
      <dd className="mt-1 text-sm leading-relaxed text-slate-200">{valor}</dd>
    </div>
  )
}

/** Lista as peças 3D que compõem a ficha, com o nome próprio de cada uma. */
function Pecas({ estrutura }: { estrutura: Estrutura }) {
  const [aberto, setAberto] = useState(false)
  const pecaFocada = useAtlas((e) => e.pecaFocada)
  const selecionar = useAtlas((e) => e.selecionar)

  if (estrutura.fmaIds.length < 2) return null

  return (
    <div className="mt-4 border-t border-slate-800 pt-3">
      <button
        type="button"
        onClick={() => setAberto(!aberto)}
        className="flex w-full items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-sky-400"
      >
        <span>Peças no modelo ({estrutura.fmaIds.length})</span>
        <span aria-hidden="true">{aberto ? '▾' : '▸'}</span>
      </button>
      {aberto && (
        <ul className="mt-2 max-h-64 overflow-y-auto">
          {estrutura.fmaIds.map((fmaId) => {
            const peca = pecaPorFma.get(fmaId)
            if (!peca) return null
            return (
              <li key={fmaId}>
                <button
                  type="button"
                  onClick={() => selecionar(estrutura.id, { enquadrar: true, peca: fmaId })}
                  className={`w-full truncate rounded px-2 py-1 text-left text-xs hover:bg-slate-800 ${
                    pecaFocada === fmaId ? 'bg-sky-500/15 text-sky-200' : 'text-slate-400'
                  }`}
                  title={peca.nomeLatim ?? peca.nomeIngles}
                >
                  {peca.nome}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function Conteudo({ estrutura }: { estrutura: Estrutura }) {
  const sistema = sistemaPorId.get(estrutura.sistema)
  const enquadrar = useAtlas((e) => e.enquadrar)
  const pecaFocada = useAtlas((e) => e.pecaFocada)
  const peca = pecaFocada ? pecaPorFma.get(pecaFocada) : undefined

  return (
    <div className="px-4 pb-8">
      <div className="flex items-center gap-2 pt-4">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: sistema?.cor }}
          aria-hidden="true"
        />
        <span className="text-[11px] uppercase tracking-wide text-slate-400">{sistema?.nome}</span>
      </div>

      <h2 className="mt-1 text-xl font-semibold text-slate-50">{estrutura.nome}</h2>
      {estrutura.nomeLatim && <p className="text-sm italic text-slate-400">{estrutura.nomeLatim}</p>}

      {peca && estrutura.fmaIds.length > 1 && (
        <p className="mt-2 rounded-md bg-slate-900 px-3 py-2 text-xs text-slate-300 ring-1 ring-slate-800">
          Peça selecionada: <span className="text-slate-100">{peca.nome}</span>
          {peca.nomeLatim && <span className="ml-1 italic text-slate-400">({peca.nomeLatim})</span>}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => enquadrar(estrutura.id, pecaFocada)}
          className="rounded-md bg-sky-500 px-3 py-1.5 text-xs font-medium text-slate-950 hover:bg-sky-400"
        >
          Centralizar no modelo
        </button>
        <span className="rounded-md px-2 py-1.5 text-[11px] text-slate-500 ring-1 ring-slate-800">
          {pecaFocada ?? estrutura.fmaIds[0]}
        </span>
      </div>

      {estrutura.gerada && (
        <p className="mt-3 rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-200 ring-1 ring-amber-500/30">
          Ficha ainda sem descrição redigida. O nome vem da Terminologia Anatomica; a descrição pode
          ser acrescentada no arquivo JSON do sistema.
        </p>
      )}

      <dl className="mt-4">
        <Campo rotulo="Localização" valor={estrutura.localizacao} />
        <Campo rotulo="Função" valor={estrutura.funcao} />
        <Campo rotulo="Origem" valor={estrutura.origem} />
        <Campo rotulo="Inserção" valor={estrutura.insercao} />
        <Campo rotulo="Ação" valor={estrutura.acao} />
        <Campo rotulo="Inervação" valor={estrutura.inervacao} />
        <Campo rotulo="Irrigação" valor={estrutura.irrigacao} />
        <Campo rotulo="Tipo" valor={estrutura.tipo} />
        <Campo rotulo="Articulações" valor={estrutura.articulacoes} />
        <Campo rotulo="Acidentes anatômicos" valor={estrutura.acidentes} />
        <Campo rotulo="Relações" valor={estrutura.relacoes} />
        <Campo rotulo="Para lembrar" valor={estrutura.curiosidade} />
      </dl>

      {estrutura.sinonimos && estrutura.sinonimos.length > 0 && (
        <p className="mt-3 text-xs text-slate-500">Sinônimos: {estrutura.sinonimos.join(', ')}</p>
      )}

      <Pecas estrutura={estrutura} />
    </div>
  )
}

export function PainelDetalhe() {
  const selecionada = useAtlas((e) => e.selecionada)
  const selecionar = useAtlas((e) => e.selecionar)
  const estrutura = selecionada ? estruturaPorId.get(selecionada) : undefined

  if (!estrutura) {
    return (
      <div className="hidden h-full flex-col justify-center px-6 text-center text-sm text-slate-500 lg:flex">
        <p>Clique em uma estrutura do modelo — ou use a busca — para ver a ficha aqui.</p>
      </div>
    )
  }

  return (
    <div className="relative h-full overflow-y-auto">
      <button
        type="button"
        onClick={() => selecionar(null)}
        className="absolute right-3 top-3 rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
        aria-label="Fechar ficha"
      >
        ✕
      </button>
      <Conteudo estrutura={estrutura} />
    </div>
  )
}
