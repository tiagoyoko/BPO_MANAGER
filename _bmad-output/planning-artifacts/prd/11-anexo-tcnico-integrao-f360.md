# 11. Anexo técnico – Integração F360

*Detalhe de referência para rastreabilidade e decisões de produto; detalhes de implementação podem ser documentados no documento de arquitetura.*

## 11.1. Componentes lógicos

- **F360AuthService**
  - Chama `/PublicLoginAPI/DoLogin` com o token configurado do cliente.  
  - Armazena o JWT e controla expiração/renovação.  
  - Interface exposta internamente: `getValidJwt(clienteId): JwtToken`.

- **F360ApiClient**
  - Wrapper para chamadas autenticadas à API do F360 (relatórios/movimentações).  
  - Usa `F360AuthService` para obter o JWT válido.  
  - Métodos principais (conceituais):
    - `getSaldos(clienteId, dataRef)`  
    - `getContasReceber(clienteId, filtros)`  
    - `getContasPagar(clienteId, filtros)`  
    - `getConciliaçõesPendentes(clienteId, dataRef)`  

- **F360SyncJob**
  - Job agendado/manual que:
    - Resolve mapeamentos de empresa/contas para o cliente.  
    - Chama `F360ApiClient` para cada tipo de dado.  
    - Normaliza as respostas e grava `SnapshotFinanceiro`.  

## 11.2. Fluxos principais

### 11.2.1. Fluxo de configuração inicial

1. Admin acessa tela de integração do cliente.  
2. Informa token F360.  
3. Sistema chama `F360AuthService.loginComToken(token)` → `/PublicLoginAPI/DoLogin`.  
4. Se sucesso, JWT é armazenado; se erro, exibir mensagem e não salvar.  
5. Sistema chama `F360ApiClient.getEmpresas()` para listar empresas disponíveis (quando suportado pela API).  
6. Admin mapeia empresas/contas F360 ao cliente.  
7. Configuração é salva e uma primeira execução de `F360SyncJob` é disparada.

### 11.2.2. Fluxo de sincronização agendada

1. Scheduler dispara `F360SyncJob` em intervalos configurados.  
2. Para cada cliente com F360 ativo:
   - Obtém JWT via `F360AuthService.getValidJwt(clienteId)`.  
   - Para cada empresa/conta mapeada:
     - Chama `getSaldos`, `getContasReceber`, `getContasPagar`, `getConciliaçõesPendentes` com filtros de data (hoje) e status.  
   - Consolida os dados por cliente (somatórios e listas).  
   - Cria registro `SnapshotFinanceiro` com payload normalizado e timestamp.  
3. Em caso de erro:
   - Se erro de autenticação: tenta renovar o JWT uma vez; se persistir, marca snapshot como falho e registra log.  
   - Se erro de negócio/infra: registra log e segue para próximos clientes.

### 11.2.3. Fluxo de atualização manual (UI)

1. Usuário clica em “Atualizar agora” no dashboard de um cliente.  
2. API interna chama `F360SyncJob.runSingle(clienteId)`.  
3. Após término, a UI:
   - Recarrega os indicadores usando o último `SnapshotFinanceiro`.  
   - Atualiza o timestamp de última sincronização.

## 11.3. Pseudo-modelos de dados internos

```markdown
F360EmpresaMapeada
- id
- clienteId
- f360EmpresaId
- cnpj
- nome
- contasSelecionadas: [F360ContaMapeada]

F360ContaMapeada
- id
- empresaMapeadaId
- f360ContaId
- descricao
- incluirNoSaldo: boolean
```

```markdown
SnapshotFinanceiro
- id
- clienteId
- dataReferencia: date
- criadoEm: datetime
- origem: "F360"
- indicadores:
    saldo:
      - porConta: [{ contaId, descricao, valor }]
      - consolidado: number
    contasReceber:
      - hoje: { quantidade, valorTotal }
      - vencidas: { quantidade, valorTotal }
    contasPagar:
      - hoje: { quantidade, valorTotal }
      - vencidas: { quantidade, valorTotal }
    conciliacoesPendentes:
      - quantidade
      - valorTotal
- detalhes:
    receberHoje: [TituloFinanceiro]
    receberVencidos: [TituloFinanceiro]
    pagarHoje: [TituloFinanceiro]
    pagarVencidos: [TituloFinanceiro]
    conciliacoesPendentes: [MovimentoBancario]
```

```markdown
TituloFinanceiro
- idExterno: string (id no F360)
- tipo: "pagar" | "receber"
- descricao
- sacadoOuCedente
- vencimento: date
- valor: number
- status: "aberto" | "pago" | "parcial" | ...

MovimentoBancario
- idExterno: string (id no F360)
- contaId
- dataMovimento: date
- descricao
- valor: number
- conciliado: boolean
```

## 11.4. Contratos internos (interfaces entre camadas)

```markdown
interface F360AuthService {
  loginComToken(token: string): JwtToken
  getValidJwt(clienteId: string): JwtToken
}

interface F360ApiClient {
  getEmpresas(jwt: JwtToken): EmpresaF360[]
  getSaldos(jwt: JwtToken, empresaId: string, dataRef: date): SaldoF360[]
  getContasReceber(jwt: JwtToken, empresaId: string, filtros: FiltrosTitulos): TituloF360[]
  getContasPagar(jwt: JwtToken, empresaId: string, filtros: FiltrosTitulos): TituloF360[]
  getConciliaçõesPendentes(jwt: JwtToken, empresaId: string, dataRef: date): MovimentoF360[]
}

interface F360SyncJob {
  runAll(): void
  runSingle(clienteId: string): void
}
```

Esses contratos são conceituais; a implementação real pode adaptar nomes/tipos conforme SDK, linguagem e detalhes da API F360.

## 11.5. Diagrama de fluxo da integração F360

```mermaid
flowchart LR
  subgraph BPO360["BPO360 (plataforma)"]
    UI[UI Admin<br/>Config. Integração]
    DASH[Dashboard Cliente]
    AUTH[F360AuthService]
    API[F360ApiClient]
    SYNC[F360SyncJob]
    MAP[Mapeamento<br/>Empresa/Contas]
    SNAP[SnapshotFinanceiro<br/>(banco)]
  end

  subgraph F360["F360 Finanças (API)"]
    LOGIN[/PublicLoginAPI/DoLogin/]
    REL[/PublicRelatorioAPI/GerarRel<br/>(saldos, pagar/receber, conciliação)/]
  end

  UI -->|token F360| AUTH
  AUTH -->|JWT| LOGIN
  LOGIN -->|JWT válido| AUTH

  UI --> MAP
  MAP --> SYNC

  SYNC -->|getValidJwt(cliente)| AUTH
  AUTH -->|JWT| API
  API -->|chamada relatórios| REL
  REL -->|dados brutos| API
  API -->|dados normalizados| SYNC
  SYNC -->|salva| SNAP

  SNAP --> DASH
  DASH -->|Atualizar agora| SYNC
```

