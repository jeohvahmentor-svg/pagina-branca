import { createServerFn } from "@tanstack/react-start";
import { isValidDraw, type Draw, type LotteryId } from "./loto-intelligence";

type CaixaRequest = { lottery: LotteryId; limit?: number };
type CaixaResponse = {
  draws: Draw[];
  latestContest: number;
  latestDate: string;
  checkedAt: string;
  missing: number[];
};

const API = "https://servicebus2.caixa.gov.br/portaldeloterias/api";
const ALLOWED = new Set(["lotofacil", "megasena"]);
const CACHE_TTL_MS = 15 * 60 * 1000;
const responseCache = new Map<string, { expiry: number; value: CaixaResponse }>();

async function loadContest(lottery: LotteryId, contest?: number): Promise<Draw> {
  const path = contest ? `/${contest}` : "";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(`${API}/${lottery}${path}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`A Caixa respondeu HTTP ${response.status}.`);
    const raw: unknown = await response.json();
    if (!raw || typeof raw !== "object") throw new Error("Formato inesperado na resposta da Caixa.");
    const data = raw as Record<string, unknown>;
    const numbers = data.listaDezenas ?? data.dezenasSorteadasOrdemSorteio;
    if (!Array.isArray(numbers)) throw new Error("Resposta da Caixa sem dezenas sorteadas.");
    const draw: Draw = {
      contest: Number(data.numero),
      numbers: numbers.map(Number).sort((a, b) => a - b),
      date: typeof data.dataApuracao === "string" ? data.dataApuracao : undefined,
    };
    if (!isValidDraw(draw, lottery) || (contest && draw.contest !== contest)) {
      throw new Error("Dados inconsistentes na resposta da Caixa.");
    }
    return draw;
  } finally {
    clearTimeout(timeout);
  }
}

/** Somente leitura. Executado no servidor, nunca diretamente pelo navegador. */
export const getCaixaResults = createServerFn({ method: "GET" })
  .validator((data: CaixaRequest) => {
    if (!data || !ALLOWED.has(data.lottery)) throw new Error("Modalidade não permitida.");
    const limit = Math.min(30, Math.max(1, Math.trunc(Number(data.limit) || 20)));
    return { lottery: data.lottery, limit };
  })
  .handler(async ({ data }): Promise<CaixaResponse> => {
    const key = `${data.lottery}:${data.limit}`;
    const hit = responseCache.get(key);
    if (hit && hit.expiry > Date.now()) return hit.value;
    const latest = await loadContest(data.lottery);
    const from = Math.max(1, latest.contest - data.limit + 1);
    const previous = Array.from({ length: latest.contest - from }, (_, i) => latest.contest - i - 1);
    const found: Draw[] = [latest];
    const missing: number[] = [];
    for (let offset = 0; offset < previous.length; offset += 4) {
      const chunk = previous.slice(offset, offset + 4);
      const results = await Promise.allSettled(chunk.map((n) => loadContest(data.lottery, n)));
      results.forEach((r, i) => {
        if (r.status === "fulfilled") found.push(r.value);
        else missing.push(chunk[i]);
      });
    }
    found.sort((a, b) => a.contest - b.contest);
    if (found.length !== data.limit) {
      throw new Error(`A Caixa respondeu parcialmente (${found.length}/${data.limit} concursos). Tente novamente depois ou importe o histórico oficial.`);
    }
    const result: CaixaResponse = {
      draws: found,
      latestContest: latest.contest,
      latestDate: latest.date ?? "",
      checkedAt: new Date().toISOString(),
      missing,
    };
    responseCache.set(key, { expiry: Date.now() + CACHE_TTL_MS, value: result });
    return result;
  });
