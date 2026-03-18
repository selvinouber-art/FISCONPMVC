// Constantes do FISCON

// ============================================================
// BAIRROS DE VITÓRIA DA CONQUISTA
// ============================================================
export const BAIRROS_VDC = [
  'ALTO MARON',
  'AYRTON SENNA',
  'BATEIAS',
  'BRASIL',
  'BOA VISTA',
  'CAMPINHOS',
  'CANDEIAS',
  'CENTRO',
  'CRUZEIRO',
  'DISTRITO INDUSTRIAL',
  'ESPIRITO SANTO',
  'FELICIA',
  'GUARANI',
  'IBIRAPUERA',
  'JATOBA',
  'JUREMA',
  'LAGOA DAS FLORES',
  'NOSSA SENHORA APARECIDA',
  'PATAGONIA',
  'PRIMAVERA',
  'RECREIO',
  'SAO PEDRO',
  'UNIVERSIDADE',
  'ZABELÊ',
  'ZONA RURAL',
]

// ============================================================
// PRAZOS DE NOTIFICAÇÃO (1 a 3 dias úteis, por lei)
// ============================================================
export const PRAZOS_NOTIFICACAO = [
  { valor: 1, label: '1 dia' },
  { valor: 2, label: '2 dias' },
  { valor: 3, label: '3 dias' },
]

// Prazo fixo do Auto de Infração (10 dias corridos, por lei)
export const PRAZO_AUTO_DIAS = 10

// Calcula a data de vencimento somando dias à data atual
export function calcularDataVencimento(diasCorridos) {
  const d = new Date()
  d.setDate(d.getDate() + diasCorridos)
  return d.toLocaleDateString('pt-BR')
}

// ============================================================
// INFRAÇÕES DE OBRAS — Lei 1.481/2007
// ============================================================
export const INFRACOES_Q61 = [
  { id: 'q61-01', codigo: '6.1.1',  descricao: 'Execução de obra sem licença municipal', penalidade: 'Multa', valor: 553.27 },
  { id: 'q61-02', codigo: '6.1.2',  descricao: 'Obra em desacordo com o projeto aprovado', penalidade: 'Multa', valor: 553.27 },
  { id: 'q61-03', codigo: '6.1.3',  descricao: 'Obra sem responsável técnico habilitado', penalidade: 'Multa', valor: 276.63 },
  { id: 'q61-04', codigo: '6.1.4',  descricao: 'Obra que oferece risco de segurança à população', penalidade: 'Multa + Embargo', valor: 1383.17 },
  { id: 'q61-05', codigo: '6.1.5',  descricao: 'Materiais de construção depositados em via pública sem autorização', penalidade: 'Multa', valor: 138.32 },
  { id: 'q61-06', codigo: '6.1.6',  descricao: 'Impedimento ou embaraço à fiscalização municipal', penalidade: 'Multa', valor: 553.27 },
  { id: 'q61-07', codigo: '6.1.7',  descricao: 'Obra com tapume em desacordo com as normas', penalidade: 'Multa', valor: 138.32 },
  { id: 'q61-08', codigo: '6.1.8',  descricao: 'Ausência de placa de obra com dados do responsável técnico', penalidade: 'Multa', valor: 138.32 },
  { id: 'q61-09', codigo: '6.1.9',  descricao: 'Execução de demolição sem licença', penalidade: 'Multa + Embargo', valor: 553.27 },
  { id: 'q61-10', codigo: '6.1.10', descricao: 'Obra em área de preservação permanente sem autorização', penalidade: 'Multa + Embargo', valor: 2766.35 },
  { id: 'q61-11', codigo: '6.1.11', descricao: 'Construção em área pública sem autorização', penalidade: 'Multa + Embargo', valor: 1383.17 },
  { id: 'q61-12', codigo: '6.1.12', descricao: 'Obra em desacordo com normas de acessibilidade', penalidade: 'Multa', valor: 276.63 },
  { id: 'q61-13', codigo: '6.1.13', descricao: 'Ausência de EPI nos trabalhadores da obra', penalidade: 'Multa', valor: 138.32 },
  { id: 'q61-14', codigo: '6.1.14', descricao: 'Descumprimento de notificação anterior', penalidade: 'Multa Dobrada', valor: 1106.54 },
  { id: 'q61-15', codigo: '6.1.15', descricao: 'Obra paralisada em estado de abandono com risco', penalidade: 'Multa + Embargo', valor: 553.27 },
  { id: 'q61-16', codigo: '6.1.16', descricao: 'Muro em desacordo com as normas municipais', penalidade: 'Multa', valor: 276.63 },
  { id: 'q61-17', codigo: '6.1.17', descricao: 'Calçada executada em desacordo com o padrão municipal', penalidade: 'Multa', valor: 138.32 },
  { id: 'q61-18', codigo: '6.1.18', descricao: 'Piscina ou reservatório sem vedação de segurança', penalidade: 'Multa', valor: 276.63 },
  { id: 'q61-19', codigo: '6.1.19', descricao: 'Obra sem alvará de habite-se após conclusão', penalidade: 'Multa', valor: 276.63 },
  { id: 'q61-20', codigo: '6.1.20', descricao: 'Reconstrução em local embargado', penalidade: 'Multa + Embargo', valor: 2766.35 },
  { id: 'q61-21', codigo: '6.1.21', descricao: 'Execução de obra irregular em área de risco', penalidade: 'Multa + Embargo', valor: 1383.17 },
  { id: 'q61-22', codigo: '6.1.22', descricao: 'Modificação de fachada sem aprovação', penalidade: 'Multa', valor: 276.63 },
  { id: 'q61-23', codigo: '6.1.23', descricao: 'Terreno sem limpeza causando insalubridade', penalidade: 'Multa', valor: 138.32 },
  { id: 'q61-24', codigo: '6.1.24', descricao: 'Obra sem sinalização de segurança adequada', penalidade: 'Multa', valor: 138.32 },
  { id: 'q61-25', codigo: '6.1.25', descricao: 'Descarte irregular de entulho em via pública', penalidade: 'Multa', valor: 276.63 },
  { id: 'q61-26', codigo: '6.1.26', descricao: 'Instalação elétrica irregular na obra', penalidade: 'Multa', valor: 276.63 },
  { id: 'q61-27', codigo: '6.1.27', descricao: 'Obra que prejudica a drenagem natural do terreno', penalidade: 'Multa', valor: 553.27 },
  { id: 'q61-28', codigo: '6.1.28', descricao: 'Ampliação sem licença em edificação já regularizada', penalidade: 'Multa', valor: 553.27 },
  { id: 'q61-29', codigo: '6.1.29', descricao: 'Mudança de uso do imóvel sem aprovação municipal', penalidade: 'Multa', valor: 276.63 },
  { id: 'q61-30', codigo: '6.1.30', descricao: 'Obra em desacordo com recuo obrigatório', penalidade: 'Multa + Embargo', valor: 553.27 },
  { id: 'q61-31', codigo: '6.1.31', descricao: 'Violação de embargo ou lacre municipal', penalidade: 'Multa Agravada', valor: 2766.35 },
]

export const INFRACOES_Q62 = [
  { id: 'q62-01', codigo: '6.2.1',  descricao: 'Obra de urbanização sem licença municipal', penalidade: 'Multa + Embargo', valor: 1383.17 },
  { id: 'q62-02', codigo: '6.2.2',  descricao: 'Venda de lotes sem licença de parcelamento', penalidade: 'Multa', valor: 13831.74 },
  { id: 'q62-03', codigo: '6.2.3',  descricao: 'Parcelamento do solo em desacordo com projeto aprovado', penalidade: 'Multa + Embargo', valor: 2766.35 },
  { id: 'q62-04', codigo: '6.2.4',  descricao: 'Descumprimento de Termo de Ajustamento de Conduta (TAC)', penalidade: 'Multa Dobrada', valor: 2766.35 },
  { id: 'q62-05', codigo: '6.2.5',  descricao: 'Loteamento sem infraestrutura mínima exigida', penalidade: 'Multa + Embargo', valor: 1383.17 },
  { id: 'q62-06', codigo: '6.2.6',  descricao: 'Ausência de áreas públicas obrigatórias no loteamento', penalidade: 'Multa', valor: 2766.35 },
  { id: 'q62-07', codigo: '6.2.7',  descricao: 'Execução de aterro ou terraplanagem sem autorização', penalidade: 'Multa + Embargo', valor: 1383.17 },
  { id: 'q62-08', codigo: '6.2.8',  descricao: 'Ocupação irregular de área de preservação em loteamento', penalidade: 'Multa + Embargo', valor: 13831.74 },
  { id: 'q62-09', codigo: '6.2.9',  descricao: 'Publicidade de loteamento irregular', penalidade: 'Multa', valor: 1383.17 },
  { id: 'q62-10', codigo: '6.2.10', descricao: 'Abertura de rua ou logradouro sem aprovação', penalidade: 'Multa + Embargo', valor: 1383.17 },
  { id: 'q62-11', codigo: '6.2.11', descricao: 'Desmembramento irregular de lote', penalidade: 'Multa', valor: 553.27 },
  { id: 'q62-12', codigo: '6.2.12', descricao: 'Condomínio irregular sem aprovação do empreendimento', penalidade: 'Multa + Embargo', valor: 2766.35 },
  { id: 'q62-13', codigo: '6.2.13', descricao: 'Ocupação de faixa non aedificandi', penalidade: 'Multa + Embargo', valor: 1383.17 },
  { id: 'q62-14', codigo: '6.2.14', descricao: 'Descumprimento de condicionantes de licença urbanística', penalidade: 'Multa', valor: 13.83 },
]

export const STATUS_REGISTROS = [
  'Pendente',
  'Regularizado',
  'Embargado',
  'Autuado',
  'Cancelado',
  'Em recurso',
  'Multa Encaminhada',
]

export const ORIGENS_RECLAMACAO = [
  { value: 'telefone',   label: 'Telefone' },
  { value: 'presencial', label: 'Presencial' },
  { value: 'email',      label: 'E-mail' },
  { value: 'portal',     label: 'Portal do Cidadão' },
]

export const PRIORIDADES = [
  { value: 'baixa',   label: 'Baixa' },
  { value: 'normal',  label: 'Normal' },
  { value: 'alta',    label: 'Alta' },
  { value: 'urgente', label: 'Urgente' },
]
