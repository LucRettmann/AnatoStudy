import { z } from 'zod'

/**
 * Schema das fichas curadas. Usado nos testes para garantir que edições manuais
 * nos JSON continuem válidas.
 */
export const fichaSchema = z
  .object({
    id: z.string().min(1),
    sistema: z.string().min(1),
    nome: z.string().min(1),
    nomeLatim: z.string().optional(),
    nomeIngles: z.string().optional(),
    sinonimos: z.array(z.string()).optional(),
    fmaIds: z.array(z.string()).min(1),
    /** Expressões regulares usadas por `npm run data:resolver` para obter fmaIds. */
    pecas: z.array(z.string()).optional(),

    localizacao: z.string().optional(),
    funcao: z.string().optional(),
    origem: z.string().optional(),
    insercao: z.string().optional(),
    acao: z.string().optional(),
    inervacao: z.string().optional(),
    irrigacao: z.string().optional(),
    tipo: z.string().optional(),
    articulacoes: z.string().optional(),
    acidentes: z.string().optional(),
    relacoes: z.string().optional(),
    curiosidade: z.string().optional(),
  })
  .strict()

export const sistemaSchema = z
  .object({
    id: z.string().min(1),
    nome: z.string().min(1),
    nomeLatim: z.string().min(1),
    descricao: z.string().min(1),
    cor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    visivelPorPadrao: z.boolean(),
  })
  .strict()
