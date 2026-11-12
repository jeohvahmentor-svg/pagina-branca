import { createFileRoute } from "@tanstack/react-router";
import LotoDashboard from "../components/LotoDashboard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Loto Intelligence | Estatística de loterias" },
      { name: "description", content: "Laboratório independente de análise estatística para Mega-Sena e Lotofácil. Simulações transparentes, probabilidades e estudo de padrões históricos." },
      { property: "og:title", content: "Loto Intelligence" },
      { property: "og:description", content: "Analise concursos, explore probabilidades e simule combinações com transparência." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LotoDashboard,
});
