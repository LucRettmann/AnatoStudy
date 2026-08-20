/**
 * Resolve a URL de um arquivo .glb.
 *
 * Na versão autocontida do site (uma única página, publicada como Artifact),
 * os modelos viajam embutidos como `data:` URI em `window.__MODELOS__`, porque
 * a página não pode buscar nada de fora. No build normal, cai no caminho
 * servido a partir de `public/`.
 */
export function urlDoModelo(arquivo: string): string {
  const embutidos = (globalThis as { __MODELOS__?: Record<string, string> }).__MODELOS__
  return embutidos?.[arquivo] ?? `${import.meta.env.BASE_URL}${arquivo}`
}
