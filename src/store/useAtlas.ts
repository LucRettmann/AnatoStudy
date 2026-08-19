import { create } from 'zustand'
import { estruturaPorId, pecaPorFma, sistemas } from '../data'

export interface Foco {
  centro: [number, number, number]
  extensao: number
  seq: number
}

interface Estado {
  visiveis: Record<string, boolean>
  opacidade: Record<string, number>
  isolado: string | null

  selecionada: string | null
  /** Peça específica clicada dentro da ficha selecionada (FMAID). */
  pecaFocada: string | null
  hover: string | null
  destacados: Set<string>

  busca: string
  foco: Foco | null
  menuAberto: boolean
  sobreAberto: boolean

  alternarSistema: (id: string) => void
  definirOpacidade: (id: string, valor: number) => void
  alternarIsolamento: (id: string) => void
  selecionar: (
    idEstrutura: string | null,
    opcoes?: { enquadrar?: boolean; peca?: string | null },
  ) => void
  definirHover: (idEstrutura: string | null) => void
  definirBusca: (texto: string) => void
  definirDestaques: (fmaIds: string[]) => void
  enquadrar: (idEstrutura: string, fmaId?: string | null) => void
  abrirMenu: (aberto: boolean) => void
  abrirSobre: (aberto: boolean) => void
}

const visiveisIniciais = Object.fromEntries(sistemas.map((s) => [s.id, s.visivelPorPadrao]))
const opacidadesIniciais = Object.fromEntries(sistemas.map((s) => [s.id, 1]))

let sequencia = 0

export const useAtlas = create<Estado>((set, get) => ({
  visiveis: visiveisIniciais,
  opacidade: opacidadesIniciais,
  isolado: null,

  selecionada: null,
  pecaFocada: null,
  hover: null,
  destacados: new Set<string>(),

  busca: '',
  foco: null,
  menuAberto: false,
  sobreAberto: false,

  alternarSistema: (id) =>
    set((e) => ({
      visiveis: { ...e.visiveis, [id]: !e.visiveis[id] },
      isolado: e.isolado === id && e.visiveis[id] ? null : e.isolado,
    })),

  definirOpacidade: (id, valor) => set((e) => ({ opacidade: { ...e.opacidade, [id]: valor } })),

  alternarIsolamento: (id) =>
    set((e) => ({
      isolado: e.isolado === id ? null : id,
      visiveis: e.isolado === id ? e.visiveis : { ...e.visiveis, [id]: true },
    })),

  selecionar: (idEstrutura, opcoes) => {
    if (!idEstrutura) {
      set({ selecionada: null, pecaFocada: null })
      return
    }
    const estrutura = estruturaPorId.get(idEstrutura)
    if (!estrutura) return
    set((e) => ({
      selecionada: idEstrutura,
      pecaFocada: opcoes?.peca ?? null,
      // Selecionar algo de uma camada desligada acende essa camada.
      visiveis: { ...e.visiveis, [estrutura.sistema]: true },
      isolado: e.isolado && e.isolado !== estrutura.sistema ? null : e.isolado,
    }))
    if (opcoes?.enquadrar) get().enquadrar(idEstrutura, opcoes.peca ?? null)
  },

  definirHover: (idEstrutura) => set({ hover: idEstrutura }),
  definirBusca: (texto) => set({ busca: texto }),
  definirDestaques: (fmaIds) => set({ destacados: new Set(fmaIds) }),

  enquadrar: (idEstrutura, fmaId) => {
    const alvo = (fmaId && pecaPorFma.get(fmaId)) || estruturaPorId.get(idEstrutura)
    if (!alvo) return
    set({ foco: { centro: alvo.centro, extensao: alvo.extensao, seq: ++sequencia } })
  },

  abrirMenu: (aberto) => set({ menuAberto: aberto }),
  abrirSobre: (aberto) => set({ sobreAberto: aberto }),
}))

/** Sistemas efetivamente renderizados, considerando o modo "isolar". */
export function sistemasVisiveis(estado: Estado): string[] {
  if (estado.isolado) return [estado.isolado]
  return sistemas.filter((s) => estado.visiveis[s.id]).map((s) => s.id)
}
