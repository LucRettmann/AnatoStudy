import { useEffect } from 'react'
import { Cena } from './scene/Cena'
import { BarraSuperior } from './ui/BarraSuperior'
import { PainelSistemas } from './ui/PainelSistemas'
import { PainelDetalhe } from './ui/PainelDetalhe'
import { Sobre } from './ui/Sobre'
import { useAtlas } from './store/useAtlas'
import { estruturaPorId } from './data'

/** Compartilhamento por link: #/estrutura/<id>. */
function useHash() {
  const selecionar = useAtlas((e) => e.selecionar)
  const selecionada = useAtlas((e) => e.selecionada)

  useEffect(() => {
    const aplicar = () => {
      const achado = window.location.hash.match(/^#\/estrutura\/(.+)$/)
      const id = achado ? decodeURIComponent(achado[1]) : null
      if (id && estruturaPorId.has(id) && id !== useAtlas.getState().selecionada) {
        selecionar(id, { enquadrar: true })
      }
    }
    aplicar()
    window.addEventListener('hashchange', aplicar)
    return () => window.removeEventListener('hashchange', aplicar)
  }, [selecionar])

  useEffect(() => {
    const desejado = selecionada ? `#/estrutura/${encodeURIComponent(selecionada)}` : ''
    if (window.location.hash !== desejado) {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${desejado}`)
    }
  }, [selecionada])
}

export default function App() {
  const menuAberto = useAtlas((e) => e.menuAberto)
  const abrirMenu = useAtlas((e) => e.abrirMenu)
  const selecionada = useAtlas((e) => e.selecionada)
  const selecionar = useAtlas((e) => e.selecionar)
  useHash()

  useEffect(() => {
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') selecionar(null)
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [selecionar])

  return (
    <div className="flex h-dvh flex-col bg-slate-950 text-slate-100">
      <BarraSuperior />

      <div className="relative flex min-h-0 flex-1">
        {/* Lista de sistemas: coluna fixa no desktop, gaveta no celular. */}
        <aside className="hidden w-80 shrink-0 border-r border-slate-800 bg-slate-950 lg:block">
          <PainelSistemas />
        </aside>

        {menuAberto && (
          <div className="absolute inset-0 z-20 flex lg:hidden">
            <div className="w-80 max-w-[85%] border-r border-slate-800 bg-slate-950">
              <PainelSistemas />
            </div>
            <button
              type="button"
              className="flex-1 bg-slate-950/60"
              onClick={() => abrirMenu(false)}
              aria-label="Fechar lista de sistemas"
            />
          </div>
        )}

        <main className="relative min-w-0 flex-1">
          <Cena />
          <p className="pointer-events-none absolute bottom-2 left-2 z-10 max-w-[60%] rounded bg-slate-950/70 px-2 py-1 text-[10px] leading-tight text-slate-500">
            BodyParts3D © DBCLS · CC BY-SA 2.1 JP
          </p>
        </main>

        <aside className="hidden w-96 shrink-0 border-l border-slate-800 bg-slate-950 lg:block">
          <PainelDetalhe />
        </aside>

        {/* No celular a ficha vira uma folha inferior. */}
        {selecionada && (
          <div className="absolute inset-x-0 bottom-0 z-20 max-h-[60%] overflow-y-auto rounded-t-2xl border-t border-slate-700 bg-slate-950 shadow-2xl lg:hidden">
            <PainelDetalhe />
          </div>
        )}
      </div>

      <Sobre />
    </div>
  )
}
