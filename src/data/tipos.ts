/** Um sistema corporal — uma camada independente do modelo 3D. */
export interface Sistema {
  id: string
  nome: string
  nomeLatim: string
  descricao: string
  cor: string
  visivelPorPadrao: boolean
  /** Caminho do .glb, vindo do manifesto gerado pelo pipeline. */
  arquivo: string
  totalPecas: number
}

/**
 * Ficha de uma estrutura anatômica. É a unidade exibida na lista, na busca e no
 * painel lateral. Uma ficha pode agrupar várias peças do modelo 3D (`fmaIds`) —
 * por exemplo, o trapézio reúne as partes descendente, transversa e ascendente
 * dos dois lados.
 */
export interface Estrutura {
  id: string
  sistema: string
  nome: string
  nomeLatim?: string
  nomeIngles?: string
  sinonimos?: string[]
  fmaIds: string[]

  localizacao?: string
  funcao?: string
  /** Músculos */
  origem?: string
  insercao?: string
  acao?: string
  inervacao?: string
  /** Ossos */
  tipo?: string
  articulacoes?: string
  acidentes?: string
  /** Vísceras e vasos */
  irrigacao?: string
  relacoes?: string
  curiosidade?: string

  /** true quando a ficha veio do gerador (só nome/latim), sem texto redigido. */
  gerada: boolean
  /** Centro geométrico no espaço do modelo, usado para enquadrar a câmera. */
  centro: [number, number, number]
  /** Maior dimensão da caixa envolvente, usada para calcular a distância da câmera. */
  extensao: number
}

export interface EntradaCurada extends Partial<Omit<Estrutura, 'gerada' | 'centro' | 'extensao'>> {
  id: string
  sistema: string
  nome: string
  fmaIds: string[]
}
