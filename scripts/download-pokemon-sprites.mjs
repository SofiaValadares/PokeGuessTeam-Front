/**
 * Baixa sprites oficiais do repositório PokeAPI para o frontend (assets estáticos).
 * Servidos em /sprits/... pelo CRA — mesma origem, sem CDN externa no runtime.
 *
 * Os PNGs em public/sprits/ podem (e normalmente devem) ser commitados no Git,
 * mesmo que aumentem o tamanho do repositório — assim o clone já traz tudo.
 *
 * https://pokeapi.co/
 *
 * Saída:
 *   public/sprits/default/[id].png
 *   public/sprits/shine/[id].png
 *
 * Uso:
 *   npm run sprites:download
 *   npm run sprites:download -- --force          (sobrescreve tudo)
 *   npm run sprites:download -- --ensure         (só roda se poucos arquivos; prestart/prebuild)
 */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', 'public', 'sprits');
const DEFAULT_DIR = path.join(ROOT, 'default');
const SHINE_DIR = path.join(ROOT, 'shine');

const MIN_FILES_TO_SKIP_ENSURE = 1200;

const args = new Set(process.argv.slice(2));
const force = args.has('--force');
const ensure = args.has('--ensure');

const spriteUrl = (id) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
const shinyUrl = (id) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${id}.png`;

async function countPngs(dir) {
  try {
    const names = await fs.readdir(dir);
    return names.filter((n) => n.endsWith('.png')).length;
  } catch {
    return 0;
  }
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
  return res.json();
}

async function listAllPokemonUrls() {
  const results = [];
  let next = 'https://pokeapi.co/api/v2/pokemon?limit=500';
  while (next) {
    const data = await fetchJson(next);
    results.push(...data.results);
    process.stdout.write(`\rListando… ${results.length} entradas`);
    next = data.next;
  }
  process.stdout.write('\n');
  return results;
}

function idFromUrl(url) {
  const m = String(url).replace(/\/$/, '').match(/\/pokemon\/(\d+)$/);
  if (!m) throw new Error(`URL inesperada: ${url}`);
  return parseInt(m[1], 10);
}

async function downloadPng(url, dest, { skipIfExists }) {
  if (skipIfExists && !force) {
    try {
      const st = await fs.stat(dest);
      if (st.size > 64) return { ok: true, skipped: true };
    } catch {
      /* ausente */
    }
  }
  const res = await fetch(url);
  if (!res.ok) return { ok: false, skipped: false };
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(dest, buf);
  return { ok: true, skipped: false };
}

async function main() {
  if (process.env.SKIP_SPRITE_ENSURE === '1' && ensure) {
    console.log('SKIP_SPRITE_ENSURE=1 — pulando verificação de sprites.');
    return;
  }

  await fs.mkdir(DEFAULT_DIR, { recursive: true });
  await fs.mkdir(SHINE_DIR, { recursive: true });

  if (ensure) {
    const n = await countPngs(DEFAULT_DIR);
    if (n >= MIN_FILES_TO_SKIP_ENSURE) {
      console.log(
        `Sprites locais OK (${n} PNGs em public/sprits/default/). Nada a baixar. Use --force para refazer.`,
      );
      return;
    }
    console.log(`Sprites incompletos (${n} em default/). Atualizando via API…`);
  }

  const skipIfExists = !force;
  const results = await listAllPokemonUrls();
  const ids = [...new Set(results.map((r) => idFromUrl(r.url)))].sort((a, b) => a - b);

  console.log(`IDs únicos: ${ids.length}`);

  const concurrency = 12;
  let done = 0;
  let defaultOk = 0;
  let defaultSkipped = 0;
  let shinyOk = 0;
  let shinySkipped = 0;
  let defaultMissing = 0;
  let shinyMissing = 0;

  for (let i = 0; i < ids.length; i += concurrency) {
    const chunk = ids.slice(i, i + concurrency);
    await Promise.all(
      chunk.map(async (id) => {
        const dPath = path.join(DEFAULT_DIR, `${id}.png`);
        const sPath = path.join(SHINE_DIR, `${id}.png`);

        const d = await downloadPng(spriteUrl(id), dPath, { skipIfExists });
        if (d.skipped) defaultSkipped++;
        else if (d.ok) defaultOk++;
        else defaultMissing++;

        const s = await downloadPng(shinyUrl(id), sPath, { skipIfExists });
        if (s.skipped) shinySkipped++;
        else if (s.ok) shinyOk++;
        else {
          shinyMissing++;
          try {
            await fs.unlink(sPath);
          } catch {
            /* noop */
          }
        }

        done++;
      }),
    );
    process.stdout.write(`\rProcessando… ${done}/${ids.length}`);
  }
  process.stdout.write('\n');

  console.log(
    JSON.stringify(
      {
        defaultNovos: defaultOk,
        defaultJaExistiam: defaultSkipped,
        defaultFaltandoNoRepo: defaultMissing,
        shineNovos: shinyOk,
        shineJaExistiam: shinySkipped,
        shineFaltandoNoRepo: shinyMissing,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  if (ensure) {
    console.warn('Aviso: sprites não atualizados (rede ou API). Continue com os arquivos já em public/sprits/.');
    console.warn(err.message || err);
    process.exit(0);
  }
  console.error(err);
  process.exit(1);
});
