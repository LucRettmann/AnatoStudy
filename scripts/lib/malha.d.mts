export declare function lerStlBinario(buffer: Uint8Array): { posicoes: Float32Array; nTri: number }
export declare function soldar(posicoes: Float32Array): Uint32Array
export declare function compactar(
  indices: Uint32Array,
  posicoes: Float32Array,
): { indices: Uint32Array; posicoes: Float32Array }
export declare function calcularNormais(indices: Uint32Array, posicoes: Float32Array): Float32Array
export declare function prepararMalha(
  buffer: Uint8Array,
  alvoTriangulos: number,
  erroAlvo?: number,
): Promise<{
  indices: Uint32Array
  posicoes: Float32Array
  normais: Float32Array
  trianguloOriginal: number
  triangulos: number
}>
