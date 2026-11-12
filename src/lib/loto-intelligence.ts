/** Motor estatístico independente. Nenhum algoritmo aqui promete previsão de sorteios. */
export type LotteryId = "megasena" | "lotofacil";
export type Draw = { contest: number; numbers: number[]; date?: string };
export type HistorySource = "demo" | "imported";
export type LotteryConfig = {
  id: LotteryId;
  title: string;
  maxNumber: number;
  drawnNumbers: number;
};

export const LOTTERIES: Record<LotteryId, LotteryConfig> = {
  megasena: { id: "megasena", title: "Mega-Sena", maxNumber: 60, drawnNumbers: 6 },
  lotofacil: { id: "lotofacil", title: "Lotofácil", maxNumber: 25, drawnNumbers: 15 },
};

export function combinations(n: number, k: number): number {
  if (k < 0 || n < k) return 0;
  let result = 1;
  for (let i = 1; i <= Math.min(k, n - k); i += 1) result = (result * (n - i + 1)) / i;
  return Math.round(result);
}

export function jackpotChance(id: LotteryId, distinctTickets = 1): number {
  const cfg = LOTTERIES[id];
  return Math.min(Math.max(0, distinctTickets), combinations(cfg.maxNumber, cfg.drawnNumbers)) /
    combinations(cfg.maxNumber, cfg.drawnNumbers);
}

export function isValidDraw(draw: Draw, id: LotteryId): boolean {
  const cfg = LOTTERIES[id];
  return Number.isSafeInteger(draw.contest) && draw.contest >= 0 &&
    draw.numbers.length === cfg.drawnNumbers &&
    new Set(draw.numbers).size === cfg.drawnNumbers &&
    draw.numbers.every((n) => Number.isSafeInteger(n) && n >= 1 && n <= cfg.maxNumber);
}

export function calculateStats(draws: Draw[], id: LotteryId) {
  const cfg = LOTTERIES[id];
  const valid = draws.filter((d) => isValidDraw(d, id));
  const counts = Array.from({ length: cfg.maxNumber }, (_, i) => ({
    number: i + 1, count: 0, expected: 0,
  }));
  const pairs = new Map<string, number>();
  let totalEven = 0;
  let sumOfSums = 0;
  valid.forEach(({ numbers }) => {
    const sorted = [...numbers].sort((a, b) => a - b);
    sumOfSums += sorted.reduce((a, b) => a + b, 0);
    sorted.forEach((n) => { counts[n - 1].count += 1; if (n % 2 === 0) totalEven += 1; });
    for (let i = 0; i < sorted.length; i += 1) {
      for (let j = i + 1; j < sorted.length; j += 1) {
        const key = `${sorted[i]}-${sorted[j]}`;
        pairs.set(key, (pairs.get(key) ?? 0) + 1);
      }
    }
  });
  counts.forEach((x) => { x.expected = valid.length * cfg.drawnNumbers / cfg.maxNumber; });
  const ranked = [...counts].sort((a, b) => b.count - a.count || a.number - b.number);
  const topPairs = [...pairs.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 10).map(([pair, count]) => ({ pair, count }));
  const totalBalls = valid.length * cfg.drawnNumbers;
  return {
    draws: valid.length,
    counts, ranked, topPairs, totalEven,
    evenShare: totalBalls ? totalEven / totalBalls : 0,
    meanSum: valid.length ? sumOfSums / valid.length : 0,
    last: [...valid].sort((a, b) => b.contest - a.contest)[0] ?? null,
  };
}

/** Demo sintética e determinística, jamais rotulada como resultado oficial. */
export function simulatedHistory(id: LotteryId, count = 120): Draw[] {
  const cfg = LOTTERIES[id];
  let seed = id === "megasena" ? 328472 : 173943;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  return Array.from({ length: count }, (_, index) => {
    const pool = Array.from({ length: cfg.maxNumber }, (_, j) => j + 1);
    for (let j = pool.length - 1; j > 0; j--) {
      const k = Math.floor(random() * (j + 1));
      [pool[j], pool[k]] = [pool[k], pool[j]];
    }
    return { contest: index + 1, numbers: pool.slice(0, cfg.drawnNumbers).sort((a, b) => a - b) };
  });
}

export function randomTicket(id: LotteryId): number[] {
  const cfg = LOTTERIES[id];
  const pool = Array.from({ length: cfg.maxNumber }, (_, j) => j + 1);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, cfg.drawnNumbers).sort((a, b) => a - b);
}

function normalizeNumbers(value: unknown): number[] {
  if (Array.isArray(value)) return value.map(Number);
  if (typeof value === "string") return (value.match(/\d+/g) ?? []).map(Number);
  return [];
}

/**
 * Formatos: JSON Caixa ([{numero,listaDezenas}]),
 * ou linhas "concurso;data;01;02;...", "concurso;01 02 03..." e
 * "concurso,01,02,03,...". Duplicatas de concurso usam a última ocorrência.
 */
export function parseHistory(input: string, id: LotteryId): Draw[] {
  const cfg = LOTTERIES[id];
  const trimmed = input.trim();
  if (!trimmed) throw new Error("Cole um histórico ou selecione um arquivo.");
  const items: Draw[] = [];
  if (trimmed.startsWith("[")) {
    let data: unknown;
    try { data = JSON.parse(trimmed); } catch { throw new Error("JSON inválido."); }
    if (!Array.isArray(data)) throw new Error("O JSON deve conter uma lista de concursos.");
    for (const entry of data) {
      if (typeof entry !== "object" || entry === null) continue;
      const row = entry as Record<string, unknown>;
      const contest = Number(row.numero ?? row.concurso ?? row.contest ?? row.numeroConcurso);
      const numbers = normalizeNumbers(row.listaDezenas ?? row.dezenas ?? row.numbers ?? row.bolas);
      const date = String(row.dataApuracao ?? row.data ?? "").trim() || undefined;
      items.push({ contest, numbers, date });
    }
  } else {
    for (const raw of trimmed.split(/\r?\n/)) {
      const line = raw.trim().replace(/^\uFEFF/, "");
      if (!line || line.startsWith("#")) continue;
      const cells = line.includes(";") ? line.split(";") :
        line.includes("\t") ? line.split("\t") : line.split(",");
      const contest = Number(cells[0]?.trim());
      if (!Number.isSafeInteger(contest) || contest < 0) continue;
      let fields = cells.slice(1).map((x) => x.trim()).filter(Boolean);
      let date: string | undefined;
      if (fields[0] && /^\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}$/.test(fields[0])) {
        date = fields[0]; fields = fields.slice(1);
      }
      const numbers: number[] = [];
      for (const field of fields) {
        const parts = normalizeNumbers(field);
        for (const number of parts) {
          if (numbers.length < cfg.drawnNumbers) numbers.push(number);
        }
        if (numbers.length >= cfg.drawnNumbers) break;
      }
      items.push({ contest, numbers, date });
    }
  }
  if (items.length === 0) throw new Error("Nenhum concurso reconhecido no arquivo.");
  const unique = new Map<number, Draw>();
  for (const draw of items) {
    if (!isValidDraw(draw, id)) throw new Error(`Concurso ${draw.contest || "desconhecido"} tem dezenas inválidas para ${cfg.title}.`);
    unique.set(draw.contest, { ...draw, numbers: [...draw.numbers].sort((a, b) => a - b) });
  }
  return [...unique.values()].sort((a, b) => a.contest - b.contest);
}
