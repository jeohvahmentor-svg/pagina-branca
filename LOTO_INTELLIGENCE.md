# Loto Intelligence — MVP

Plataforma independente de análise estatística de loterias, construída do zero no projeto `pagina-branca` (TanStack Start/React/Vite).

## Escopo desta primeira entrega
- Interface SaaS responsiva, modo escuro, seleção Lotofácil/Mega-Sena.
- Dados sintéticos claramente rotulados como **demonstração**.
- Importação local de CSV/TXT ou JSON (inclusive formato `[{ "numero":123, "listaDezenas":[...] }]`).
- Validação de dezenas, concursos e duplicatas; estatísticas de ocorrência, pares, soma, paridade.
- Visualização de frequências e mapa de dezenas.
- Gerador de combinações aleatórias com probabilidades matemáticas corretas.
- Jarvis guiada, **sem IA externa conectada**: respostas computadas localmente sobre os dados importados.
- Áreas e preços previstos: grátis, R$ 9,90, R$ 19,90 e reserva para publicidade.

## Estado real de cada funcionalidade

| Recurso | Status |
| --- | --- |
| Interface, estatísticas e importação | Implementação frontend inicial |
| Dados oficiais em atualização automática | Não implementado |
| Backend e persistência na VPS | Não implementado |
| Autenticação, assinatura, cobrança | Não implementado |
| Machine learning, backtesting e modelos preditivos | Não implementado |
| Jarvis com LLM, áudio e voz | Não implementado |
| Registro de apostas, bolões, sorteios premiados | Fora do escopo |
| Espaços publicitários | Reservados, sem gestão ou cobrança |

**Atenção:** dados importados pelo usuário não são certificados pela Caixa. Os dados de demo são *sintéticos* e não devem ser divulgados como histórico real. Estatísticas passadas não demonstram previsibilidade de extrações independentes e justas.

## Como desenvolver

```bash
npm install
npm run dev
npm run test
npm run build
```

### Como importar os concursos
Clique **Importar histórico**, selecione um arquivo ou cole dados no formato:

```text
Concurso;Data;Bola1;Bola2;Bola3;Bola4;Bola5;Bola6
123;01/01/2026;01;02;03;04;05;06
124;02/01/2026;07;08;09;10;11;12
```

O exemplo acima é apenas ilustrativo e NÃO representa resultados oficiais. Use um histórico correspondente à modalidade selecionada. Os dados ficam apenas no estado React da sessão atual e se perdem ao recarregar.

## Auditoria de referências / engenharia reversa
Arquiteturas públicas estudadas:
- `morluto/rea`: ferramenta de engenharia reversa para investigação autorizada. O REA **não é motor estatístico** e não foi executado por esta integração; usamos acesso ao código-fonte via GitHub.
- `antonioneto1/loto_analyzer`: funcionalidades de exemplo como painéis, ML, ciclos e simulações. **Não foi copiado o código**, pois a permissão de reutilização comercial não foi comprovada.
- `wellgusmao-developer/megasena`: funcionalidades simples de análise e gráfico. **Não foi incorporado código de terceiros**; esta implementação é própria.

Para operar REA localmente com um projeto que você tem permissão de inspecionar, siga o [README oficial](https://github.com/morluto/rea) e rode `npx rea-agents setup` no seu computador, fora do repositório-alvo, após revisar o instalador. REA será útil futuramente em inspeções autorizadas de aplicativos sem código-fonte.

## Próximas fases
1. Fontes verificáveis da Caixa, importação robusta e trilha de integridade de dados.
2. Backend Python/FastAPI na VPS, autenticação, isolamentos e banco PostgreSQL.
3. Laboratório de backtesting cronológico rigoroso com baseline aleatório e orçamento equivalente.
4. Jarvis LLM com consultas ao motor estatístico, limites de uso e custo.
5. Assinaturas de R$ 5–20 e anúncios, sujeitos a regras de consumo, privacidade e publicidade.

Sem white label. Sem promessas de acerto. Sem funcionalidade de aposta ou roleta com prêmio em dinheiro.
