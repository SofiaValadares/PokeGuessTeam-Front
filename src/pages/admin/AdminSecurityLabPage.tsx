import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type KeyboardEvent,
  type SetStateAction,
} from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, InlineAlert, TextField } from '../../ds';
import { ApiError } from '../../services/http';
import {
  labBruteForce,
  labDashboard,
  labDecrypt,
  labDifferential,
  labDifferentialSamples,
  labEncrypt,
  labScanAnomalies,
  labStatistical,
  labListSamples,
  labSampleDownloadUrl,
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
import { LAB_TABS, parseLabTab } from '../dev/labTabs';
import styles from './admin-security-lab.module.css';

type Objective = {
  id: string;
  title: string;
  goal: string;
  steps: string[];
  expect: string;
};

type AttackRun<T> = {
  run: number;
  result: T;
  requestMs: number;
};

type AttackTestTab = 'brute' | 'differential' | 'statistical';
type DifferentialMode = 'individual' | 'simultaneous';

type DifferentialAttackResult = {
  mode: DifferentialMode;
  samples: DifferentialResponse[];
};

const ATTACK_TEST_TABS: { id: AttackTestTab; label: string }[] = [
  { id: 'brute', label: 'Força bruta' },
  { id: 'differential', label: 'Diferencial · avalanche' },
  { id: 'statistical', label: 'Estatístico' },
];

const MAX_ATTACK_RUNS = 30;
const MAX_BRUTE_RUN_DURATION_MS = 60_000;
const POWERFUL_MACHINE_GUESSES_PER_SECOND = 1_000_000_000_000;

function formatEstimatedDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return 'indeterminado';

  const number = new Intl.NumberFormat('pt-BR', { maximumSignificantDigits: 3 });
  if (seconds < 1) return `${number.format(seconds * 1_000)} ms`;

  const units = [
    { seconds: 31_557_600, label: 'anos' },
    { seconds: 86_400, label: 'dias' },
    { seconds: 3_600, label: 'h' },
    { seconds: 60, label: 'min' },
    { seconds: 1, label: 's' },
  ];
  const unit = units.find((candidate) => seconds >= candidate.seconds) ?? units[units.length - 1];
  return `${number.format(seconds / unit.seconds)} ${unit.label}`;
}

function assessPowerfulBatchViability(expectedSeconds: number): string {
  if (expectedSeconds < 60) {
    return 'Viável em menos de um minuto no cenário hipotético de 1 trilhão de tentativas por segundo.';
  }
  if (expectedSeconds < 3_600) {
    return 'Viável em menos de uma hora apenas no cenário hipotético de 1 trilhão de tentativas por segundo.';
  }
  if (expectedSeconds < 86_400) {
    return 'Pode ser viável em horas com hardware e paralelismo extremos; 1 trilhão/s é apenas uma hipótese.';
  }
  if (expectedSeconds < 31_557_600) {
    return 'Pode levar dias ou meses mesmo no cenário hipotético de 1 trilhão de tentativas por segundo.';
  }
  return 'Não viável em prazo prático no cenário hipotético de 1 trilhão de tentativas por segundo.';
}

function normalizeIntegerInput(value: string, min: number, max: number, fallback: number): string {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= min && parsed <= max ? String(parsed) : String(fallback);
}

function formatPValue(value: number): string {
  if (!Number.isFinite(value)) return 'indeterminado';
  if (value === 0) return '< 1e-300';
  return value < 0.001 ? value.toExponential(2) : value.toFixed(4);
}

const TEST_OBJECTIVES: Objective[] = [
  {
    id: 'cipher-roundtrip',
    title: 'Cifragem didática — ida e volta',
    goal: 'Confirmar chave dinâmica + XOR e quatro rodadas didáticas de S-box, ShiftRows e MixColumns (não é o AES do jogo).',
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
    id: 'xss-svg-avatar',
    title: 'XSS via imagem de perfil (SVG)',
    goal: 'Mostrar script no SVG do avatar (<object>) — console, DOM, fetch à API.',
    steps: [
      'Separador Estego: baixa um sample XSS (ex. lab-xss-taunt.svg).',
      'Perfil → Upload → envia o SVG.',
      'Abre partida/home noutro browser → DevTools → Console.',
    ],
    expect: 'Mensagem/ataque no console; fetch-profile/match mostram dados da sessão da vítima.',
  },
  {
    id: 'stego-lsb-profile',
    title: 'Esteganografia LSB no perfil',
    goal: 'Esconder/revelar mensagem LSB no upload de imagem (PNG) do perfil.',
    steps: [
      'Perfil → mensagem oculta + enviar PNG.',
      'Revelar mensagem no mesmo ecrã.',
    ],
    expect: 'Mensagem recuperada; evento STEGO_* no relatório Admin.',
  },
  {
    id: 'attack-brute',
    title: 'Ataque força bruta (lab controlado)',
    goal: 'Comparar busca completa em espaços pequenos com a previsão de busca em espaços maiores.',
    steps: [
      'Ataques cripto → força bruta com 12 bits para observar a recuperação da seed.',
      'Repete com 32, 64 ou 512 bits; cada rodada mede até 1 min e estima a duração total.',
      'Compara a taxa observada com o cenário hipotético de 1 trilhão de tentativas por segundo.',
    ],
    expect: 'Registar tentativas, tempo medido, previsão média/pior caso e limites do cenário de hardware.',
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
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = parseLabTab(searchParams.get('tab'));
  const showLabNoticeAside = temporaryLabNotice && tab !== 'attacks';
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add('security-lab-hide-scrollbar');
    return () => document.documentElement.classList.remove('security-lab-hide-scrollbar');
  }, []);

  const setTab = useCallback(
    (next: string) => {
      if (next === 'objectives') {
        setSearchParams({}, { replace: true });
        return;
      }
      setSearchParams({ tab: next }, { replace: true });
    },
    [setSearchParams],
  );

  // Cipher
  const [plaintext, setPlaintext] = useState('Mensagem secreta do lab Pokémon');
  const [seed, setSeed] = useState('poke-seed-dinamica');
  const [enc, setEnc] = useState<EncryptResponse | null>(null);
  const [dec, setDec] = useState<DecryptResponse | null>(null);

  // Estego / XSS samples
  const [samples, setSamples] = useState<StegoSample[]>([]);

  // Attacks
  const [attackPlain, setAttackPlain] = useState('Pikachu#25');
  const [activeAttackTab, setActiveAttackTab] = useState<AttackTestTab>('brute');
  const [attackHelpOpen, setAttackHelpOpen] = useState<Record<AttackTestTab, boolean>>({
    brute: false,
    differential: false,
    statistical: false,
  });
  const [bitsInput, setBitsInput] = useState('12');
  const [bruteRunCount, setBruteRunCount] = useState('1');
  const [diffRunCount, setDiffRunCount] = useState('1');
  const [diffMode, setDiffMode] = useState<DifferentialMode>('individual');
  const [diffSamplesPerRound, setDiffSamplesPerRound] = useState('1');
  const [diffSimultaneousBitCount, setDiffSimultaneousBitCount] = useState('2');
  const [statRunCount, setStatRunCount] = useState('1');
  const [statSampleCount, setStatSampleCount] = useState('100');
  const [bruteRequestedRunCount, setBruteRequestedRunCount] = useState(1);
  const [bruteRuns, setBruteRuns] = useState<AttackRun<BruteForceResponse>[]>([]);
  const [diffRuns, setDiffRuns] = useState<AttackRun<DifferentialAttackResult>[]>([]);
  const [statRuns, setStatRuns] = useState<AttackRun<StatisticalResponse>[]>([]);
  const [attackProgress, setAttackProgress] = useState<{
    label: string;
    current: number;
    total: number;
    elapsedSeconds: number;
  } | null>(null);
  const [attackBatchNote, setAttackBatchNote] = useState<string | null>(null);
  const [attackResultRevision, setAttackResultRevision] = useState<Record<AttackTestTab, number>>({
    brute: 0,
    differential: 0,
    statistical: 0,
  });

  // Anomalies / dashboard
  const [anomalyHits, setAnomalyHits] = useState<AnomalyHit[]>([]);
  const [dash, setDash] = useState<DashboardResponse | null>(null);

  const handleAttackTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const currentIndex = ATTACK_TEST_TABS.findIndex(({ id }) => id === activeAttackTab);
    let nextIndex: number | null = null;
    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % ATTACK_TEST_TABS.length;
    if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + ATTACK_TEST_TABS.length) % ATTACK_TEST_TABS.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = ATTACK_TEST_TABS.length - 1;
    if (nextIndex === null) return;

    event.preventDefault();
    const nextTab = ATTACK_TEST_TABS[nextIndex].id;
    setActiveAttackTab(nextTab);
    document.getElementById(`attack-tab-${nextTab}`)?.focus();
  };

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

  const runAttackBatch = useCallback(
    async <T,>(
      label: string,
      resultTab: AttackTestTab,
      runCountValue: string,
      setRows: Dispatch<SetStateAction<AttackRun<T>[]>>,
      action: (runDurationMs?: number) => Promise<T>,
      perRunDurationMs?: number,
      stopAfter?: {
        count: number;
        matches: (result: T) => boolean;
        message: (completed: number, total: number) => string;
      },
    ) => {
      const total = Number(runCountValue);
      if (!Number.isInteger(total) || total < 1 || total > MAX_ATTACK_RUNS) {
        setError(`O número de execuções deve estar entre 1 e ${MAX_ATTACK_RUNS}.`);
        return;
      }

      let activeRunStartedAt = performance.now();
      let matchingResults = 0;
      setAttackResultRevision((revision) => ({
        ...revision,
        [resultTab]: revision[resultTab] + 1,
      }));
      setAttackProgress({ label, current: 1, total, elapsedSeconds: 0 });
      const progressTimer = window.setInterval(() => {
        setAttackProgress((current) =>
          current
            ? { ...current, elapsedSeconds: Math.floor((performance.now() - activeRunStartedAt) / 1_000) }
            : null,
        );
      }, 1_000);
      try {
        await run(async () => {
          setRows([]);
          const completed: AttackRun<T>[] = [];
          for (let index = 1; index <= total; index += 1) {
            activeRunStartedAt = performance.now();
            setAttackProgress({ label, current: index, total, elapsedSeconds: 0 });
            const startedAt = performance.now();
            const result = await action(perRunDurationMs);
            completed.push({
              run: index,
              result,
              requestMs: performance.now() - startedAt,
            });
            setRows([...completed]);
            setAttackProgress({
              label,
              current: index,
              total,
              elapsedSeconds: Math.floor((performance.now() - startedAt) / 1_000),
            });

            if (stopAfter?.matches(result)) {
              matchingResults += 1;
              if (matchingResults >= stopAfter.count) {
                setAttackBatchNote(stopAfter.message(index, total));
                break;
              }
            }
          }
        });
      } finally {
        window.clearInterval(progressTimer);
        setAttackProgress(null);
      }
    },
    [run],
  );

  const loadDashboard = useCallback(() => {
    void run(async () => {
      setDash(await labDashboard());
    });
  }, [run]);

  useEffect(() => {
    if (tab === 'dashboard') loadDashboard();
  }, [tab, loadDashboard]);

  useEffect(() => {
    if (tab !== 'stego') return;
    void run(async () => {
      setSamples(await labListSamples());
    });
  }, [tab, run]);

  const xssSamples = useMemo(
    () =>
      samples.filter(
        (s) => s.kind === 'xss' || (s.contentType ?? '').includes('svg') || s.id.startsWith('xss-'),
      ),
    [samples],
  );

  const totalsBars = useMemo(() => {
    if (!dash) return [];
    return Object.entries(dash.totalsByType)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [dash]);

  const bruteAverageAttempts = bruteRuns.length
    ? bruteRuns.reduce((sum, row) => sum + row.result.attempted, 0) / bruteRuns.length
    : 0;
  const bruteAverageTime = bruteRuns.length
    ? bruteRuns.reduce((sum, row) => sum + row.result.elapsedMs, 0) / bruteRuns.length
    : 0;
  const bruteFoundCount = bruteRuns.filter((row) => row.result.found).length;
  const timedOutBruteRuns = bruteRuns.filter((row) => row.result.timeLimited);
  const timedOutBruteAttempts = timedOutBruteRuns.reduce((sum, row) => sum + row.result.attempted, 0);
  const timedOutBruteElapsedMs = timedOutBruteRuns.reduce((sum, row) => sum + row.result.elapsedMs, 0);
  const combinedBruteAttemptsPerSecond = timedOutBruteElapsedMs > 0
    ? timedOutBruteAttempts / (timedOutBruteElapsedMs / 1_000)
    : 0;
  const timedOutBruteBits = timedOutBruteRuns[0]?.result.keySpaceBits ?? 0;
  const bruteKeySpaceSize = Math.pow(2, timedOutBruteBits);
  const bruteExpectedBatchSecondsAtObservedRate = combinedBruteAttemptsPerSecond > 0
    ? bruteRequestedRunCount * bruteKeySpaceSize / 2 / combinedBruteAttemptsPerSecond
    : 0;
  const bruteWorstBatchSecondsAtObservedRate = combinedBruteAttemptsPerSecond > 0
    ? bruteRequestedRunCount * bruteKeySpaceSize / combinedBruteAttemptsPerSecond
    : 0;
  const bruteExpectedBatchSecondsAtPowerfulRate = bruteRequestedRunCount * bruteKeySpaceSize / 2
    / POWERFUL_MACHINE_GUESSES_PER_SECOND;
  const bruteWorstBatchSecondsAtPowerfulRate = bruteRequestedRunCount * bruteKeySpaceSize
    / POWERFUL_MACHINE_GUESSES_PER_SECOND;
  const shouldShowBruteBatchForecast = timedOutBruteRuns.length >= 2;
  const differentialPlaintext = attackPlain.trim() ? attackPlain : 'Pikachu';
  const differentialPlaintextBits = Math.max(
    1,
    new TextEncoder().encode(differentialPlaintext).length * 8,
  );
  const maxDiffSamplesPerRound = Math.min(512, differentialPlaintextBits);
  const diffSamplesPreview = Number(diffSamplesPerRound);
  const diffSimultaneousBitsPreview = Number(diffSimultaneousBitCount);
  const diffRoundsPreview = Number(diffRunCount);
  const diffRoundParameterPreview =
    diffMode === 'individual' ? diffSamplesPreview : diffSimultaneousBitsPreview;
  const diffRoundParameterIsValid = Number.isInteger(diffRoundParameterPreview) &&
    (diffMode === 'individual'
      ? diffRoundParameterPreview >= 1
      : diffRoundParameterPreview >= 2) &&
    diffRoundParameterPreview <= maxDiffSamplesPerRound;
  const diffPlanIsValid =
    diffRoundParameterIsValid &&
    Number.isInteger(diffRoundsPreview) &&
    diffRoundsPreview >= 1 &&
    diffRoundsPreview <= MAX_ATTACK_RUNS;
  const diffPlannedComparisons = diffPlanIsValid
    ? diffMode === 'individual'
      ? diffSamplesPreview * diffRoundsPreview
      : diffRoundsPreview
    : null;
  const diffTotalSamples = diffRuns.reduce((sum, row) => sum + row.result.samples.length, 0);
  const diffAverageAvalanche = diffTotalSamples
    ? diffRuns.reduce(
        (sum, row) => sum + row.result.samples.reduce((roundSum, sample) => roundSum + sample.avalanchePercent, 0),
        0,
      ) / diffTotalSamples
    : 0;
  const diffAverageRequestTime = diffRuns.length
    ? diffRuns.reduce((sum, row) => sum + row.requestMs, 0) / diffRuns.length
    : 0;
  const statAverageChiSquare = statRuns.length
    ? statRuns.reduce((sum, row) => sum + row.result.chiSquare, 0) / statRuns.length
    : 0;
  const statEvaluableCount = statRuns.filter((row) => row.result.sufficientSample).length;
  const statInsufficientCount = statRuns.length - statEvaluableCount;
  const statNoDeviationCount = statRuns.filter((row) => row.result.looksUniform).length;
  const statAverageRequestTime = statRuns.length
    ? statRuns.reduce((sum, row) => sum + row.requestMs, 0) / statRuns.length
    : 0;

  return (
    <div
      className={`${styles.page} ${
        tab === 'attacks'
          ? styles.pageWithAttackInfo
          : showLabNoticeAside
            ? styles.pageWithLabNotice
            : ''
      }`}
    >
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Lab · Unidade 2</p>
          <h1 className={styles.title}>
            {LAB_TABS.find((t) => t.id === tab)?.label ?? 'Security Lab'}
          </h1>
          <p className={styles.lead}>
            Área restrita ao perfil Lab. Cipher didático, estego, ataques controlados e anomalias —
            sem abrir buracos no BCrypt/AES-GCM do jogo. Usa a navegação no topo para mudar de
            secção.
          </p>
        </div>
      </header>

      {showLabNoticeAside ? (
        <aside className={styles.labNoticeAside} aria-label="Aviso sobre o acesso ao Lab">
          <p className={styles.tempNotice} role="status">
            Aviso: o acesso ao Lab em deploy é <strong>temporário</strong> (avaliação da cadeira de
            cibersegurança) e limitado a contas com <strong>perfil Lab</strong>. Não é um ambiente
            permanente de produção para ataques; as proteções reais do jogo (BCrypt, AES-GCM, lockout)
            mantêm-se.
          </p>
        </aside>
      ) : null}

      <div className={styles.mobileTabs} role="tablist" aria-label="Secções do lab">
        {LAB_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={tab === t.id ? styles.tabActive : styles.tab}
            onClick={() => setTab(t.id)}
          >
            {t.shortLabel}
          </button>
        ))}
      </div>

      {error ? (
        <InlineAlert tone="error" role="alert">
          {error}
        </InlineAlert>
      ) : null}

      {tab === 'attacks' ? (
        <div className={styles.attackAsideColumn}>
          <aside className={styles.attackInfo} aria-labelledby="attack-info-heading">
            <p className={styles.kicker}>Guia rápido</p>
            <h2 id="attack-info-heading" className={styles.attackInfoTitle}>
              O que cada ataque avalia
            </h2>
            <section className={styles.attackDefinition}>
              <h3>Força bruta</h3>
              <p>
                Experimenta combinações de seed até encontrar a que corresponde ao ciphertext. De 4 a 16 bits,
                o Lab percorre o espaço completo. Acima disso, busca até encontrar a seed, esgotar o espaço ou
                atingir o limite de 1 minuto por rodada; quando o limite é atingido, estima a duração total.
              </p>
            </section>
            <section className={styles.attackDefinition}>
              <h3>Diferencial · avalanche</h3>
              <p>
                Cada amostra parte do plaintext original, inverte exatamente um bit e compara a cifra alterada
                com a cifra base usando a mesma chave/nonce. As alterações não são acumuladas; perto de 50% dos
                bits de saída alterados é o comportamento esperado de difusão forte.
              </p>
            </section>
            <section className={styles.attackDefinition}>
              <h3>Estatístico</h3>
              <p>
                Conta bytes em uma amostra configurável de cifras e calcula χ² para verificar se a
                distribuição se aproxima de uniforme, procurando padrões estatísticos.
              </p>
            </section>
            <p className={styles.attackInfoNote}>
              Os três testes usam o cipher didático do Lab. Não atacam o AES-GCM nem o BCrypt usados
              nas proteções reais da aplicação.
            </p>
          </aside>
          {temporaryLabNotice ? (
            <p className={styles.tempNotice} role="status">
              Aviso: o acesso ao Lab em deploy é <strong>temporário</strong> (avaliação da cadeira de
              cibersegurança) e limitado a contas com <strong>perfil Lab</strong>. Não é um ambiente
              permanente de produção para ataques; as proteções reais do jogo (BCrypt, AES-GCM, lockout)
              mantêm-se.
            </p>
          ) : null}
        </div>
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
          <h2 className={styles.sub}>XSS no SVG</h2>
          <p className={styles.lead}>
            Baixa um SVG → Perfil → Upload → na partida/home o avatar em{' '}
            <code>&lt;object&gt;</code> executa o script (console, DOM, fetch com a sessão da
            vítima). LSB do perfil continua só no ecrã de Perfil.
          </p>
          <ul className={styles.sampleList}>
            {xssSamples.map((s) => (
              <li key={s.id} className={styles.sampleItem}>
                <div>
                  <strong>{s.filename}</strong>
                  <p className={styles.meta}>{s.description}</p>
                </div>
                <a href={labSampleDownloadUrl(s.id)} download={s.filename}>
                  <Button type="button" size="sm" variant="secondary" disabled={busy}>
                    Baixar
                  </Button>
                </a>
              </li>
            ))}
            {xssSamples.length === 0 && !busy ? (
              <li className={styles.meta}>Sem samples XSS — atualiza o backend / recarrega.</li>
            ) : null}
          </ul>
        </section>
      ) : null}

      {tab === 'attacks' ? (
        <div className={styles.attackCards}>
          <section className={styles.attackCard} aria-label="Plaintext dos ataques">
            <TextField
              label="Plaintext dos ataques"
              name="attackPlain"
              value={attackPlain}
              onChange={(e) => setAttackPlain(e.target.value)}
            />
          </section>
          <div className={styles.attackTestTabs} role="tablist" aria-label="Testes criptográficos">
            {ATTACK_TEST_TABS.map(({ id, label }) => (
              <button
                key={id}
                id={`attack-tab-${id}`}
                type="button"
                role="tab"
                aria-selected={activeAttackTab === id}
                aria-controls={`attack-panel-${id}`}
                tabIndex={activeAttackTab === id ? 0 : -1}
                className={`${styles.attackTestTab} ${activeAttackTab === id ? styles.attackTestTabActive : ''}`}
                onClick={() => setActiveAttackTab(id)}
                onKeyDown={handleAttackTabKeyDown}
              >
                {label}
              </button>
            ))}
          </div>
          <div
            id="attack-panel-brute"
            role="tabpanel"
            aria-labelledby="attack-tab-brute"
            className={styles.attackTabPanel}
            hidden={activeAttackTab !== 'brute'}
          >
          <section className={`${styles.attackCard} ${styles.attackMethod}`} aria-labelledby="brute-force-heading">
            <div className={styles.attackMethodHeader}>
              <div className={styles.attackMethodTitleRow}>
                <h2 id="brute-force-heading" className={styles.attackMethodTitle}>Força bruta</h2>
                <button
                  type="button"
                  className={styles.attackHelpToggle}
                  aria-label="Explicação do teste de força bruta"
                  aria-expanded={attackHelpOpen.brute}
                  aria-controls="attack-help-brute"
                  onClick={() => setAttackHelpOpen((current) => ({ ...current, brute: !current.brute }))}
                >
                  ?
                </button>
              </div>
              <p className={styles.meta}>Busca a seed no espaço artificial indicado pelos bits pesquisáveis.</p>
            </div>
            {attackHelpOpen.brute ? (
              <div id="attack-help-brute" className={styles.attackHelpPanel} role="note">
                <h3>Como funciona a força bruta</h3>
                <p>
                  O laboratório procura a seed usada para cifrar o plaintext dentro de um espaço artificial de
                  2<sup>bits</sup> possibilidades. Esse exercício mede custo de busca; não tenta quebrar BCrypt ou
                  AES-GCM usados pelo jogo.
                </p>
                <p>
                  Com até 16 bits, percorre o espaço completo. Acima de 16, cada execução pode durar até 1 minuto;
                  se duas execuções atingirem o limite, o lote para e apresenta uma previsão geral a partir do
                  ritmo observado e de um cenário hipotético de 1 trilhão de tentativas por segundo.
                </p>
                <p>
                  Cada execução é uma busca independente. Aumentar bits aumenta o espaço exponencialmente; aumentar
                  execuções repete a medição e melhora a comparação entre resultados.
                </p>
              </div>
            ) : null}
            <div className={styles.attackInputs}>
              <TextField
                label="Bits pesquisáveis (4–512)"
                name="bits"
                type="number"
                min={4}
                max={512}
                step={1}
                value={bitsInput}
                hint="Inteiro entre 4 e 512; inválido volta a 4. Acima de 16 bits, cada rodada tem até 1 min."
                onChange={(e) => setBitsInput(e.target.value)}
                onBlur={(e) => setBitsInput(normalizeIntegerInput(e.currentTarget.value, 4, 512, 4))}
              />
              <TextField
                label="Execuções (1–30)"
                name="bruteRunCount"
                type="number"
                min={1}
                max={MAX_ATTACK_RUNS}
                step={1}
                value={bruteRunCount}
                hint="Cada execução tenta recuperar uma seed nova."
                onChange={(e) => setBruteRunCount(e.target.value)}
                onBlur={(e) => setBruteRunCount(normalizeIntegerInput(e.currentTarget.value, 1, MAX_ATTACK_RUNS, 1))}
              />
            </div>
            <div className={styles.actions}>
              <Button
                type="button"
                disabled={busy}
                onClick={() => {
                  const requestedBits = Number(normalizeIntegerInput(bitsInput, 4, 512, 4));
                  const requestedRuns = normalizeIntegerInput(bruteRunCount, 1, MAX_ATTACK_RUNS, 1);
                  setBitsInput(String(requestedBits));
                  setBruteRunCount(requestedRuns);
                  setBruteRequestedRunCount(Number(requestedRuns));
                  setAttackBatchNote(null);
                  void runAttackBatch(
                    'Força bruta',
                    'brute',
                    requestedRuns,
                    setBruteRuns,
                    async (runDurationMs) => {
                      const result = await labBruteForce(attackPlain, requestedBits, runDurationMs);
                      if (result.keySpaceBits !== requestedBits) {
                        throw new Error(
                          `O Back executou ${result.keySpaceBits} bits, mas foram pedidos ${requestedBits}. Reinicie o backend local ou atualize o deploy do Back.`,
                        );
                      }
                      return result;
                    },
                    requestedBits > 16 ? MAX_BRUTE_RUN_DURATION_MS : undefined,
                    {
                      count: 2,
                      matches: (result) => result.timeLimited,
                      message: (completed, total) =>
                        `Dois limites de 1 minuto atingidos; lote interrompido após ${completed} de ${total} execuções. A previsão abaixo considera o lote completo.`,
                    },
                  );
                }}
              >
                Rodar força bruta
              </Button>
            </div>
            {attackProgress?.label === 'Força bruta' ? (
              <p className={styles.attackProgress} role="status" aria-live="polite">
                {attackProgress.label}: execução {attackProgress.current}/{attackProgress.total} ·{' '}
                {attackProgress.elapsedSeconds}s nesta execução
              </p>
            ) : null}
            {attackBatchNote ? <p className={styles.meta} role="status">{attackBatchNote}</p> : null}
            {bruteRuns.length > 0 ? (
              <>
                <div className={styles.attackSummary}>
                  <h3 className={styles.sub}>Médias · Força bruta ({bruteRuns.length} execuções)</h3>
                  <div className={styles.attackMetrics}>
                    <p><strong>Tentativas:</strong> {bruteAverageAttempts.toFixed(1)}</p>
                    <p><strong>Tempo do ataque:</strong> {bruteAverageTime.toFixed(2)} ms</p>
                    <p>
                      <strong>Seeds encontradas:</strong> {bruteFoundCount}/{bruteRuns.length} (
                      {((bruteFoundCount / bruteRuns.length) * 100).toFixed(0)}%)
                    </p>
                  </div>
                </div>
                {shouldShowBruteBatchForecast ? (
                  <div className={styles.attackForecast}>
                    <h3>Previsão geral do lote ({bruteRequestedRunCount} execuções)</h3>
                    <p>
                      <strong>Ritmo combinado das rodadas limitadas:</strong>{' '}
                      {new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(
                        combinedBruteAttemptsPerSecond,
                      )}{' '}
                      tentativas/s ({timedOutBruteRuns.length} rodadas)
                    </p>
                    <p>
                      <strong>Duração estimada do lote neste servidor:</strong> média de{' '}
                      {formatEstimatedDuration(bruteExpectedBatchSecondsAtObservedRate)}; pior caso{' '}
                      {formatEstimatedDuration(bruteWorstBatchSecondsAtObservedRate)}.
                    </p>
                    <p>
                      <strong>Para o lote a 1 trilhão de tentativas/s (hipótese):</strong> média de{' '}
                      {formatEstimatedDuration(bruteExpectedBatchSecondsAtPowerfulRate)}; pior caso{' '}
                      {formatEstimatedDuration(bruteWorstBatchSecondsAtPowerfulRate)}.
                    </p>
                    <p>
                      <strong>Viabilidade do lote:</strong>{' '}
                      {assessPowerfulBatchViability(bruteExpectedBatchSecondsAtPowerfulRate)}
                    </p>
                    <p className={styles.meta}>
                      A previsão extrapola a taxa conjunta das rodadas limitadas para todas as execuções solicitadas.
                      A hipótese de 1 trilhão/s não é uma medição de hardware.
                    </p>
                  </div>
                ) : null}
                <details key={`brute-${attackResultRevision.brute}`} className={styles.attackRunsDisclosure}>
                  <summary className={styles.attackRunsToggle}>
                    <span className={styles.attackRunsClosed}>Expandir rodadas ({bruteRuns.length})</span>
                    <span className={styles.attackRunsOpen}>Recolher rodadas</span>
                  </summary>
                  <div className={styles.attackRunList} aria-label="Resultados individuais de força bruta">
                    {bruteRuns.map(({ run: runNumber, result }) => (
                      <article className={styles.attackRun} key={runNumber}>
                        <p>
                          <strong>Execução {runNumber}:</strong>{' '}
                          {result.found ? 'seed encontrada' : 'seed não encontrada'} · {result.attempted} tentativas ·{' '}
                          {result.elapsedMs} ms
                        </p>
                        <p>
                          {result.timeLimited
                            ? 'Limite de 1 minuto desta rodada atingido.'
                            : result.viability}
                        </p>
                        {result.recoveredSeedHint ? <p className={styles.mono}>{result.recoveredSeedHint}</p> : null}
                      </article>
                    ))}
                  </div>
                </details>
              </>
            ) : null}
          </section>
          </div>

          <div
            id="attack-panel-differential"
            role="tabpanel"
            aria-labelledby="attack-tab-differential"
            className={styles.attackTabPanel}
            hidden={activeAttackTab !== 'differential'}
          >
          <section className={`${styles.attackCard} ${styles.attackMethod}`} aria-labelledby="differential-heading">
            <div className={styles.attackMethodHeader}>
              <div className={styles.attackMethodTitleRow}>
                <h2 id="differential-heading" className={styles.attackMethodTitle}>Diferencial · avalanche</h2>
                <button
                  type="button"
                  className={styles.attackHelpToggle}
                  aria-label="Explicação do teste diferencial e avalanche"
                  aria-expanded={attackHelpOpen.differential}
                  aria-controls="attack-help-differential"
                  onClick={() =>
                    setAttackHelpOpen((current) => ({ ...current, differential: !current.differential }))
                  }
                >
                  ?
                </button>
              </div>
              <p className={styles.meta}>
                Cada amostra parte do plaintext original, inverte um único bit aleatório e compara a cifra com a
                cifra base usando a mesma chave/nonce. As posições não se repetem dentro da rodada geral; as
                alterações não são acumuladas.
              </p>
            </div>
            {attackHelpOpen.differential ? (
              <div id="attack-help-differential" className={styles.attackHelpPanel} role="note">
                <h3>Como funciona o teste diferencial</h3>
                <p>
                  O cipher didático usa quatro rodadas de S-box, ShiftRows e MixColumns. A camada MixColumns combina
                  os bytes de cada coluna; junto com ShiftRows e as rodadas seguintes, espalha uma diferença pelo
                  bloco. Essa estrutura é educativa e não é AES nem uma cifra segura para produção.
                </p>
                <p>
                  Primeiro, o sistema cifra o plaintext original. Depois, para cada amostra, volta ao plaintext
                  original, inverte exatamente um bit e cifra essa variante com a mesma chave e nonce. A saída é
                  comparada com a cifra base pela distância de Hamming: bits de ciphertext diferentes ÷ total de
                  bits comparados × 100. A conta considera o(s) bloco(s) de 16 bytes afetado(s), para que blocos
                  intactos de textos longos não reduzam artificialmente a percentagem.
                </p>
                <p>
                  As alterações não são cumulativas: o bit 2 não parte do texto já alterado pelo bit 1, e uma saída
                  cifrada nunca vira a entrada seguinte. Isso isola o efeito de cada bit e corresponde ao teste
                  clássico de avalanche. Uma cifra com difusão forte tende a alterar perto de 50% dos bits de saída
                  em média. Assim, 50 amostras × 30 rodadas gerais representam 1.500 comparações independentes;
                  cada rodada geral usa uma nova chave/nonce. É uma medição de difusão, não uma tentativa de
                  recuperar a chave.
                </p>
                <p>
                  No modo simultâneo, vários bits aleatórios são invertidos juntos e cada rodada geral faz uma só
                  comparação contra a cifra original. Esse resultado mede o efeito combinado das alterações, não o
                  efeito isolado de cada bit.
                </p>
              </div>
            ) : null}
            <div className={styles.attackModeSelector} role="group" aria-label="Modo de alteração diferencial">
              <span className={styles.attackModeLabel}>Modo de alteração</span>
              <button
                type="button"
                className={`${styles.attackModeButton} ${diffMode === 'individual' ? styles.attackModeButtonActive : ''}`}
                aria-pressed={diffMode === 'individual'}
                onClick={() => setDiffMode('individual')}
              >
                Bits separados
              </button>
              <button
                type="button"
                className={`${styles.attackModeButton} ${diffMode === 'simultaneous' ? styles.attackModeButtonActive : ''}`}
                aria-pressed={diffMode === 'simultaneous'}
                onClick={() => setDiffMode('simultaneous')}
              >
                Bits juntos
              </button>
            </div>
            <div className={styles.attackInputs}>
              <TextField
                label={`Amostras de 1 bit por rodada (1–${maxDiffSamplesPerRound})`}
                name="differentialSamplesPerRound"
                type="number"
                min={1}
                max={maxDiffSamplesPerRound}
                step={1}
                value={diffSamplesPerRound}
                disabled={diffMode !== 'individual'}
                className={diffMode !== 'individual' ? styles.attackInputDisabled : undefined}
                hint="Cada amostra inverte 1 bit separadamente. Máximo limitado aos bits do plaintext em UTF-8."
                onChange={(e) => setDiffSamplesPerRound(e.target.value)}
                onBlur={(e) =>
                  setDiffSamplesPerRound(
                    normalizeIntegerInput(e.currentTarget.value, 1, maxDiffSamplesPerRound, 1),
                  )
                }
              />
              <TextField
                label={`Bits alterados juntos por comparação (2–${maxDiffSamplesPerRound})`}
                name="differentialSimultaneousBitCount"
                type="number"
                min={2}
                max={maxDiffSamplesPerRound}
                step={1}
                value={diffSimultaneousBitCount}
                disabled={diffMode !== 'simultaneous'}
                className={diffMode !== 'simultaneous' ? styles.attackInputDisabled : undefined}
                hint="Inverte posições aleatórias distintas ao mesmo tempo; para 1 bit, use Bits separados."
                onChange={(e) => setDiffSimultaneousBitCount(e.target.value)}
                onBlur={(e) =>
                  setDiffSimultaneousBitCount(
                    normalizeIntegerInput(e.currentTarget.value, 2, maxDiffSamplesPerRound, 2),
                  )
                }
              />
              <TextField
                label="Rodadas gerais (1–30)"
                name="diffRunCount"
                type="number"
                min={1}
                max={MAX_ATTACK_RUNS}
                step={1}
                value={diffRunCount}
                hint="Cada rodada geral repete todas as amostras com uma chave/nonce novos."
                onChange={(e) => setDiffRunCount(e.target.value)}
                onBlur={(e) => setDiffRunCount(normalizeIntegerInput(e.currentTarget.value, 1, MAX_ATTACK_RUNS, 1))}
              />
            </div>
            <p className={styles.meta}>
              Total planejado:{' '}
              {diffPlanIsValid
                ? diffMode === 'individual'
                  ? `${diffSamplesPreview} amostras separadas de 1 bit × ${diffRoundsPreview} rodadas gerais = ${diffPlannedComparisons} comparações bit-a-bit.`
                  : `${diffSimultaneousBitsPreview} bits juntos em cada comparação × ${diffRoundsPreview} rodadas gerais = ${diffPlannedComparisons} comparações simultâneas.`
                : 'corrija os campos para calcular o plano de comparações.'}
            </p>
            <div className={styles.actions}>
              <Button
                type="button"
                disabled={busy}
                onClick={() => {
                  const requestedRuns = normalizeIntegerInput(diffRunCount, 1, MAX_ATTACK_RUNS, 1);
                  setDiffRunCount(requestedRuns);
                  if (diffMode === 'individual') {
                    const requestedSamples = normalizeIntegerInput(
                      diffSamplesPerRound,
                      1,
                      maxDiffSamplesPerRound,
                      1,
                    );
                    setDiffSamplesPerRound(requestedSamples);
                  } else {
                    const requestedSimultaneousBits = normalizeIntegerInput(
                      diffSimultaneousBitCount,
                      2,
                      maxDiffSamplesPerRound,
                      2,
                    );
                    setDiffSimultaneousBitCount(requestedSimultaneousBits);
                  }
                  void runAttackBatch(
                    'Diferencial',
                    'differential',
                    requestedRuns,
                    setDiffRuns,
                    async (): Promise<DifferentialAttackResult> => {
                      if (diffMode === 'individual') {
                        const requestedSamples = normalizeIntegerInput(
                          diffSamplesPerRound,
                          1,
                          maxDiffSamplesPerRound,
                          1,
                        );
                        const result = await labDifferentialSamples(
                          differentialPlaintext,
                          Number(requestedSamples),
                          seed,
                        );
                        return { mode: 'individual', samples: result.samples };
                      }

                      const requestedSimultaneousBits = normalizeIntegerInput(
                        diffSimultaneousBitCount,
                        2,
                        maxDiffSamplesPerRound,
                        2,
                      );
                      const result = await labDifferential(
                        differentialPlaintext,
                        1,
                        Number(requestedSimultaneousBits),
                        seed,
                      );
                      return { mode: 'simultaneous', samples: [result] };
                    },
                  );
                }}
              >
                Rodar diferencial
              </Button>
            </div>
            {attackProgress?.label === 'Diferencial' ? (
              <p className={styles.attackProgress} role="status" aria-live="polite">
                {attackProgress.label}: rodada geral {attackProgress.current}/{attackProgress.total} ·{' '}
                {attackProgress.elapsedSeconds}s nesta rodada geral
              </p>
            ) : null}
            {diffRuns.length > 0 ? (
              <>
                <div className={styles.attackSummary}>
                  <h3 className={styles.sub}>
                    Médias · Diferencial ({diffTotalSamples} comparações em {diffRuns.length} rodadas gerais)
                  </h3>
                  <div className={styles.attackMetrics}>
                    <p><strong>Avalanche:</strong> {diffAverageAvalanche.toFixed(2)}%</p>
                    <p><strong>Tempo médio por rodada geral:</strong> {diffAverageRequestTime.toFixed(1)} ms</p>
                    {diffRuns[0].result.mode === 'individual' ? (
                      <p><strong>Amostras separadas por rodada:</strong> {diffRuns[0].result.samples.length}</p>
                    ) : (
                      <p>
                        <strong>Bits simultâneos por comparação:</strong>{' '}
                        {diffRuns[0].result.samples[0]?.flippedBitCount ?? 0}
                      </p>
                    )}
                  </div>
                </div>
                <details key={`diff-${attackResultRevision.differential}`} className={styles.attackRunsDisclosure}>
                  <summary className={styles.attackRunsToggle}>
                    <span className={styles.attackRunsClosed}>Expandir rodadas gerais ({diffRuns.length})</span>
                    <span className={styles.attackRunsOpen}>Recolher rodadas gerais</span>
                  </summary>
                  <div className={styles.attackRunList} aria-label="Rodadas gerais do ataque diferencial">
                    {diffRuns.map(({ run: runNumber, result, requestMs }) => {
                      const roundAverage = result.samples.reduce(
                        (sum, sample) => sum + sample.avalanchePercent,
                        0,
                      ) / Math.max(1, result.samples.length);

                      return (
                        <article className={styles.attackRun} key={runNumber}>
                          <p>
                            <strong>Rodada geral {runNumber}:</strong> avalanche {roundAverage.toFixed(2)}% ·{' '}
                            {result.mode === 'individual'
                              ? `${result.samples.length} sub-rodadas bit-a-bit`
                              : `${result.samples[0]?.flippedBitCount ?? 0} bits alterados juntos`} ·{' '}
                            {requestMs.toFixed(1)} ms
                          </p>
                          <p className={styles.meta}>
                            {result.mode === 'individual' ? 'Sequência de bits testados:' : 'Bits alterados juntos:'}{' '}
                            {result.samples
                              .flatMap((sample) => sample.flippedBitPositions)
                              .join(', ')}
                          </p>
                          <details className={styles.attackRunsDisclosure}>
                            <summary className={styles.attackRunsToggle}>
                              {result.mode === 'individual'
                                ? `Ver sub-rodadas bit-a-bit (${result.samples.length})`
                                : 'Ver comparação simultânea'}
                            </summary>
                            <div className={styles.attackRunList} aria-label={`Resultados bit-a-bit da rodada geral ${runNumber}`}>
                              {result.samples.map((sample, sampleIndex) => (
                                <article
                                  className={styles.attackRun}
                                  key={`${runNumber}-${sampleIndex}-${sample.flippedBitPositions[0]}`}
                                >
                                  <p>
                                    <strong>
                                      {result.mode === 'individual'
                                        ? `Sub-rodada ${sampleIndex + 1}: bit ${sample.flippedBitPositions[0]} invertido`
                                        : `Comparação: ${sample.flippedBitCount} bits invertidos juntos (${sample.flippedBitPositions.join(', ')})`}
                                    </strong>{' '}·{' '}
                                    avalanche {sample.avalanchePercent}% ({sample.changedBits}/{sample.totalBitsCompared} bits) ·{' '}
                                    {sample.strongAvalanche ? 'difusão forte' : 'difusão fraca'}
                                  </p>
                                </article>
                              ))}
                            </div>
                          </details>
                        </article>
                      );
                    })}
                  </div>
                </details>
              </>
            ) : null}
          </section>
          </div>

          <div
            id="attack-panel-statistical"
            role="tabpanel"
            aria-labelledby="attack-tab-statistical"
            className={styles.attackTabPanel}
            hidden={activeAttackTab !== 'statistical'}
          >
          <section className={`${styles.attackCard} ${styles.attackMethod}`} aria-labelledby="statistical-heading">
            <div className={styles.attackMethodHeader}>
              <div className={styles.attackMethodTitleRow}>
                <h2 id="statistical-heading" className={styles.attackMethodTitle}>Estatístico</h2>
                <button
                  type="button"
                  className={styles.attackHelpToggle}
                  aria-label="Explicação do teste estatístico"
                  aria-expanded={attackHelpOpen.statistical}
                  aria-controls="attack-help-statistical"
                  onClick={() => setAttackHelpOpen((current) => ({ ...current, statistical: !current.statistical }))}
                >
                  ?
                </button>
              </div>
              <p className={styles.meta}>
                Analisa frequências de bytes em várias cifras independentes; uma amostra maior dá mais dados ao χ².
              </p>
            </div>
            {attackHelpOpen.statistical ? (
              <div id="attack-help-statistical" className={styles.attackHelpPanel} role="note">
                <h3>Como funciona o teste estatístico</h3>
                <p>
                  O sistema cifra o mesmo plaintext várias vezes, com novas chaves/nonces, junta os bytes dos
                  ciphertexts e conta quantas vezes cada valor de byte (00–FF) aparece.
                </p>
                <p>
                  O χ² compara as frequências observadas com as esperadas sob uma distribuição uniforme. O p-valor é a
                  probabilidade, assumindo essa hipótese e as condições do teste, de obter um χ² igual ou maior
                  que o observado. Ele não é a probabilidade de a hipótese ser verdadeira nem de o cipher ser
                  seguro. Com p &lt; 0,05, há evidência de desvio; com p ≥ 0,05, não há evidência suficiente para
                  rejeitar a hipótese — isso não prova que a distribuição seja uniforme.
                </p>
                <p>
                  “Cifras por amostra” aumenta a quantidade de bytes; o teste exige pelo menos 5 ocorrências
                  esperadas por valor para uma interpretação adequada. Mesmo sem desvio detectado, o teste olha
                  apenas frequências de bytes: não mede correlações, previsibilidade da chave, integridade nem
                  resistência a outros ataques. Uma cifra insegura ainda pode produzir frequências aparentemente
                  uniformes. As cifras usam novas chaves/nonces; portanto, o resultado descreve essa amostragem,
                  não uma prova de segurança do cipher. O jogo continua usando AES-GCM/BCrypt.
                </p>
              </div>
            ) : null}
            <div className={styles.attackInputs}>
              <TextField
                label="Cifras por amostra (1–100)"
                name="statSampleCount"
                type="number"
                min={1}
                max={100}
                step={1}
                value={statSampleCount}
                hint="Quantidade de ciphertexts agregados em cada análise; inválido volta a 1."
                onChange={(e) => setStatSampleCount(e.target.value)}
                onBlur={(e) => setStatSampleCount(normalizeIntegerInput(e.currentTarget.value, 1, 100, 1))}
              />
              <TextField
                label="Execuções (1–30)"
                name="statRunCount"
                type="number"
                min={1}
                max={MAX_ATTACK_RUNS}
                step={1}
                value={statRunCount}
                hint="Repete a análise completa com novas cifras."
                onChange={(e) => setStatRunCount(e.target.value)}
                onBlur={(e) => setStatRunCount(normalizeIntegerInput(e.currentTarget.value, 1, MAX_ATTACK_RUNS, 1))}
              />
            </div>
            <div className={styles.actions}>
              <Button
                type="button"
                disabled={busy}
                onClick={() => {
                  const requestedRuns = normalizeIntegerInput(statRunCount, 1, MAX_ATTACK_RUNS, 1);
                  const requestedSamples = normalizeIntegerInput(statSampleCount, 1, 100, 1);
                  setStatRunCount(requestedRuns);
                  setStatSampleCount(requestedSamples);
                  void runAttackBatch(
                    'Estatístico',
                    'statistical',
                    requestedRuns,
                    setStatRuns,
                    () => labStatistical(attackPlain, Number(requestedSamples), seed),
                  );
                }}
              >
                Rodar estatístico
              </Button>
            </div>
            {attackProgress?.label === 'Estatístico' ? (
              <p className={styles.attackProgress} role="status" aria-live="polite">
                {attackProgress.label}: execução {attackProgress.current}/{attackProgress.total} ·{' '}
                {attackProgress.elapsedSeconds}s nesta execução
              </p>
            ) : null}
            {statRuns.length > 0 ? (
              <>
                <div className={styles.attackSummary}>
                  <h3 className={styles.sub}>Médias · Estatístico ({statRuns.length} execuções)</h3>
                  <div className={styles.attackMetrics}>
                    <p><strong>Qui-quadrado médio:</strong> {statAverageChiSquare.toFixed(2)}</p>
                    <p>
                      <strong>Sem desvio detectado (p ≥ 0,05):</strong>{' '}
                      {statNoDeviationCount}/{statEvaluableCount} avaliáveis
                    </p>
                    <p><strong>Amostras inconclusivas:</strong> {statInsufficientCount}</p>
                    <p><strong>Cifras por amostra:</strong> {statRuns[0].result.sampleCount}</p>
                    <p><strong>Tempo médio:</strong> {statAverageRequestTime.toFixed(1)} ms</p>
                  </div>
                </div>
                <details key={`stat-${attackResultRevision.statistical}`} className={styles.attackRunsDisclosure}>
                  <summary className={styles.attackRunsToggle}>
                    <span className={styles.attackRunsClosed}>Expandir rodadas ({statRuns.length})</span>
                    <span className={styles.attackRunsOpen}>Recolher rodadas</span>
                  </summary>
                  <div className={styles.attackRunList} aria-label="Resultados individuais do ataque estatístico">
                    {statRuns.map(({ run: runNumber, result, requestMs }) => (
                      <article className={styles.attackRun} key={runNumber}>
                        <p>
                          <strong>Execução {runNumber}:</strong> χ² {result.chiSquare} · p-valor {formatPValue(result.pValue)} ·{' '}
                          {result.sampleCount} cifras · {result.sampleBytes} bytes
                        </p>
                        <p>
                          <strong>Interpretação:</strong>{' '}
                          {!result.sufficientSample
                            ? 'inconclusiva — amostra curta'
                            : result.looksUniform
                              ? 'sem desvio significativo detectado'
                              : 'desvio significativo detectado'}
                        </p>
                        <p>{result.analysis}</p>
                        <p className={styles.meta}>
                          Frequência esperada por valor de byte: {result.uniformExpected.toFixed(2)}
                          {result.sufficientSample ? '' : ' (abaixo do mínimo recomendado de 5)'}
                        </p>
                        <p className={styles.meta}>
                          Bytes mais frequentes: {Object.entries(result.topFrequencies)
                            .slice(0, 6)
                            .map(([byte, count]) => `${byte}: ${count}`)
                            .join(' · ') || 'sem dados'}
                        </p>
                        <p className={styles.meta}>Tempo da requisição: {requestMs.toFixed(1)} ms</p>
                      </article>
                    ))}
                    <p className={styles.meta}>Frequências de bytes da última execução</p>
                    <BarChart
                      items={Object.entries(statRuns[statRuns.length - 1].result.topFrequencies).map(
                        ([label, value]) => ({ label, value }),
                      )}
                    />
                  </div>
                </details>
              </>
            ) : null}
          </section>
          </div>
        </div>
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
