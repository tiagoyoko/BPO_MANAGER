import { useState, useCallback } from "react";

// ─── PRICING LOGIC ───
const FATURAMENTO_LABELS = [
  "Até R$ 50 mil",
  "R$ 50 mil a R$ 200 mil",
  "R$ 200 mil a R$ 500 mil",
  "R$ 500 mil a R$ 1 milhão",
  "Acima de R$ 1 milhão",
];
const LANCAMENTOS_LABELS = [
  "Até 100",
  "101 a 300",
  "301 a 600",
  "601 a 1.000",
  "Acima de 1.000",
];

const TIPO_EMPRESA_OPTIONS = [
  "Prestação de serviços",
  "Comércio",
  "Indústria",
  "Holding / Grupo econômico",
  "MEI",
];

const SERVICOS = [
  "Contas a pagar",
  "Contas a receber",
  "Conciliação bancária",
  "Emissão de notas fiscais",
  "Gestão de inadimplência",
  "Relatórios gerenciais",
];

const ERP_OPTIONS = [
  { label: "Omie", icon: "📊" },
  { label: "ContaAzul", icon: "🔵" },
  { label: "Nibo", icon: "📈" },
  { label: "Outro", icon: null },
  { label: "Não possui ERP", icon: null },
];

function calcularPreco(data) {
  // Base operacional
  const tipoMultiplier = { "Prestação de serviços": 1, "Comércio": 1.1, "Indústria": 1.3, "Holding / Grupo econômico": 1.5, "MEI": 0.6 };
  const fatBase = [600, 800, 1000, 1300, 1600];
  const lancBase = [0, 100, 200, 350, 500];
  const contasBase = [0, 100, 250];

  let baseOp = fatBase[data.faturamento] * (tipoMultiplier[data.tipoEmpresa] || 1);
  baseOp += lancBase[data.lancamentos];
  baseOp += contasBase[data.contasBancarias] || 0;
  baseOp = Math.round(baseOp / 50) * 50;

  // Escopo
  const servicosSelecionados = data.servicos.filter(Boolean).length;
  const escopoValor = servicosSelecionados * 150;

  // Nível consultivo
  const nivelValues = [0, 350, 700];
  const nivelValor = nivelValues[data.nivelAtuacao] || 0;

  // Planejamento e reuniões
  let planejamentoValor = data.planejamento === 0 ? 200 : 0;
  const reunioesValues = [0, 150, 300];
  planejamentoValor += reunioesValues[data.reunioes] || 0;

  // Tecnologia
  const erpValues = [0, 0, 0, 100, 200];
  const prestacaoValues = [0, 100, 250];
  let tecValor = (erpValues[data.erp] || 0) + (prestacaoValues[data.prestacaoContas] || 0);

  // Modelo atendimento
  const atendiValues = [0, 200];
  const atendiValor = atendiValues[data.modeloAtendimento] || 0;

  const total = baseOp + escopoValor + nivelValor + planejamentoValor + tecValor + atendiValor;
  const precoRecomendado = Math.round(total / 100) * 100;
  const precoMinimo = Math.round(precoRecomendado * 0.75 / 100) * 100;

  // Horas estimadas
  const horasBase = 8 + (data.lancamentos * 2) + (data.contasBancarias * 1.5) + (servicosSelecionados * 2) + (data.nivelAtuacao * 2) + (data.reunioes * 1.5);
  const horas = Math.round(horasBase);

  // Perfil
  let perfil = "Cliente Padrão";
  if (data.tipoEmpresa === "MEI" && data.faturamento === 0) perfil = "Cliente Básico";
  else if (data.faturamento >= 3 || data.nivelAtuacao === 2) perfil = "Cliente Premium";
  else if (servicosSelecionados <= 2 && data.nivelAtuacao === 0) perfil = "Cliente de Risco";
  else if (servicosSelecionados >= 5) perfil = "Cliente Completo";

  return {
    precoRecomendado, precoMinimo, horas, perfil,
    detalhamento: {
      baseOperacional: baseOp,
      escopoServicos: escopoValor,
      nivelConsultivo: nivelValor,
      planejamentoReunioes: planejamentoValor,
      tecnologia: tecValor,
      modeloAtendimento: atendiValor,
    },
    servicosSelecionados,
  };
}

// ─── UI COMPONENTS ───
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M11.5 3.5L5.5 9.5L2.5 6.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
);
const ArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10m0 0L9 4m4 4L9 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
);
const ArrowLeft = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M13 8H3m0 0l4-4M3 8l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
);

function Slider({ value, onChange, labels, min = 0, max = 4 }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ position: "relative", padding: "8px 0" }}>
      <div style={{ position: "relative", height: 6, background: "#e5e7eb", borderRadius: 9999 }}>
        <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${pct}%`, background: "#220354", borderRadius: 9999, transition: "width 0.2s" }} />
      </div>
      <input
        type="range" min={min} max={max} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: 30, opacity: 0, cursor: "pointer" }}
      />
      <div style={{
        position: "absolute", top: -2,
        left: `calc(${pct}% - 10px)`,
        width: 20, height: 20, borderRadius: "50%",
        background: "white", border: "2px solid #220354",
        transition: "left 0.2s", pointerEvents: "none",
      }} />
      <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
        <span style={{
          display: "inline-block", padding: "4px 14px",
          background: "#f3f0ff", borderRadius: 8,
          fontSize: 13, fontWeight: 500, color: "#220354",
        }}>{labels[value]}</span>
      </div>
    </div>
  );
}

function RadioGroup({ value, onChange, options, columns = 1, cardStyle = false }) {
  const gridCols = columns > 1 ? { display: "grid", gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 10 } : { display: "flex", flexDirection: "column", gap: 10 };
  return (
    <div style={gridCols}>
      {options.map((opt, i) => {
        const selected = value === i;
        const label = typeof opt === "string" ? opt : opt.label;
        const sub = typeof opt === "object" ? opt.sub : null;
        const icon = typeof opt === "object" ? opt.icon : null;
        return (
          <div
            key={i}
            onClick={() => onChange(i)}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: cardStyle ? "14px 16px" : "10px 14px",
              borderRadius: 10,
              border: selected ? "2px solid #220354" : "1.5px solid #e5e7eb",
              background: selected ? "#f8f5ff" : "white",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            <div style={{
              width: 18, height: 18, borderRadius: "50%",
              border: selected ? "5px solid #220354" : "2px solid #c4b5d9",
              background: "white", flexShrink: 0,
              transition: "all 0.2s",
            }} />
            <div style={{ flex: 1 }}>
              {icon && <span style={{ fontSize: 18, marginRight: 6 }}>{icon}</span>}
              <span style={{ fontWeight: 500, fontSize: 14, color: "#1a1a2e" }}>{label}</span>
              {sub && <div style={{ fontSize: 12, color: "#777", marginTop: 2 }}>{sub}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Checkbox({ checked, onChange, label }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "10px 14px", borderRadius: 10,
        border: checked ? "2px solid #220354" : "1.5px solid #e5e7eb",
        background: checked ? "#f8f5ff" : "white",
        cursor: "pointer", transition: "all 0.2s",
      }}
    >
      <div style={{
        width: 20, height: 20, borderRadius: 5,
        background: checked ? "#220354" : "white",
        border: checked ? "none" : "2px solid #c4b5d9",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.2s", flexShrink: 0,
      }}>
        {checked && <CheckIcon />}
      </div>
      <span style={{ fontWeight: 500, fontSize: 14, color: "#1a1a2e" }}>{label}</span>
    </div>
  );
}

function SelectDropdown({ value, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false);
  return (
    <>
    {open && <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />}
    <div style={{ position: "relative" }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          height: 42, padding: "0 14px", borderRadius: 8,
          border: "1.5px solid #e5e7eb", background: "white",
          cursor: "pointer", fontSize: 14,
          color: value !== null ? "#1a1a2e" : "#999",
        }}
      >
        <span>{value !== null ? options[value] : placeholder}</span>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="#888" strokeWidth="2" strokeLinecap="round"/></svg>
      </div>
      {open && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0,
          background: "white", borderRadius: 8, marginTop: 4,
          boxShadow: "0 8px 30px rgba(0,0,0,0.12)", zIndex: 50,
          border: "1px solid #e5e7eb", overflow: "hidden",
        }}>
          {options.map((opt, i) => (
            <div
              key={i}
              onClick={() => { onChange(i); setOpen(false); }}
              style={{
                padding: "10px 14px", cursor: "pointer", fontSize: 14,
                background: value === i ? "#f3f0ff" : "white",
                color: "#1a1a2e",
              }}
              onMouseEnter={e => e.target.style.background = "#f8f5ff"}
              onMouseLeave={e => e.target.style.background = value === i ? "#f3f0ff" : "white"}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
    </>
  );
}

// ─── STEP COMPONENTS ───
function Step1({ data, setData }) {
  return (
    <div>
      <label style={styles.label}>Tipo de empresa *</label>
      <SelectDropdown
        value={data.tipoEmpresaIdx}
        onChange={i => setData(d => ({ ...d, tipoEmpresaIdx: i, tipoEmpresa: TIPO_EMPRESA_OPTIONS[i] }))}
        options={TIPO_EMPRESA_OPTIONS}
        placeholder="Selecione o tipo de empresa"
      />
      <div style={{ height: 24 }} />
      <label style={styles.label}>Faturamento mensal</label>
      <Slider value={data.faturamento} onChange={v => setData(d => ({ ...d, faturamento: v }))} labels={FATURAMENTO_LABELS} />
    </div>
  );
}

function Step2({ data, setData }) {
  return (
    <div>
      <label style={styles.label}>Quantidade média de lançamentos/mês</label>
      <Slider value={data.lancamentos} onChange={v => setData(d => ({ ...d, lancamentos: v }))} labels={LANCAMENTOS_LABELS} />
      <div style={{ height: 24 }} />
      <label style={styles.label}>Quantidade de contas bancárias *</label>
      <RadioGroup
        value={data.contasBancarias}
        onChange={v => setData(d => ({ ...d, contasBancarias: v }))}
        options={["1", "2 a 3", "4 ou mais"]}
        columns={3}
      />
    </div>
  );
}

function Step3({ data, setData }) {
  const toggle = i => {
    setData(d => {
      const s = [...d.servicos];
      s[i] = !s[i];
      return { ...d, servicos: s };
    });
  };
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {SERVICOS.map((s, i) => (
          <Checkbox key={i} checked={data.servicos[i]} onChange={() => toggle(i)} label={s} />
        ))}
      </div>
    </div>
  );
}

function Step4({ data, setData }) {
  return (
    <div>
      <label style={styles.label}>Nível de atuação *</label>
      <RadioGroup
        value={data.nivelAtuacao}
        onChange={v => setData(d => ({ ...d, nivelAtuacao: v }))}
        options={[
          { label: "Operacional", sub: "Foco em execução" },
          { label: "Tático", sub: "Relatórios + análise" },
          { label: "Estratégico", sub: "Análise + planejamento + decisão" },
        ]}
        columns={3} cardStyle
      />
      <div style={{ height: 24 }} />
      <label style={styles.label}>Planejamento orçamentário *</label>
      <RadioGroup
        value={data.planejamento}
        onChange={v => setData(d => ({ ...d, planejamento: v }))}
        options={["Sim", "Não"]}
        columns={2}
      />
      <div style={{ height: 24 }} />
      <label style={styles.label}>Frequência de reuniões com o cliente *</label>
      <RadioGroup
        value={data.reunioes}
        onChange={v => setData(d => ({ ...d, reunioes: v }))}
        options={["Nenhuma", "Mensal", "Quinzenal"]}
        columns={3}
      />
    </div>
  );
}

function Step5({ data, setData }) {
  return (
    <div>
      <label style={styles.label}>ERP utilizado *</label>
      <RadioGroup
        value={data.erp}
        onChange={v => setData(d => ({ ...d, erp: v }))}
        options={ERP_OPTIONS.map(e => ({ label: e.label, icon: e.icon }))}
        columns={3} cardStyle
      />
      <div style={{ height: 24 }} />
      <label style={styles.label}>Prestação de Contas *</label>
      <RadioGroup
        value={data.prestacaoContas}
        onChange={v => setData(d => ({ ...d, prestacaoContas: v }))}
        options={[
          { label: "Relatórios padrão", sub: "Entrega básica em planilhas" },
          { label: "Dashboards padronizados", sub: "Gráficos visuais com modelos prontos" },
          { label: "Dashboard personalizados", sub: "Sob medida para o cliente" },
        ]}
        cardStyle
      />
    </div>
  );
}

function Step6({ data, setData }) {
  return (
    <div>
      <label style={styles.label}>Modelo de atendimento *</label>
      <RadioGroup
        value={data.modeloAtendimento}
        onChange={v => setData(d => ({ ...d, modeloAtendimento: v }))}
        options={[
          { label: "Reativo", sub: "Atendimento sob demanda, quando o cliente solicita" },
          { label: "Proativo", sub: "Acompanhamento contínuo com alertas e recomendações" },
        ]}
        cardStyle
      />
    </div>
  );
}

// ─── RESULT COMPONENT ───
function ResultPage({ data, onReset }) {
  const result = calcularPreco(data);
  const d = result.detalhamento;
  const perfilColors = {
    "Cliente Básico": "#6b7280",
    "Cliente de Risco": "#ef4444",
    "Cliente Padrão": "#3b82f6",
    "Cliente Completo": "#8b5cf6",
    "Cliente Premium": "#f59e0b",
  };

  const DetailSection = ({ icon, title, items, value, note }) => (
    <div style={{
      padding: 20, borderRadius: 12, border: "1px solid #e5e7eb",
      marginBottom: 16, background: "white",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#1a1a2e" }}>{title}</h4>
      </div>
      {items && (
        <div style={{ fontSize: 13, color: "#555", marginBottom: 10, lineHeight: 1.7 }}>
          {items.map((item, i) => <div key={i}>• {item}</div>)}
        </div>
      )}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "8px 12px", background: "#f8f5ff", borderRadius: 8, marginTop: 8,
      }}>
        <span style={{ fontSize: 13, color: "#555" }}>{title === "Escopo de Serviços" ? `Serviços selecionados: ${result.servicosSelecionados} de 6` : ""}</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#220354" }}>R$ {value.toLocaleString("pt-BR")}</span>
      </div>
      {note && <p style={{ fontSize: 12, color: "#888", marginTop: 8, fontStyle: "italic" }}>{note}</p>}
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      {/* Nav bar - result page */}
      <div style={{
        background: "#220354", padding: "12px 0",
        display: "flex", justifyContent: "center", alignItems: "center", gap: 30,
      }}>
        <span style={{ color: "white", fontWeight: 700, fontSize: 16, letterSpacing: 1 }}>
          <span style={{ color: "#0014F0" }}>|||</span> Data4
        </span>
        {["Solução", "Benefícios", "Planos", "FAQ"].map((t, i) => (
          <span key={i} style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, cursor: "pointer" }}>{t}</span>
        ))}
      </div>

      {/* Result Card */}
      <div style={{ maxWidth: 640, margin: "40px auto", padding: "0 20px" }}>
        <div style={{
          background: "white", borderRadius: 16, padding: 36,
          boxShadow: "0 4px 30px rgba(0,0,0,0.08)", textAlign: "center",
        }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#1a1a2e", margin: "0 0 4px" }}>Resultado da Precificação</h2>
          <p style={{ color: "#888", fontSize: 13, margin: "0 0 24px" }}>Baseado nas informações fornecidas</p>

          <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>Preço mensal recomendado</div>
          <div style={{ fontSize: 44, fontWeight: 800, color: "#220354", marginBottom: 16 }}>
            R$ {result.precoRecomendado.toLocaleString("pt-BR")}
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: 40, marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 11, color: "#888" }}>Preço mínimo</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#1a1a2e" }}>R$ {result.precoMinimo.toLocaleString("pt-BR")}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#888" }}>Esforço estimado</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#1a1a2e" }}>~{result.horas}h/mês</div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 24 }}>
            <span style={{ fontSize: 12, color: "#555" }}>Perfil do cliente:</span>
            <span style={{
              fontSize: 12, fontWeight: 600,
              padding: "2px 10px", borderRadius: 20,
              background: `${perfilColors[result.perfil]}15`,
              color: perfilColors[result.perfil],
            }}>{result.perfil}</span>
          </div>

          <div style={{
            background: "#0014F0", color: "white", padding: "12px 20px",
            borderRadius: 8, fontSize: 12, fontWeight: 600, letterSpacing: 0.5,
            marginBottom: 20,
          }}>
            DETALHAMENTO COMPLETO ABAIXO
          </div>

          <p style={{ fontSize: 14, color: "#555", marginBottom: 8 }}>Quer entender como chegamos nesse valor?</p>
          <p style={{ fontSize: 12, color: "#888", marginBottom: 16 }}>
            Veja todos os fatores considerados na precificação e agende uma sessão estratégica para aplicar no seu BPO.
          </p>

          <p style={{
            fontSize: 14, fontStyle: "italic", color: "#888", margin: "20px 0",
            padding: "16px", borderTop: "1px solid #eee", borderBottom: "1px solid #eee",
          }}>
            "Precificar errado custa mais caro do que perder um cliente."
          </p>

          <button
            onClick={onReset}
            style={{
              background: "none", border: "1.5px solid #ddd", borderRadius: 10,
              padding: "10px 24px", fontSize: 14, color: "#555",
              cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8,
            }}
          >
            ↻ Calcular novamente
          </button>
        </div>

        {/* Detalhamento */}
        <div style={{ marginTop: 40, marginBottom: 40 }}>
          <h3 style={{ fontSize: 22, fontWeight: 700, color: "#1a1a2e", textAlign: "center", marginBottom: 4 }}>
            Detalhamento da Precificação
          </h3>
          <p style={{ fontSize: 13, color: "#888", textAlign: "center", marginBottom: 24 }}>
            Veja exatamente o que está sendo considerado para chegar nesse valor.
          </p>

          <DetailSection
            icon="⚙️" title="Complexidade Operacional"
            items={["Volume mensal de lançamentos", "Quantidade de contas bancárias", "Frequência de conciliações", "Tipo de empresa"]}
            value={d.baseOperacional}
            note="Quanto maior a complexidade operacional, maior o esforço recorrente e o risco de erro."
          />
          <DetailSection
            icon="📋" title="Escopo de Serviços"
            items={SERVICOS.filter((_, i) => data.servicos[i])}
            value={d.escopoServicos}
            note="Cada serviço adicionado aumenta responsabilidade, tempo e dependência do cliente."
          />
          <DetailSection
            icon="🧠" title="Nível Consultivo"
            items={[
              `Atuação ${["Operacional", "Tática", "Estratégica"][data.nivelAtuacao]}`,
              "Análises recorrentes",
              "Apoio à tomada de decisão",
            ]}
            value={d.nivelConsultivo}
            note="Aqui está a maior alavanca de ticket. Não é execução. É decisão."
          />
          <DetailSection
            icon="📅" title="Planejamento e Reuniões"
            items={[
              `Planejamento orçamentário: ${data.planejamento === 0 ? "Sim" : "Não"}`,
              `Reuniões: ${["Nenhuma", "Mensal", "Quinzenal"][data.reunioes]}`,
            ]}
            value={d.planejamentoReunioes}
            note="Planejamento e reuniões são investimentos em relacionamento e retenção."
          />
          <DetailSection
            icon="💻" title="Tecnologia e Maturidade do Cliente"
            items={[
              `ERP utilizado: ${ERP_OPTIONS[data.erp]?.label || "N/A"}`,
              "Qualidade dos dados",
              "Grau de automação",
            ]}
            value={d.tecnologia}
            note="Clientes menos maduros exigem mais esforço. Clientes maduros permitem escala."
          />

          {/* Resumo Final */}
          <div style={{
            background: "white", borderRadius: 16, padding: 28,
            boxShadow: "0 4px 30px rgba(0,0,0,0.08)", marginTop: 24,
          }}>
            <h4 style={{ fontSize: 17, fontWeight: 700, textAlign: "center", marginBottom: 20, color: "#1a1a2e" }}>
              Resumo Final
            </h4>
            {[
              ["Base operacional", d.baseOperacional],
              ["Escopo de serviços", d.escopoServicos],
              ["Valor consultivo", d.nivelConsultivo],
              ["Planejamento e reuniões", d.planejamentoReunioes],
              ["Tecnologia e maturidade", d.tecnologia],
            ].map(([label, val], i) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between",
                padding: "8px 0", borderBottom: "1px solid #f0f0f0",
                fontSize: 14,
              }}>
                <span style={{ color: "#555" }}>{label}:</span>
                <span style={{ fontWeight: 600, color: i === 0 ? "#0014F0" : "#1a1a2e" }}>
                  R$ {val.toLocaleString("pt-BR")}
                </span>
              </div>
            ))}
            <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "#888" }}>
              Horas estimadas: <strong>~{result.horas}h/mês</strong>
            </div>
            <div style={{ textAlign: "center", marginTop: 12, fontSize: 13, color: "#888" }}>
              Preço final recomendado:
            </div>
            <div style={{
              textAlign: "center", fontSize: 32, fontWeight: 800,
              color: "#220354", marginTop: 4,
            }}>
              R$ {result.precoRecomendado.toLocaleString("pt-BR")} / mês
            </div>
          </div>

          {/* CTA */}
          <div style={{ textAlign: "center", marginTop: 32, padding: "0 20px" }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1a1a2e", marginBottom: 8 }}>
              Quer ver esses números na prática?
            </h3>
            <p style={{ fontSize: 13, color: "#888", marginBottom: 20 }}>
              Agende uma sessão estratégica e veja como aplicar essa precificação no seu BPO ou consultoria.
            </p>
            <button style={{
              background: "#2ecc71", color: "white", border: "none",
              borderRadius: 10, padding: "14px 32px", fontSize: 15,
              fontWeight: 600, cursor: "pointer",
            }}>
              Quero ter uma operação consultiva!
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", padding: "30px 0", borderTop: "1px solid #eee" }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#220354", marginBottom: 8 }}>
          <span style={{ color: "#0014F0" }}>|||</span> Data4
        </div>
        <p style={{ fontSize: 12, color: "#888" }}>© 2026 Data4Company. Todos os direitos reservados.</p>
      </div>
    </div>
  );
}

// ─── STEPS CONFIG ───
const STEPS = [
  { title: "Perfil do Cliente", subtitle: "Entender o tipo de empresa ajuda a dimensionar a complexidade do trabalho.", component: Step1 },
  { title: "Volume Operacional", subtitle: "Volume de transações e contas impactam diretamente nas horas de trabalho.", component: Step2 },
  { title: "Escopo do Serviço", subtitle: "Selecione todos os serviços que serão incluídos no contrato.", component: Step3 },
  { title: "Nível Consultivo", subtitle: "O nível de atuação define quanto de inteligência você entrega além da execução.", component: Step4 },
  { title: "Tecnologia", subtitle: "A escolha do ERP e tipo de entrega impactam a eficiência e o valor percebido.", component: Step5 },
  { title: "Modelo de Atendimento", subtitle: "Atendimento proativo gera mais valor e retenção de clientes.", component: Step6 },
];

function canAdvance(step, data) {
  switch (step) {
    case 0: return data.tipoEmpresaIdx !== null;
    case 1: return data.contasBancarias !== null;
    case 2: return data.servicos.some(Boolean);
    case 3: return data.nivelAtuacao !== null && data.planejamento !== null && data.reunioes !== null;
    case 4: return data.erp !== null && data.prestacaoContas !== null;
    case 5: return data.modeloAtendimento !== null;
    default: return false;
  }
}

// ─── MAIN APP ───
const INITIAL_DATA = {
  tipoEmpresaIdx: null, tipoEmpresa: null, faturamento: 0,
  lancamentos: 0, contasBancarias: null,
  servicos: [false, false, false, false, false, false],
  nivelAtuacao: null, planejamento: null, reunioes: null,
  erp: null, prestacaoContas: null,
  modeloAtendimento: null,
};

export default function CalculadoraPrecificacao() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState(INITIAL_DATA);
  const [showResult, setShowResult] = useState(false);

  const progress = ((step + 1) / STEPS.length) * 100;
  const StepComponent = STEPS[step]?.component;
  const isLastStep = step === STEPS.length - 1;

  const handleNext = useCallback(() => {
    if (isLastStep) {
      setShowResult(true);
    } else {
      setStep(s => s + 1);
    }
  }, [isLastStep]);

  const handleReset = () => {
    setStep(0);
    setData(INITIAL_DATA);
    setShowResult(false);
  };

  if (showResult) {
    return <ResultPage data={data} onReset={handleReset} />;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5", fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #220354 0%, #0014F0 100%)",
        padding: "40px 20px 50px", textAlign: "center",
      }}>
        <div style={{ marginBottom: 8 }}>
          <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>
            +3.000 empresas atendidas &nbsp;•&nbsp; +500 parceiros
          </span>
        </div>
        <h1 style={{
          color: "white", fontSize: 32, fontWeight: 800,
          margin: "0 auto 12px", maxWidth: 600, lineHeight: 1.2,
        }}>
          Calculadora de Precificação para BPOs e Consultores Financeiros
        </h1>
        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 14, margin: 0 }}>
          Descubra o valor ideal para cobrar pelos seus serviços e pare de deixar dinheiro na mesa.
        </p>
      </div>

      {/* Progress bar */}
      <div style={{ maxWidth: 700, margin: "-20px auto 0", padding: "0 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: "#555" }}>Etapa {step + 1} de {STEPS.length}</span>
          <span style={{ fontSize: 12, color: "#0014F0", fontWeight: 600 }}>{Math.round(progress)}%</span>
        </div>
        <div style={{ height: 6, background: "#ddd", borderRadius: 9999, overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${progress}%`,
            background: "linear-gradient(90deg, #0014F0, #220354)",
            borderRadius: 9999, transition: "width 0.4s ease",
          }} />
        </div>
      </div>

      {/* Card */}
      <div style={{
        maxWidth: 660, margin: "24px auto 40px", padding: "0 20px",
      }}>
        <div style={{
          background: "white", borderRadius: 16, padding: "32px 36px",
          boxShadow: "0 4px 30px rgba(0,0,0,0.06)",
        }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 6px", color: "#1a1a2e" }}>
            {STEPS[step].title}
          </h2>
          <p style={{ fontSize: 13, color: "#888", margin: "0 0 24px" }}>
            {STEPS[step].subtitle}
          </p>

          <StepComponent data={data} setData={setData} />

          {/* Navigation */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginTop: 32, paddingTop: 20, borderTop: "1px solid #f0f0f0",
          }}>
            <button
              onClick={() => step > 0 && setStep(s => s - 1)}
              disabled={step === 0}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "none", border: "none",
                fontSize: 14, fontWeight: 600, color: step > 0 ? "#555" : "#ccc",
                cursor: step > 0 ? "pointer" : "default",
                padding: "10px 16px",
              }}
            >
              <ArrowLeft /> Voltar
            </button>
            <button
              onClick={handleNext}
              disabled={!canAdvance(step, data)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                background: canAdvance(step, data) ? "#220354" : "#c4b5d9",
                color: "white", border: "none",
                borderRadius: 10, padding: "12px 32px",
                fontSize: 15, fontWeight: 600,
                cursor: canAdvance(step, data) ? "pointer" : "default",
                transition: "all 0.2s",
                boxShadow: canAdvance(step, data) ? "0 4px 12px rgba(34,3,84,0.3)" : "none",
              }}
            >
              {isLastStep ? "Ver resultado" : "Próximo"} <ArrowRight />
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", padding: "20px 0 30px" }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#220354", marginBottom: 8 }}>
          <span style={{ color: "#0014F0" }}>|||</span> Data4
        </div>
        <p style={{ fontSize: 12, color: "#888" }}>© 2026 Data4Company. Todos os direitos reservados.</p>
      </div>
    </div>
  );
}

const styles = {
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "#1a1a2e",
    marginBottom: 8,
  },
};
