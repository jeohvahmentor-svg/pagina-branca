import { useMemo, useRef, useState } from "react";
import {
  Activity, ArrowRight, BarChart3, Bot, CheckCircle2, ChevronDown, CircleHelp,
  Crown, Database, FlaskConical, LayoutDashboard, Megaphone, Menu, Plus,
  RotateCcw, ShieldCheck, Shuffle, Sparkles, Target, Upload, X,
} from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";
import {
  calculateStats, combinations, jackpotChance, LOTTERIES, parseHistory,
  randomTicket, simulatedHistory, type Draw, type HistorySource, type LotteryId,
} from "../lib/loto-intelligence";
import "./loto-dashboard.css";

type View = "overview" | "patterns" | "simulator" | "jarvis" | "plans";
type Dataset = { draws: Draw[]; source: HistorySource };
const nav = [
  { id: "overview", label: "Visão geral", icon: LayoutDashboard },
  { id: "patterns", label: "Padrões históricos", icon: BarChart3 },
  { id: "simulator", label: "Simulador", icon: Shuffle },
  { id: "jarvis", label: "Jarvis Estatístico", icon: Bot },
  { id: "plans", label: "Planos", icon: Crown },
] as const;
const fmt = (n: number) => new Intl.NumberFormat("pt-BR").format(n);
const ball = (n: number) => String(n).padStart(2, "0");

export default function LotoDashboard() {
  const [view, setView] = useState<View>("overview");
  const [lottery, setLottery] = useState<LotteryId>("lotofacil");
  const [datasets, setDatasets] = useState<Record<LotteryId, Dataset>>({
    lotofacil: { source: "demo", draws: simulatedHistory("lotofacil") },
    megasena: { source: "demo", draws: simulatedHistory("megasena") },
  });
  const [mobileMenu, setMobileMenu] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [input, setInput] = useState("");
  const [importError, setImportError] = useState("");
  const [importSuccess, setImportSuccess] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [ticket, setTicket] = useState<number[]>([]);
  const [saved, setSaved] = useState<Record<LotteryId, number[][]>>({ lotofacil: [], megasena: [] });
  const [question, setQuestion] = useState("frequencia");
  const cfg = LOTTERIES[lottery];
  const current = datasets[lottery];
  const stats = useMemo(() => calculateStats(current.draws, lottery), [current, lottery]);
  const totalComb = combinations(cfg.maxNumber, cfg.drawnNumbers);
  const ranking = stats.ranked.slice(0, 12);
  const minDraw = stats.draws > 0 ? Math.min(...current.draws.map((d) => d.contest)) : 0;
  const maxDraw = stats.last?.contest ?? 0;
  const isDemo = current.source === "demo";

  const changeLottery = (next: LotteryId) => {
    setLottery(next);
    setTicket([]);
    setImportSuccess("");
  };
  const importData = () => {
    try {
      const draws = parseHistory(input, lottery);
      setDatasets((prev) => ({ ...prev, [lottery]: { source: "imported", draws } }));
      setImportOpen(false);
      setInput("");
      setImportError("");
      setImportSuccess(`${fmt(draws.length)} concursos importados. Esses dados foram fornecidos por você e não foram validados com a Caixa.`);
      setView("overview");
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Erro ao importar histórico.");
    }
  };
  const restoreDemo = () => {
    setDatasets((prev) => ({ ...prev, [lottery]: { source: "demo", draws: simulatedHistory(lottery) } }));
    setImportSuccess("");
    setTicket([]);
  };
  const createTicket = () => setTicket(randomTicket(lottery));
  const saveTicket = () => {
    if (ticket.length !== cfg.drawnNumbers) return;
    setSaved((prev) => {
      const existing = prev[lottery];
      if (existing.some((t) => t.join(",") === ticket.join(","))) return prev;
      return { ...prev, [lottery]: [...existing, [...ticket]] };
    });
  };
  const answers: Record<string, { title: string; content: string }> = {
    frequencia: {
      title: "O que os dados dizem sobre as dezenas?",
      content: `Nesta base de ${fmt(stats.draws)} concursos, a dezena ${ball(stats.ranked[0]?.number ?? 1)} apareceu ${fmt(stats.ranked[0]?.count ?? 0)} vezes. O valor teórico esperado por dezena é de aproximadamente ${stats.draws ? stats.counts[0].expected.toFixed(1).replace(".", ",") : 0} ocorrências. Diferenças históricas, por si só, não elevam a chance dessa dezena aparecer no próximo sorteio.`,
    },
    pares: {
      title: "Pares mais frequentes",
      content: stats.topPairs[0]
        ? `O par ${stats.topPairs[0].pair.replace("-", " e ")} apareceu em ${stats.topPairs[0].count} concursos da base carregada. Antes de chamar isso de padrão preditivo, precisamos avaliar significância e testar em sorteios posteriores não utilizados na seleção.`
        : "Importe resultados para analisar pares de dezenas.",
    },
    chance: {
      title: "Probabilidade real de acertar",
      content: `Uma combinação simples de ${cfg.drawnNumbers} dezenas entre ${cfg.maxNumber} tem 1 chance em ${fmt(totalComb)} de acertar todas as dezenas, em um sorteio justo. A escolha por IA, por frequência ou aleatoriamente não altera essa chance.`,
    },
    testes: {
      title: "Como comprovar um método?",
      content: "Treinamos apenas com concursos anteriores, registramos a combinação antes do próximo resultado e comparamos muitos concursos futuros contra jogos aleatórios equivalentes, sempre com o mesmo orçamento. Esta versão ainda não executa machine learning nem possui previsão validada.",
    },
  };

  return (
    <div className="loto-shell">
      <aside className={`loto-sidebar ${mobileMenu ? "is-open" : ""}`}>
        <div className="loto-brand"><div className="loto-brand-icon"><Activity size={23}/></div><div><strong>LOTO<span>INTELLIGENCE</span></strong><small>ANALYTICS PLATFORM</small></div></div>
        <div className="loto-nav-title">PLATAFORMA</div>
        <nav className="loto-navigation" aria-label="Navegação principal">
          {nav.map((item) => { const Icon = item.icon; return (
            <button key={item.id} onClick={() => {setView(item.id);setMobileMenu(false);}} className={view === item.id ? "active" : ""}>
              <Icon size={18}/><span>{item.label}</span>{item.id === "jarvis" && <span className="loto-nav-new">BETA</span>}
            </button>
          ); })}
        </nav>
        <div className="loto-sidebar-bottom">
          <div className="loto-ad-mini"><Megaphone size={18}/><strong>Seu anúncio aqui</strong><span>Espaço reservado para patrocinadores.</span></div>
          <div className="loto-sidebar-foot"><ShieldCheck size={16}/> Plataforma independente, sem apostas.</div>
        </div>
      </aside>
      {mobileMenu && <button className="loto-backdrop" aria-label="Fechar menu" onClick={() => setMobileMenu(false)}/>}
      <main className="loto-main">
        <header className="loto-topbar">
          <div className="loto-left-head">
            <button className="loto-icon-button loto-menu-button" aria-label="Abrir menu" onClick={() => setMobileMenu(true)}><Menu size={21}/></button>
            <div className="loto-breadcrumb">Loto Intelligence <span>/</span> <strong>{nav.find((n) => n.id === view)?.label}</strong></div>
          </div>
          <div className="loto-top-actions">
            <span className="loto-mode-tag"><span className="loto-dot"/>{isDemo ? "Dados simulados" : "Dados importados"}</span>
            <button className="loto-outline-button" onClick={() => {setImportOpen(true);setImportError("");}}><Upload size={16}/><span>Importar histórico</span></button>
          </div>
        </header>
        <div className="loto-content">
          <div className="loto-headline-row">
            <div><div className="loto-eyebrow"><Sparkles size={14}/> INTELIGÊNCIA ESTATÍSTICA</div><h1>{view === "overview" ? "Visão geral" : nav.find((n) => n.id === view)?.label}</h1>
              <p>Explore resultados, simule combinações e investigue hipóteses com dados transparentes.</p>
            </div>
            <div className="loto-game-picker" role="group" aria-label="Escolher loteria">
              {(["lotofacil", "megasena"] as LotteryId[]).map((id) => <button key={id} onClick={() => changeLottery(id)} className={lottery === id ? "selected" : ""}>{LOTTERIES[id].title}</button>)}
            </div>
          </div>
          <div className={`loto-notice ${isDemo ? "loto-notice-demo" : ""}`}>
            <CircleHelp size={17}/>
            <span>{isDemo ? "Demonstração com 120 sorteios sintéticos. NÃO são concursos reais da Caixa. Importe resultados para obter estatísticas históricas." : "Histórico fornecido pelo usuário, sem validação automática junto à Caixa. Padrões passados não demonstram capacidade de prever sorteios futuros."}</span>
            {isDemo && <button onClick={() => setImportOpen(true)}>Importar dados <ArrowRight size={13}/></button>}
          </div>
          {importSuccess && <div className="loto-success"><CheckCircle2 size={17}/>{importSuccess}<button aria-label="Dispensar aviso" onClick={() => setImportSuccess("")}><X size={15}/></button></div>}

          {view === "overview" && <>
            <div className="loto-kpi-grid">
              <Kpi icon={<Database size={19}/>} label="Concursos na base" value={fmt(stats.draws)} foot={isDemo ? "Apenas demonstração" : `Concursos ${fmt(minDraw)} a ${fmt(maxDraw)}`}/>
              <Kpi icon={<Target size={19}/>} label="Combinações possíveis" value={fmt(totalComb)} foot="Apostas simples distintas"/>
              <Kpi icon={<Activity size={19}/>} label="Pares / ímpares" value={`${(stats.evenShare * 100).toFixed(1).replace(".", ",")}%`} foot="Participação de dezenas pares"/>
              <Kpi icon={<FlaskConical size={19}/>} label="Média da soma" value={stats.meanSum.toFixed(1).replace(".", ",")} foot="Soma de dezenas por concurso"/>
            </div>
            <div className="loto-two-col">
              <section className="loto-panel loto-chart-panel">
                <div className="loto-panel-heading"><div><span className="loto-panel-kicker">FREQUÊNCIA</span><h2>Dezenas em destaque</h2><p>As 12 mais frequentes no conjunto atual</p></div><span className="loto-subtle-chip">Histórico</span></div>
                <FrequencyChart counts={ranking} expected={stats.counts[0]?.expected ?? 0}/>
                <div className="loto-legend"><span><i className="loto-legend-accent"/>Ocorrências</span><span><i className="loto-legend-muted"/>Média teórica</span></div>
              </section>
              <section className="loto-panel">
                <div className="loto-panel-heading"><div><span className="loto-panel-kicker">ÚLTIMO REGISTRO</span><h2>{isDemo ? "Extração simulada" : `Concurso nº ${maxDraw}`}</h2><p>{isDemo ? "Dados sintéticos, apenas para explorar a interface" : stats.last?.date || "Sem data informada"}</p></div><span className="loto-status">{isDemo ? "DEMO" : "IMPORTADO"}</span></div>
                <div className="loto-balls">{stats.last?.numbers.map((n) => <span className="loto-ball" key={n}>{ball(n)}</span>)}</div>
                <div className="loto-divider"/>
                <div className="loto-metric-line"><span>Probabilidade do prêmio máximo</span><strong>1 em {fmt(totalComb)}</strong></div>
                <div className="loto-metric-line"><span>Apostas simples possíveis</span><strong>{fmt(totalComb)}</strong></div>
                <div className="loto-figure-foot">Nenhuma sequência é mais provável do que outra em um sorteio justo.</div>
              </section>
            </div>
            <div className="loto-two-col loto-bottom-grid">
              <section className="loto-panel"><div className="loto-panel-heading"><div><span className="loto-panel-kicker">COMBINAÇÕES</span><h2>Pares recorrentes</h2><p>Contagem de pares no histórico carregado</p></div><button className="loto-text-link" onClick={() => setView("patterns")}>Ver análise <ArrowRight size={15}/></button></div>
                <div className="loto-pair-list">{stats.topPairs.slice(0, 5).map((p, i) => <div className="loto-pair-row" key={p.pair}><span className="loto-rank">{String(i + 1).padStart(2, "0")}</span><span className="loto-pair-numbers">{p.pair.split("-").map((n) => ball(Number(n))).join(" + ")}</span><div className="loto-pair-track"><div style={{width: `${(p.count / (stats.topPairs[0]?.count || 1)) * 100}%`}}/></div><span>{p.count}x</span></div>)}</div>
              </section>
              <section className="loto-panel loto-promo-panel"><div className="loto-eyebrow"><Bot size={15}/> JARVIS ESTATÍSTICO</div><h2>Sua análise começa com uma pergunta.</h2><p>Entenda frequências, probabilidades e limites dos modelos sem promessas de resultados.</p><button className="loto-primary-button" onClick={() => setView("jarvis")}>Abrir Jarvis <ArrowRight size={17}/></button><div className="loto-orbit"><div className="loto-orbit-core"/><span/><span/></div></section>
            </div>
          </>}

          {view === "patterns" && <>
            <div className="loto-two-col">
              <section className="loto-panel loto-wide-panel"><div className="loto-panel-heading"><div><span className="loto-panel-kicker">MAPA DE FREQUÊNCIA</span><h2>Todas as dezenas</h2><p>Quanto mais forte a cor, maior a ocorrência na base</p></div><span className="loto-subtle-chip">{stats.draws} concursos</span></div>
                <div className="loto-heat-grid">{stats.counts.map(({number,count}) => { const max = Math.max(...stats.counts.map(x => x.count),1); return <div title={`Dezena ${ball(number)} — ${count} ocorrências`} key={number} className="loto-heat-cell" style={{backgroundColor:`oklch(0.21 ${(count/max*0.13).toFixed(3)} 142)`,borderColor:`oklch(0.38 ${(count/max*0.13).toFixed(3)} 142)`}}><strong>{ball(number)}</strong><small>{count}x</small></div>;})}</div>
              </section>
              <section className="loto-panel"><div className="loto-panel-heading"><div><span className="loto-panel-kicker">INTERPRETAÇÃO</span><h2>O que é um padrão?</h2></div></div>
                <div className="loto-explain-block"><ShieldCheck size={20}/><div><strong>Frequência não é previsão</strong><p>Mesmo dezenas com muitas ocorrências anteriores conservam a mesma probabilidade teórica no próximo sorteio justo.</p></div></div>
                <div className="loto-explain-block"><FlaskConical size={20}/><div><strong>Teste fora da amostra</strong><p>Uma hipótese só pode ser avaliada usando resultados futuros não utilizados na sua escolha.</p></div></div>
                <div className="loto-explain-block"><Activity size={20}/><div><strong>Sem dados fabricados</strong><p>Esta tela distingue explicitamente resultados sintéticos de arquivos importados pelo usuário.</p></div></div>
              </section>
            </div>
            <section className="loto-panel"><div className="loto-panel-heading"><div><span className="loto-panel-kicker">DISTRIBUIÇÃO</span><h2>12 dezenas mais frequentes</h2></div></div><FrequencyChart counts={ranking} expected={stats.counts[0]?.expected??0}/></section>
          </>}

          {view === "simulator" && <div className="loto-two-col">
            <section className="loto-panel"><div className="loto-panel-heading"><div><span className="loto-panel-kicker">LABORATÓRIO</span><h2>Gerador de combinações</h2><p>Seleção aleatória uniforme de {cfg.drawnNumbers} dezenas</p></div></div>
              <div className="loto-balls loto-sim-balls">{(ticket.length ? ticket : Array.from({length:cfg.drawnNumbers},(_,i)=>i+1)).map((n,i) => <span key={i} className={ticket.length ? "loto-ball" : "loto-ball lato-muted"}>{ticket.length ? ball(n) : "–"}</span>)}</div>
              <div className="loto-button-row"><button className="loto-primary-button" onClick={createTicket}><Shuffle size={17}/> Gerar jogo</button><button disabled={!ticket.length} className="loto-outline-button" onClick={saveTicket}><Plus size={16}/> Salvar na sessão</button></div>
              <p className="loto-disclaimer">Os jogos são aleatórios, não são registrados na Caixa e não recebem classificação de “mais prováveis”.</p>
            </section>
            <section className="loto-panel"><div className="loto-panel-heading"><div><span className="loto-panel-kicker">PROBABILIDADES</span><h2>Cobertura matemática</h2><p>Considerando bilhetes simples diferentes</p></div></div>
              <div className="loto-probability">1 em {fmt(totalComb)}</div><div className="loto-probability-caption">Chance do prêmio máximo com um único jogo</div>
              <div className="loto-divider"/>
              <div className="loto-metric-line"><span>Jogos salvos na sessão</span><strong>{saved[lottery].length}</strong></div>
              <div className="loto-metric-line"><span>Chance com jogos salvos*</span><strong>{(jackpotChance(lottery,saved[lottery].length)*100).toFixed(6).replace(".",",")}%</strong></div>
              <p className="loto-disclaimer">*Considera jogos diferentes no mesmo concurso. Não inclui o preço, as faixas menores ou possíveis prêmios compartilhados.</p>
              {saved[lottery].length>0 && <div className="loto-saved-list">{saved[lottery].slice(-5).map((numbers,i)=><div key={i}>{numbers.map(ball).join(" · ")}</div>)}<button className="loto-text-link" onClick={()=>setSaved(s=>({...s,[lottery]:[]}))}><RotateCcw size={14}/> Limpar jogos</button></div>}
            </section>
          </div>}

          {view === "jarvis" && <div className="loto-jarvis-layout">
            <section className="loto-panel loto-jarvis-hero"><div className="loto-jarvis-orb"><span/></div><div className="loto-eyebrow"><Sparkles size={15}/> ASSISTENTE ESTATÍSTICO • VERSÃO INICIAL</div><h2>JARVIS</h2><p>Consulte interpretações determinísticas a partir das estatísticas calculadas localmente.</p><span className="loto-subtle-chip">Sem conexão com modelo de IA nesta versão</span></section>
            <section className="loto-panel"><div className="loto-panel-heading"><div><span className="loto-panel-kicker">PERGUNTAS GUIADAS</span><h2>O que você quer investigar?</h2></div></div>
              <div className="loto-question-list">{[{id:"frequencia",name:"Quais dezenas aparecem mais?"},{id:"pares",name:"Quais pares são mais comuns?"},{id:"chance",name:"Qual é a chance real de ganhar?"},{id:"testes",name:"Como validar um algoritmo?"}].map(x=><button key={x.id} onClick={()=>setQuestion(x.id)} className={question===x.id?"selected":""}>{x.name}<ArrowRight size={15}/></button>)}</div>
              <div className="loto-answer"><div><Bot size={20}/><strong>{answers[question].title}</strong></div><p>{answers[question].content}</p></div>
            </section>
          </div>}

          {view === "plans" && <><div className="loto-pricing-intro"><span className="loto-panel-kicker">PREÇOS PREVISTOS — AINDA NÃO DISPONÍVEIS</span><h2>Inteligência estatística acessível.</h2><p>Sem venda de apostas, bolões ou garantias de acerto. Cobrança e login ainda não implementados.</p></div>
            <div className="loto-pricing-grid">{[
              {name:"Gratuito",price:"R$ 0",details:"Acesso a gráficos básicos",items:["Explorar demonstração","Importar resultados","Consulta às probabilidades"]},
              {name:"Inteligente",price:"R$ 9,90",details:"Análises e filtros avançados",items:["Tudo do gratuito","Histórico estatístico","Ferramentas de comparação"],featured:false},
              {name:"Pro IA",price:"R$ 19,90",details:"Laboratório e Jarvis",items:["Tudo do Inteligente","Relatórios avançados","Jarvis conectado ao motor de IA"],featured:true},
            ].map(p=><div className={`loto-price-card ${p.featured?"featured":""}`} key={p.name}><h3>{p.name}</h3><div className="loto-price">{p.price}<small>/mês</small></div><p>{p.details}</p><ul>{p.items.map(i=><li key={i}><CheckCircle2 size={16}/>{i}</li>)}</ul><button disabled>Em preparação</button></div>)}</div>
            <section className="loto-panel loto-ad-banner"><Megaphone size={24}/><div><strong>Espaços publicitários</strong><p>Áreas reservadas para parceiros. Nenhuma campanha ou transação é realizada nesta versão.</p></div></section>
          </>}
          <footer className="loto-footer"><span>Loto Intelligence • Protótipo independente</span><span>Sem vínculo com a Caixa • Sem previsões garantidas • Sem apostas</span></footer>
        </div>
      </main>

      {importOpen && <div className="loto-modal-layer" role="presentation" onMouseDown={(e)=>{if(e.target===e.currentTarget)setImportOpen(false);}}>
        <div className="loto-modal" role="dialog" aria-modal="true" aria-label="Importar resultados"><div className="loto-modal-head"><div><span className="loto-panel-kicker">DADOS HISTÓRICOS</span><h2>Importar concursos</h2></div><button className="loto-icon-button" onClick={()=>setImportOpen(false)} aria-label="Fechar"><X size={20}/></button></div>
          <p>Importe resultados da <strong>{cfg.title}</strong> em JSON ou CSV. Aceitamos o formato de linha <code>concurso;data;dezena1;dezena2;...</code> e JSON com <code>numero</code> e <code>listaDezenas</code>.</p>
          <input type="file" ref={fileRef} accept=".txt,.csv,.json,text/plain,application/json" hidden onChange={async(e)=>{const f=e.target.files?.[0];if(!f)return;setInput(await f.text());setImportError("");}}/>
          <button className="loto-file-select" onClick={()=>fileRef.current?.click()}><Upload size={18}/> Selecionar CSV, TXT ou JSON <ChevronDown size={16}/></button>
          <textarea value={input} onChange={e=>{setInput(e.target.value);setImportError("");}} placeholder={`Exemplo de formato (ilustrativo):\n100;01/01/2026;${lottery === "megasena" ? "01;07;13;24;36;50" : "01;03;04;05;06;07;10;11;12;13;15;17;20;22;25"}`}/>
          {importError&&<div className="loto-import-error">{importError}</div>}
          <div className="loto-modal-actions"><button className="loto-outline-button" onClick={()=>setImportOpen(false)}>Cancelar</button><button className="loto-primary-button" onClick={importData}>Importar e analisar <ArrowRight size={16}/></button></div>
          <p className="loto-small-note">Importação apenas nesta sessão do navegador. Os dados não são enviados a um servidor nem certificados como oficiais.</p>
        </div>
      </div>}
    </div>
  );
}

function Kpi({icon,label,value,foot}:{icon:React.ReactNode,label:string,value:string,foot:string}) {
  return <section className="loto-kpi"><div className="loto-kpi-top"><span>{label}</span><div>{icon}</div></div><strong>{value}</strong><small>{foot}</small></section>;
}
function FrequencyChart({counts,expected}:{counts:{number:number;count:number}[];expected:number}) {
  return <div className="loto-chart-container"><ResponsiveContainer width="100%" height="100%"><BarChart data={counts.map(x=>({...x,label:ball(x.number)}))} margin={{top:14,right:6,left:-26,bottom:0}}><CartesianGrid stroke="var(--loto-line)" vertical={false} strokeDasharray="4 6"/><XAxis dataKey="label" stroke="var(--loto-faint)" tick={{fill:"var(--loto-muted)",fontSize:11}} axisLine={false} tickLine={false}/><YAxis allowDecimals={false} tick={{fill:"var(--loto-muted)",fontSize:11}} axisLine={false} tickLine={false}/><Tooltip cursor={{fill:"var(--loto-hover)"}} contentStyle={{borderRadius:12,background:"var(--loto-elevated)",border:"1px solid var(--loto-line)",color:"var(--loto-white)"}} formatter={(value)=>[`${value} ocorrências`,"Frequência"]}/><ReferenceLine y={expected} stroke="var(--loto-amber)" strokeDasharray="5 5" strokeWidth={1.6}/><Bar dataKey="count" radius={[5,5,0,0]} maxBarSize={25}>{counts.map((_,index)=><Cell key={index} fill={index<3?"var(--loto-neon)":"var(--loto-green-mid)"}/>)}</Bar></BarChart></ResponsiveContainer></div>;
}
