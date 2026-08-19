import { useEffect, useMemo, useRef, useState } from 'react'
import { buscar } from '../lib/busca'
import { estruturaPorId, sistemaPorId } from '../data'
import { useAtlas } from '../store/useAtlas'

export function BarraSuperior() {
  const busca = useAtlas((e) => e.busca)
  const definirBusca = useAtlas((e) => e.definirBusca)
  const definirDestaques = useAtlas((e) => e.definirDestaques)
  const selecionar = useAtlas((e) => e.selecionar)
  const abrirMenu = useAtlas((e) => e.abrirMenu)
  const abrirSobre = useAtlas((e) => e.abrirSobre)
  const menuAberto = useAtlas((e) => e.menuAberto)

  const [aberto, setAberto] = useState(false)
  const campo = useRef<HTMLInputElement>(null)

  const resultados = useMemo(() => buscar(busca), [busca])

  useEffect(() => {
    definirDestaques(
      resultados.flatMap((r) => (r.fmaId ? [r.fmaId] : (estruturaPorId.get(r.estruturaId)?.fmaIds ?? []))),
    )
  }, [resultados, definirDestaques])

  useEffect(() => {
    const atalho = (evento: KeyboardEvent) => {
      if (evento.key === '/' && document.activeElement !== campo.current) {
        evento.preventDefault()
        campo.current?.focus()
      }
      if (evento.key === 'Escape') {
        setAberto(false)
        campo.current?.blur()
      }
    }
    window.addEventListener('keydown', atalho)
    return () => window.removeEventListener('keydown', atalho)
  }, [])

  return (
    <header className="relative z-30 flex items-center gap-3 border-b border-slate-800 bg-slate-950/95 px-3 py-2 backdrop-blur sm:px-4">
      <button
        type="button"
        onClick={() => abrirMenu(!menuAberto)}
        className="rounded-md p-2 text-slate-300 ring-1 ring-slate-700 hover:bg-slate-800 lg:hidden"
        aria-label="Abrir lista de sistemas"
      >
        <svg viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor" aria-hidden="true">
          <path d="M3 5h14v2H3zM3 9h14v2H3zM3 13h14v2H3z" />
        </svg>
      </button>

      <div className="flex items-baseline gap-2">
        <span className="text-lg font-semibold tracking-tight text-slate-100">AnatoStudy</span>
        <span className="hidden text-xs text-slate-400 sm:inline">atlas interativo de anatomia</span>
      </div>

      <div className="relative ml-auto w-full max-w-md">
        <input
          ref={campo}
          value={busca}
          onChange={(evento) => {
            definirBusca(evento.target.value)
            setAberto(true)
          }}
          onFocus={() => setAberto(true)}
          onBlur={() => window.setTimeout(() => setAberto(false), 150)}
          placeholder="Buscar estrutura (tecle / )"
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
          aria-label="Buscar estrutura anatômica"
        />
        {aberto && resultados.length > 0 && (
          <ul className="absolute inset-x-0 top-full mt-1 max-h-96 overflow-y-auto rounded-lg border border-slate-700 bg-slate-900 py-1 shadow-xl">
            {resultados.map((resultado) => (
              <li key={resultado.chave}>
                <button
                  type="button"
                  onMouseDown={(evento) => evento.preventDefault()}
                  onClick={() => {
                    selecionar(resultado.estruturaId, { enquadrar: true, peca: resultado.fmaId })
                    setAberto(false)
                  }}
                  className="flex w-full items-baseline justify-between gap-3 px-3 py-1.5 text-left hover:bg-slate-800"
                >
                  <span className="truncate text-sm text-slate-100">
                    {!resultado.ficha && <span className="mr-1 text-slate-500">↳</span>}
                    {resultado.nome}
                    {resultado.nomeLatim && (
                      <span className="ml-2 text-xs italic text-slate-400">{resultado.nomeLatim}</span>
                    )}
                  </span>
                  <span className="shrink-0 text-[11px] uppercase tracking-wide text-slate-500">
                    {sistemaPorId.get(resultado.sistema)?.nome}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="button"
        onClick={() => abrirSobre(true)}
        className="hidden rounded-md px-3 py-2 text-sm text-slate-300 ring-1 ring-slate-700 hover:bg-slate-800 sm:block"
      >
        Sobre
      </button>
    </header>
  )
}
