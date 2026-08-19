import { useState } from 'react'
import { estruturasPorSistema, sistemas } from '../data'
import { useAtlas } from '../store/useAtlas'

function ListaEstruturas({ sistemaId }: { sistemaId: string }) {
  const [filtro, setFiltro] = useState('')
  const selecionar = useAtlas((e) => e.selecionar)
  const selecionada = useAtlas((e) => e.selecionada)
  const definirHover = useAtlas((e) => e.definirHover)

  const todas = estruturasPorSistema.get(sistemaId) ?? []
  const visiveis = filtro
    ? todas.filter((e) => `${e.nome} ${e.nomeLatim ?? ''}`.toLowerCase().includes(filtro.toLowerCase()))
    : todas

  return (
    <div className="mt-2 border-l border-slate-800 pl-3">
      <input
        value={filtro}
        onChange={(evento) => setFiltro(evento.target.value)}
        placeholder={`Filtrar ${todas.length} estruturas…`}
        className="mb-2 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-200 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
      />
      <ul className="max-h-72 overflow-y-auto pr-1">
        {visiveis.map((estrutura) => (
          <li key={estrutura.id}>
            <button
              type="button"
              onClick={() => selecionar(estrutura.id, { enquadrar: true })}
              onMouseEnter={() => definirHover(estrutura.id)}
              onMouseLeave={() => definirHover(null)}
              className={`w-full truncate rounded px-2 py-1 text-left text-xs hover:bg-slate-800 ${
                selecionada === estrutura.id ? 'bg-sky-500/15 text-sky-200' : 'text-slate-300'
              }`}
              title={estrutura.nomeLatim ?? estrutura.nome}
            >
              {estrutura.nome}
              {!estrutura.gerada && <span className="ml-1 text-[10px] text-emerald-400">•</span>}
            </button>
          </li>
        ))}
        {visiveis.length === 0 && <li className="px-2 py-1 text-xs text-slate-500">Nada encontrado.</li>}
      </ul>
    </div>
  )
}

export function PainelSistemas() {
  const visiveis = useAtlas((e) => e.visiveis)
  const opacidade = useAtlas((e) => e.opacidade)
  const isolado = useAtlas((e) => e.isolado)
  const alternarSistema = useAtlas((e) => e.alternarSistema)
  const definirOpacidade = useAtlas((e) => e.definirOpacidade)
  const alternarIsolamento = useAtlas((e) => e.alternarIsolamento)
  const [expandido, setExpandido] = useState<string | null>(null)

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-800 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-200">Sistemas</h2>
        <p className="mt-1 text-xs text-slate-400">
          Cada sistema é uma camada independente. Ligue, desligue e ajuste a transparência para
          estudar por planos.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2">
        {sistemas.map((sistema) => {
          const ligado = Boolean(visiveis[sistema.id])
          const isoladoAqui = isolado === sistema.id
          return (
            <section
              key={sistema.id}
              className={`mb-1 rounded-lg px-2 py-2 ${isoladoAqui ? 'bg-sky-500/10 ring-1 ring-sky-500/40' : ''}`}
            >
              <div className="flex items-center gap-2">
                <input
                  id={`sistema-${sistema.id}`}
                  type="checkbox"
                  checked={ligado}
                  onChange={() => alternarSistema(sistema.id)}
                  className="h-4 w-4 shrink-0 accent-sky-500"
                />
                <span
                  className="h-3 w-3 shrink-0 rounded-full ring-1 ring-black/30"
                  style={{ backgroundColor: sistema.cor }}
                  aria-hidden="true"
                />
                <label htmlFor={`sistema-${sistema.id}`} className="flex-1 cursor-pointer text-sm text-slate-100">
                  {sistema.nome}
                  <span className="ml-2 text-[11px] text-slate-500">{sistema.totalPecas}</span>
                </label>
                <button
                  type="button"
                  onClick={() => alternarIsolamento(sistema.id)}
                  className={`rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wide ring-1 ${
                    isoladoAqui
                      ? 'bg-sky-500 text-slate-950 ring-sky-400'
                      : 'text-slate-400 ring-slate-700 hover:bg-slate-800'
                  }`}
                  title="Mostrar somente esta camada"
                >
                  isolar
                </button>
                <button
                  type="button"
                  onClick={() => setExpandido(expandido === sistema.id ? null : sistema.id)}
                  className="rounded px-1 text-slate-400 hover:bg-slate-800"
                  aria-label={`Listar estruturas de ${sistema.nome}`}
                >
                  {expandido === sistema.id ? '▾' : '▸'}
                </button>
              </div>

              {ligado && (
                <div className="mt-2 flex items-center gap-2 pl-6">
                  <span className="text-[10px] uppercase tracking-wide text-slate-500">opacidade</span>
                  <input
                    type="range"
                    min={0.15}
                    max={1}
                    step={0.05}
                    value={opacidade[sistema.id] ?? 1}
                    onChange={(evento) => definirOpacidade(sistema.id, Number(evento.target.value))}
                    className="h-1 flex-1 accent-sky-500"
                    aria-label={`Opacidade do sistema ${sistema.nome}`}
                  />
                </div>
              )}

              {expandido === sistema.id && <ListaEstruturas sistemaId={sistema.id} />}
            </section>
          )
        })}
      </div>
    </div>
  )
}
