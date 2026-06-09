/**
 * Sprites locais em `public/sprits/` (baixados com `npm run sprites:download`).
 * URLs relativas à origem do app — sem chamadas à PokéAPI/GitHub no carregamento da imagem.
 *
 * Em produção com homepage, use `process.env.PUBLIC_URL` (CRA injeta automaticamente).
 */
export type PokemonSpriteVariant = 'default' | 'shine';

const basePath = () => (process.env.PUBLIC_URL ?? '').replace(/\/$/, '');

/**
 * Caminho público para o PNG local, ex.: `/sprits/default/25.png`
 */
export function pokemonSpriteUrl(id: number, variant: PokemonSpriteVariant = 'default'): string {
  const folder = variant === 'default' ? 'default' : 'shine';
  return `${basePath()}/sprits/${folder}/${id}.png`;
}
