import { useAtlas } from '../store/useAtlas'
import { estruturas } from '../data'

export function Sobre() {
  const aberto = useAtlas((e) => e.sobreAberto)
  const abrirSobre = useAtlas((e) => e.abrirSobre)
  if (!aberto) return null

  const curadas = estruturas.filter((e) => !e.gerada).length

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4"
      role="dialog"
      aria-modal="true"
      onClick={() => abrirSobre(false)}
    >
      <div
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 p-6 text-sm text-slate-300"
        onClick={(evento) => evento.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-semibold text-slate-100">Sobre o AnatoStudy</h2>
          <button
            type="button"
            onClick={() => abrirSobre(false)}
            className="rounded p-1 text-slate-400 hover:bg-slate-800"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <p className="mt-3">
          Atlas interativo de anatomia humana. O modelo 3D traz {estruturas.length} estruturas
          distribuídas em camadas por sistema, sendo {curadas} com ficha redigida em português.
        </p>

        <h3 className="mt-5 font-semibold text-slate-100">Modelo 3D</h3>
        <p className="mt-1">
          A geometria vem do <strong>BodyParts3D/Anatomography</strong>, banco de estruturas
          anatômicas segmentadas de um único corpo, produzido pelo Database Center for Life Science
          (DBCLS), Japão.
        </p>
        <p className="mt-2 rounded-md bg-slate-950 p-3 text-xs text-slate-400">
          BodyParts3D, © The Database Center for Life Science, licenciado sob CC Attribution-Share
          Alike 2.1 Japan. Mitsuhashi N. et al., <em>BodyParts3D: 3D structure database for
          anatomical concepts</em>, Nucleic Acids Res. 2009;37:D782-5.
        </p>

        <h3 className="mt-5 font-semibold text-slate-100">Nomenclatura</h3>
        <p className="mt-1">
          Os nomes em português e latim seguem a <strong>Terminologia Anatomica 2 (TA2)</strong>, a
          partir da tabela multilíngue publicada pelo projeto <strong>Z-Anatomy</strong> (CC BY-SA
          4.0).
        </p>

        <h3 className="mt-5 font-semibold text-slate-100">Uso</h3>
        <ul className="mt-1 list-disc space-y-1 pl-5">
          <li>Arrastar: girar · rolagem: zoom · botão direito/dois dedos: deslocar</li>
          <li>Clique numa estrutura para abrir a ficha; <kbd>Esc</kbd> limpa a seleção</li>
          <li><kbd>/</kbd> vai para a busca</li>
        </ul>

        <p className="mt-5 text-xs text-slate-500">
          Material de estudo. Não substitui atlas, dissecção ou orientação profissional.
        </p>
      </div>
    </div>
  )
}
