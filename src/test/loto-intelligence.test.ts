import { describe, expect, it } from "vitest";
import {
  calculateStats, combinations, isValidDraw, jackpotChance,
  parseHistory, randomTicket, simulatedHistory,
} from "../lib/loto-intelligence";

describe("motor de loterias", () => {
  it("usa o universo combinatório correto", () => {
    expect(combinations(25, 15)).toBe(3_268_760);
    expect(combinations(60, 6)).toBe(50_063_860);
    expect(jackpotChance("lotofacil")).toBeCloseTo(1 / 3_268_760);
    expect(jackpotChance("megasena")).toBeCloseTo(1 / 50_063_860);
  });

  it("recusa concursos impossíveis ou com dezenas repetidas", () => {
    expect(isValidDraw({ contest: 100, numbers: [1, 2, 3, 4, 5, 5] }, "megasena")).toBe(false);
    expect(isValidDraw({ contest: 100, numbers: [1, 2, 3, 4, 5, 61] }, "megasena")).toBe(false);
    expect(isValidDraw({ contest: 100, numbers: [1, 2, 3, 4, 5, 6] }, "megasena")).toBe(true);
  });

  it("importa CSV sem confundir a data com dezenas", () => {
    const draws = parseHistory("Concurso;Data;1;2;3;4;5;6\n100;01/01/2025;01;02;03;04;05;06\n101;02/01/2025;07;08;09;10;11;12", "megasena");
    expect(draws).toHaveLength(2);
    expect(draws[1].numbers).toEqual([7, 8, 9, 10, 11, 12]);
    expect(draws[0].date).toBe("01/01/2025");
  });

  it("importa array JSON no estilo da API Caixa", () => {
    const draws = parseHistory(JSON.stringify([
      { numero: 100, dataApuracao: "01/01/2025", listaDezenas: ["01", "02", "03", "04", "05", "06"] },
    ]), "megasena");
    expect(draws).toHaveLength(1);
    expect(draws[0].contest).toBe(100);
  });

  it("deduplica concursos e calcula frequências corretamente", () => {
    const draws = parseHistory("100;01 02 03 04 05 06\n100;07 08 09 10 11 12\n101;07 08 09 10 11 12", "megasena");
    const stats = calculateStats(draws, "megasena");
    expect(stats.draws).toBe(2);
    expect(stats.counts[6].count).toBe(2);
    expect(stats.counts[0].count).toBe(0);
    expect(stats.counts[0].expected).toBeCloseTo(0.2);
  });

  it("gera demonstração determinística e jogos válidos", () => {
    expect(simulatedHistory("lotofacil", 3)).toEqual(simulatedHistory("lotofacil", 3));
    for (let i = 0; i < 20; i++) {
      expect(isValidDraw({ contest: i, numbers: randomTicket("lotofacil") }, "lotofacil")).toBe(true);
    }
  });

  it("não aceita histórico incompatível", () => {
    expect(() => parseHistory("123;01;02;03", "megasena")).toThrow(/inválidas/);
  });
});
