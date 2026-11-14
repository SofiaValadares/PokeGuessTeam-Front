import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, InlineAlert, TextField } from '../../ds';
import { ApiError } from '../../services/http';
import {
  labBruteForce,
  labDashboard,
  labDecrypt,
  labDifferential,
  labEncrypt,
  labScanAnomalies,
  labStatistical,
  labListSamples,
  labSampleDownloadUrl,
  labStegoAttack,
  labStegoEmbed,
  labStegoExtract,
  type AnomalyHit,
  type StegoSample,
  type BruteForceResponse,
  type DashboardResponse,
  type DecryptResponse,
  type DifferentialResponse,
  type EncryptResponse,
  type StatisticalResponse,
} from '../../services/securityLabService';
import { useAdminMode } from '../../store/providers/AdminModeProvider';
import styles from './admin-security-lab.module.css';

type Tab = 'objectives' | 'cipher' | 'stego' | 'stego-attack' | 'attacks' | 'anomalies' | 'dashboard';

const TABS: { id: Tab; label: string }[] = [
  { id: 'objectives', label: 'Objetivos' },
  { id: 'cipher', label: 'Cifragem' },
  { id: 'stego', label: 'Estego (gerar)' },
  { id: 'stego-attack', label: 'Ataque estego' },
  { id: 'attacks', label: 'Ataques cripto' },
  { id: 'anomalies', label: 'Anomalias' },
  { id: 'dashboard', label: 'Dashboard' },
];

type Objective = {
  id: string;
  title: string;
  goal: string;
  steps: string[];
  expect: string;
};

const TEST_OBJECTIVES: Objective[] = [
  {
    id: 'cipher-roundtrip',
    title: 'Cifragem didática — ida e volta',
    goal: 'Confirmar chave dinâmica + pipeline XOR / S-box / P-box / blocos no lab (não é o AES do jogo).',
    steps: [
      'Separador Cifragem: cifra um texto com uma seed.',
      'Guarda ciphertext, seed e nonce.',
      'Descriptografa com os mesmos valores e compara com o original.',
    ],
    expect: 'Texto recuperado igual ao original; fingerprint/nonce mudam se mudares a seed.',
  },
  {
    id: 'product-crypto',
    title: 'Cifragem do produto (observar)',
    goal: 'Registar que o jogo real usa AES-GCM+HMAC nas partidas e BCrypt nas senhas — o lab não os desliga.',
    steps: [
      'Joga uma partida bot/local até ao fim (equipa selada).',
      'Confirma no relatório/código que o commitment usa AES-GCM (não o cipher XOR).',
    ],
    expect: 'Documento: lab = didático; produção = AES/BCrypt intactos.',
  },
  {
    id: 'stego-avatar',
    title: 'Esteganografia no avatar',
    goal: 'Esconder e revelar mensagem no fluxo de perfil do jogador.',
    steps: [
      'Perfil → mensagem oculta + enviar imagem.',
      'Revelar mensagem no mesmo ecrã.',
      'Opcional: no lab, Ataque estego sobre a mesma imagem.',
    ],
    expect: 'Mensagem recuperada; evento STEGO_* no relatório Admin.',
  },
  {
    id: 'stego-samples',
    title: 'Estego com amostras do lab',
    goal: 'Usar imagens de teste do lab para embed/extract sem inventar ficheiros.',
    steps: [
      'Separador Estego: gera imagem com mensagem.',
      'Extrai a mensagem; descarrega uma amostra e testa extract/ataque.',
    ],
    expect: 'Extract coerente; falhas de extract malformado registadas se aplicável.',
  },
  {
    id: 'attack-brute',
    title: 'Ataque força bruta (lab controlado)',
    goal: 'Ver que só o espaço reduzido de bits é viável; chave de 256 bits é inviável.',
    steps: [
      'Ataques cripto → força bruta com bits baixos (ex. 12).',
      'Anota tentativas, tempo e mensagem de viabilidade.',
    ],
    expect: 'Ataque encontra a seed artificial; conclusão: chave completa inviável.',
  },
  {
    id: 'attack-diff-stat',
    title: 'Diferencial (avalanche) e estatístico',
    goal: 'Medir difusão/confusão do cipher didático.',
    steps: [
      'Corre ataque diferencial e anota % de avalanche.',
      'Corre ataque estatístico e anota χ² / se parece uniforme.',
    ],
    expect: 'Métricas numéricas para o relatório da cadeira.',
  },
  {
    id: 'lockout',
    title: 'Proteção de força bruta no login (produto)',
    goal: 'Validar lockout/rate limit — sem tentar partilhar exploits; só observar o comportamento.',
    steps: [
      'Em conta de teste, falha o login várias vezes.',
      'Observa bloqueio (429 / mensagem de lockout).',
      'Não uses isto contra contas reais de outras pessoas.',
    ],
    expect: 'Login fica temporariamente bloqueado; evidência para o relatório.',
  },
  {
    id: 'anomalies-admin',
    title: 'Anomalias e relatório Admin',
    goal: 'Scan de anomalias e consulta dos eventos gerados pelos testes.',
    steps: [
      'Lab → Anomalias: correr scan (ou Admin → Dashboard Anomalias).',
      'Admin → Relatório Ataques: filtra por tipo / só Lab.',
    ],
    expect: 'Eventos visíveis; anomalias aparecem se limiares forem atingidos.',
  },
];

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function BarChart({
  items,
}: {
  items: { label: string; value: number }[];
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className={styles.bars} role="img" aria-label="Gráfico de barras">
      {items.map((item) => (
        <div key={item.label} className={styles.barRow}>
          <span className={styles.barLabel}>{item.label}</span>
          <div className={styles.barTrack}>
            <div
              className={styles.barFill}
              style={{ width: `${Math.round((item.value / max) * 100)}%` }}
            />
          </div>
          <span className={styles.barValue}>{item.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminSecurityLabPage() {
  const { temporaryLabNotice } = useAdminMode();
  const [tab, setTab] = useState<Tab>('objectives');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Cipher
  const [plaintext, setPlaintext] = useState('Mensagem secreta do lab Pokémon');
  const [seed, setSeed] = useState('poke-seed-dinamica');
  const [enc, setEnc] = useState<EncryptResponse | null>(null);
  const [dec, setDec] = useState<DecryptResponse | null>(null);

  // Stego
  const [stegoMsg, setStegoMsg] = useState('pista escondida');
  const [stegoSrc, setStegoSrc] = useState<string | null>(null);
  const [stegoOut, setStegoOut] = useState<string | null>(null);
  const [stegoExtracted, setStegoExtracted] = useState<string | null>(null);
  const [stegoMeta, setStegoMeta] = useState<string | null>(null);
  const [samples, setSamples] = useState<StegoSample[]>([]);
  const [attackSrc, setAttackSrc] = useState<string | null>(null);
  const [attackResult, setAttackResult] = useState<string | null>(null);

  // Attacks
  const [attackPlain, setAttackPlain] = useState('Pikachu#25');
  const [bits, setBits] = useState(12);
  const [brute, setBrute] = useState<BruteForceResponse | null>(null);
  const [diff, setDiff] = useState<DifferentialResponse | null>(null);
  const [stat, setStat] = useState<StatisticalResponse | null>(null);

  // Anomalies / dashboard
  const [anomalyHits, setAnomalyHits] = useState<AnomalyHit[]>([]);
  const [dash, setDash] = useState<DashboardResponse | null>(null);

  const run = useCallback(async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Erro no lab');
    } finally {
      setBusy(false);
    }
  }, []);

  const loadDashboard = useCallback(() => {
    void run(async () => {
      setDash(await labDashboard());
    });
  }, [run]);

  useEffect(() => {
    if (tab === 'dashboard') loadDashboard();
  }, [tab, loadDashboard]);

  useEffect(() => {
    if (tab !== 'stego' && tab !== 'stego-attack') return;
    void run(async () => {
      setSamples(await labListSamples());
    });
  }, [tab, run]);

  const totalsBars = useMemo(() => {
    if (!dash) return [];
    return Object.entries(dash.totalsByType)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [dash]);

  const freqBars = useMemo(() => {
    if (!stat) return [];
    return Object.entries(stat.topFrequencies).map(([label, value]) => ({ label, value }));
  }, [stat]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Lab · Unidade 2</p>
          <h1 className={styles.title}>Security Lab</h1>
          <p className={styles.lead}>
            Área restrita ao perfil Lab. Cipher didático, estego, ataques controlados e anomalias —
            sem abrir buracos no BCrypt/AES-GCM do jogo. Usa o separador Objetivos para o roteiro de
            testes.
          </p>
        </div>
      </header>

      {temporaryLabNotice ? (
        <p className={styles.tempNotice} role="status">
          Aviso: o acesso ao Lab em deploy é <strong>temporário</strong> (avaliação da cadeira de
          cibersegurança) e limitado a contas com <strong>perfil Lab</strong>. Não é um ambiente
          permanente de produção para ataques; as proteções reais do jogo (BCrypt, AES-GCM, lockout)
          mantêm-se.
        </p>
      ) : null}

      <div className={styles.tabs} role="tablist" aria-label="Secções do lab">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={tab === t.id ? styles.tabActive : styles.tab}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error ? (
        <InlineAlert tone="error" role="alert">
          {error}
        </InlineAlert>
      ) : null}

      {tab === 'objectives' ? (
        <section className={styles.panel}>
          <p className={styles.meta}>
            Objetivos de teste (não são vulnerabilidades a deixar abertas). Segue cada item, anota
            evidências e consulta o Admin → Relatório Ataques / Dashboard Anomalias.
          </p>
          <ol className={styles.objectiveList}>
            {TEST_OBJECTIVES.map((obj) => (
              <li key={obj.id} className={styles.objectiveCard}>
                <strong>{obj.title}</strong>
                <p className={styles.meta}>{obj.goal}</p>
                <p className={styles.objectiveLabel}>Passos</p>
                <ol>
                  {obj.steps.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ol>
                <p className={styles.objectiveLabel}>Esperado</p>
                <p className={styles.meta}>{obj.expect}</p>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {tab === 'cipher' ? (
        <section className={styles.panel}>
          <TextField
            label="Texto claro"
            name="plaintext"
            value={plaintext}
            onChange={(e) => setPlaintext(e.target.value)}
          />
          <TextField
            label="Seed (gera chave dinâmica + nonce)"
            name="seed"
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
          />
          <div className={styles.actions}>
            <Button
              type="button"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  const res = await labEncrypt(plaintext, seed);
                  setEnc(res);
                  setDec(null);
                })
              }
            >
              Cifrar
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={busy || !enc}
              onClick={() =>
                void run(async () => {
                  if (!enc) return;
                  setDec(await labDecrypt(enc.ciphertextBase64, enc.seedUsed, enc.nonceBase64));
                })
              }
            >
              Descifrar
            </Button>
          </div>
          {enc ? (
            <div className={styles.result}>
              <p>
                <strong>Pipeline:</strong> {enc.pipeline}
              </p>
              <p>
                <strong>Fingerprint:</strong> {enc.keyFingerprint} · <strong>Blocos:</strong>{' '}
                {enc.blockCount}
              </p>
              <p>
                <strong>Seed:</strong> {enc.seedUsed}
              </p>
              <p className={styles.mono}>{enc.ciphertextBase64}</p>
            </div>
          ) : null}
          {dec ? (
            <div className={styles.result}>
              <p>
                <strong>Decrypt:</strong> {dec.success ? dec.plaintext : 'falhou'}
              </p>
            </div>
          ) : null}
        </section>
      ) : null}

      {tab === 'stego' ? (
        <section className={styles.panel}>
          <TextField
            label="Mensagem a ocultar"
            name="stegoMsg"
            value={stegoMsg}
            onChange={(e) => setStegoMsg(e.target.value)}
          />
          <label className={styles.fileLabel}>
            Imagem (PNG/JPG — ideal sprite Pokémon)
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                void fileToBase64(f).then((b64) => {
                  setStegoSrc(b64);
                  setStegoOut(null);
                  setStegoExtracted(null);
                });
              }}
            />
          </label>
          <div className={styles.previewRow}>
            {stegoSrc ? <img src={stegoSrc} alt="Original" className={styles.preview} /> : null}
            {stegoOut ? (
              <img
                src={`data:image/png;base64,${stegoOut}`}
                alt="Com mensagem"
                className={styles.preview}
              />
            ) : null}
          </div>
          <div className={styles.actions}>
            <Button
              type="button"
              disabled={busy || !stegoSrc}
              onClick={() =>
                void run(async () => {
                  if (!stegoSrc) return;
                  const res = await labStegoEmbed(stegoSrc, stegoMsg);
                  setStegoOut(res.imageBase64Png);
                  setStegoMeta(`${res.usedBits} / ${res.capacityBits} bits`);
                  setStegoExtracted(null);
                })
              }
            >
              Embutir
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={busy || !stegoOut}
              onClick={() =>
                void run(async () => {
                  if (!stegoOut) return;
                  const res = await labStegoExtract(stegoOut);
                  setStegoExtracted(res.message);
                })
              }
            >
              Extrair
            </Button>
          </div>
          {stegoMeta ? <p className={styles.meta}>Capacidade usada: {stegoMeta}</p> : null}
          {stegoExtracted != null ? (
            <div className={styles.result}>
              <p>
                <strong>Extraído:</strong> {stegoExtracted}
              </p>
            </div>
          ) : null}

          <h2 className={styles.sub}>Imagens de teste (download)</h2>
          <ul className={styles.sampleList}>
            {samples.map((s) => (
              <li key={s.id} className={styles.sampleItem}>
                <div>
                  <strong>{s.filename}</strong>
                  <p className={styles.meta}>{s.description}</p>
                </div>
                <a href={labSampleDownloadUrl(s.id)} download={s.filename}>
                  <Button type="button" size="sm" variant="secondary">
                    Baixar
                  </Button>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {tab === 'stego-attack' ? (
        <section className={styles.panel}>
          <p className={styles.lead}>
            Simula ataque: tentar extrair mensagem oculta de uma imagem suspeita (avatar
            customizado, sample do lab, etc.).
          </p>
          <ul className={styles.sampleList}>
            {samples.map((s) => (
              <li key={s.id} className={styles.sampleItem}>
                <div>
                  <strong>{s.filename}</strong>
                  <p className={styles.meta}>{s.description}</p>
                </div>
                <a href={labSampleDownloadUrl(s.id)} download={s.filename}>
                  <Button type="button" size="sm" variant="secondary">
                    Baixar
                  </Button>
                </a>
              </li>
            ))}
          </ul>
          <label className={styles.fileLabel}>
            Imagem alvo do ataque
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                void fileToBase64(f).then((b64) => {
                  setAttackSrc(b64);
                  setAttackResult(null);
                });
              }}
            />
          </label>
          {attackSrc ? <img src={attackSrc} alt="Alvo" className={styles.preview} /> : null}
          <div className={styles.actions}>
            <Button
              type="button"
              disabled={busy || !attackSrc}
              onClick={() =>
                void run(async () => {
                  if (!attackSrc) return;
                  const res = await labStegoAttack(attackSrc);
                  setAttackResult(res.message);
                })
              }
            >
              Executar ataque (extract LSB)
            </Button>
          </div>
          {attackResult != null ? (
            <div className={styles.result}>
              <p>
                <strong>Mensagem recuperada:</strong> {attackResult}
              </p>
            </div>
          ) : null}
        </section>
      ) : null}

      {tab === 'attacks' ? (
        <section className={styles.panel}>
          <TextField
            label="Plaintext dos ataques"
            name="attackPlain"
            value={attackPlain}
            onChange={(e) => setAttackPlain(e.target.value)}
          />
          <TextField
            label="Bits pesquisáveis (força bruta lab, 4–16)"
            name="bits"
            value={String(bits)}
            onChange={(e) => setBits(Number(e.target.value) || 12)}
          />
          <div className={styles.actions}>
            <Button
              type="button"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  setBrute(await labBruteForce(attackPlain, bits));
                })
              }
            >
              Força bruta
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  setDiff(await labDifferential(attackPlain, seed));
                })
              }
            >
              Diferencial
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  setStat(await labStatistical(attackPlain, seed));
                })
              }
            >
              Estatístico
            </Button>
          </div>
          {brute ? (
            <div className={styles.result}>
              <p>
                <strong>Força bruta:</strong> {brute.found ? 'recuperou seed' : 'não encontrou'} ·{' '}
                {brute.attempted} tentativas · {brute.elapsedMs} ms
              </p>
              <p>{brute.viability}</p>
              {brute.recoveredSeedHint ? <p className={styles.mono}>{brute.recoveredSeedHint}</p> : null}
            </div>
          ) : null}
          {diff ? (
            <div className={styles.result}>
              <p>
                <strong>Avalanche:</strong> {diff.avalanchePercent}% ({diff.changedBits}/
                {diff.totalBitsCompared} bits) —{' '}
                {diff.strongAvalanche ? 'difusão forte' : 'difusão fraca'}
              </p>
            </div>
          ) : null}
          {stat ? (
            <div className={styles.result}>
              <p>
                <strong>Qui-quadrado:</strong> {stat.chiSquare} · uniforme?{' '}
                {stat.looksUniform ? 'sim' : 'não'}
              </p>
              <p>{stat.analysis}</p>
              <BarChart items={freqBars} />
            </div>
          ) : null}
        </section>
      ) : null}

      {tab === 'anomalies' ? (
        <section className={styles.panel}>
          <p className={styles.lead}>
            Deteta rajadas de LOGIN_FAILED, falhas de decrypt/stego e excesso de ataques no lab.
          </p>
          <div className={styles.actions}>
            <Button
              type="button"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  const res = await labScanAnomalies();
                  setAnomalyHits(res.hits);
                })
              }
            >
              Correr scan
            </Button>
          </div>
          {anomalyHits.length === 0 ? (
            <p className={styles.meta}>Nenhuma anomalia neste scan (ou ainda sem tráfego suficiente).</p>
          ) : (
            <ul className={styles.list}>
              {anomalyHits.map((h, i) => (
                <li key={`${h.code}-${i}`}>
                  <strong>{h.code}</strong> — {h.summary} (score {h.score.toFixed(2)})
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {tab === 'dashboard' ? (
        <section className={styles.panel}>
          <div className={styles.actions}>
            <Button type="button" variant="secondary" disabled={busy} onClick={loadDashboard}>
              Atualizar
            </Button>
          </div>
          {dash ? (
            <>
              <p className={styles.conclusion}>{dash.conclusions}</p>
              <h2 className={styles.sub}>Eventos (14 dias)</h2>
              <BarChart items={totalsBars} />
              <h2 className={styles.sub}>Anomalias recentes</h2>
              {dash.recentAnomalies.length === 0 ? (
                <p className={styles.meta}>Sem anomalias gravadas.</p>
              ) : (
                <ul className={styles.list}>
                  {dash.recentAnomalies.map((h, i) => (
                    <li key={`a-${i}`}>
                      {h.summary} (score {(h.score ?? 0).toFixed(2)})
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <p className={styles.meta}>A carregar…</p>
          )}
        </section>
      ) : null}
    </div>
  );
}
