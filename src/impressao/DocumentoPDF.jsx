// DocumentoPDF.jsx
// Modelo oficial A4 governamental — notificações, autos e defesas

import { INFO_MODULO } from '../gerencia/GerenciaUI.jsx'
import { mascaraMatricula, mascaraCPF } from '../components/MascaraInput.jsx'

const BRASAO_URL = 'https://upload.wikimedia.org/wikipedia/commons/5/57/Bras%C3%A3o_Vitoria_da_Conquista.svg'
const ENDERECO_PMVC = 'Praça Joaquim Correia, 55, Centro — CEP: 45.040-901 — Vitória da Conquista — BA'
const CNPJ_PMVC = 'CNPJ: 14.105.183/0001-99'

export function imprimirDocumentoOficial(registro) {
  const html = gerarHTML(registro)
  const win  = window.open('', '_blank', 'width=900,height=700')
  win.document.write(html)
  win.document.close()
  setTimeout(() => { win.focus(); win.print() }, 800)
}

export function imprimirDefesaOficial(defesa, registro) {
  const html = gerarHTMLDefesa(defesa, registro)
  const win  = window.open('', '_blank', 'width=900,height=700')
  win.document.write(html)
  win.document.close()
  setTimeout(() => { win.focus(); win.print() }, 800)
}

// ============================================================
// Estilos CSS base compartilhados
// ============================================================
function estilosBase() {
  return `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Barlow', sans-serif;
      font-size: 12px;
      color: #1E293B;
      background: #fff;
    }
    .pagina {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 14mm 18mm 18mm;
      position: relative;
      background: #fff;
    }
    /* Marca d'água — funciona na impressão via background-image no elemento */
    .marca-dagua {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 140mm;
      height: 140mm;
      background-image: url('${BRASAO_URL}');
      background-repeat: no-repeat;
      background-size: contain;
      background-position: center;
      opacity: 0.06;
      pointer-events: none;
      z-index: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .conteudo { position: relative; z-index: 1; }
    .cabecalho {
      display: flex; align-items: center; gap: 16px;
      padding-bottom: 10px; border-bottom: 3px solid #1A56DB; margin-bottom: 14px;
    }
    .brasao { width: 62px; height: 62px; flex-shrink: 0; }
    .cab-prefeitura { font-size: 10px; color: #64748B; text-transform: uppercase; letter-spacing: 0.05em; }
    .cab-secretaria { font-size: 13px; font-weight: 700; color: #1E293B; margin: 2px 0; }
    .cab-gerencia   { font-size: 11px; color: #475569; }
    .cab-lei        { font-size: 10px; color: #94A3B8; margin-top: 2px; }
    .titulo-doc {
      text-align: center; margin-bottom: 14px; padding: 11px 12px;
      background: linear-gradient(135deg, #1A56DB 0%, #1244A8 100%);
      border-radius: 8px; -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    .titulo-doc h1 {
      font-size: 20px; color: #fff; letter-spacing: 0.1em;
      font-weight: 700; margin-bottom: 4px;
    }
    .titulo-doc .num  { font-size: 14px; color: rgba(255,255,255,.9); font-weight: 600; letter-spacing: 0.05em; }
    .titulo-doc .data { font-size: 11px; color: rgba(255,255,255,.75); margin-top: 2px; }
    .secao { margin-bottom: 12px; border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden; }
    .secao-titulo {
      background: #F8FAFC; padding: 5px 12px; font-size: 10px; font-weight: 700;
      color: #475569; text-transform: uppercase; letter-spacing: 0.06em;
      border-bottom: 1px solid #E2E8F0;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    .secao-corpo { padding: 10px 12px; }
    .campo { margin-bottom: 6px; display: flex; gap: 8px; }
    .campo-label { font-size: 10px; color: #94A3B8; min-width: 90px; flex-shrink: 0; text-transform: uppercase; letter-spacing: 0.04em; }
    .campo-valor { font-size: 12px; color: #1E293B; font-weight: 500; flex: 1; }
    .tabela { width: 100%; border-collapse: collapse; font-size: 11px; }
    .tabela th {
      background: #F1F5F9; padding: 6px 10px; text-align: left;
      font-size: 10px; font-weight: 700; color: #475569; text-transform: uppercase;
      letter-spacing: 0.05em; border-bottom: 2px solid #E2E8F0;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    .prazo-box {
      background: #FEF3C7; border: 1px solid #FCD34D; border-radius: 6px;
      padding: 9px 14px; display: flex; justify-content: space-between;
      align-items: center; margin-bottom: 12px;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    .prazo-label { font-size: 11px; color: #B45309; font-weight: 600; }
    .prazo-data  { font-size: 15px; font-weight: 700; color: #B45309; }
    .multa-total {
      background: #FEE2E2; border: 1px solid #FECACA; border-radius: 6px;
      padding: 9px 14px; display: flex; justify-content: space-between;
      align-items: center; margin-top: 6px;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    .multa-label { font-size: 11px; font-weight: 700; color: #B91C1C; text-transform: uppercase; }
    .multa-valor { font-size: 18px; font-weight: 700; color: #B91C1C; }
    .assinaturas { display: flex; gap: 24px; margin-top: 22px; margin-bottom: 18px; }
    .assinatura-box { flex: 1; border-top: 1px solid #1E293B; padding-top: 6px; text-align: center; }
    .assinatura-nome  { font-size: 11px; font-weight: 600; }
    .assinatura-cargo { font-size: 10px; color: #64748B; }
    .rodape-portal {
      display: flex; align-items: center; gap: 14px; padding: 10px 12px;
      background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; margin-top: 14px;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    .rodape-portal img { width: 68px; height: 68px; flex-shrink: 0; }
    .rodape-titulo  { font-size: 11px; font-weight: 700; color: #1E293B; margin-bottom: 3px; }
    .rodape-sub     { font-size: 10px; color: #64748B; line-height: 1.5; }
    .codigo-acesso  { font-size: 15px; font-weight: 700; color: #1A56DB; letter-spacing: 0.15em; font-family: monospace; margin-top: 4px; }
    .rodape-legal {
      margin-top: 14px; padding-top: 8px; border-top: 1px solid #E2E8F0;
      font-size: 9px; color: #94A3B8; text-align: center; line-height: 1.6;
    }
    @media print {
      body { background: #fff; }
      @page { size: A4; margin: 0; }
      .pagina { margin: 0; padding: 12mm 18mm 16mm; }
      .marca-dagua { position: fixed !important; }
    }
  `
}

function cabecalhoHTML(info, lei) {
  return `
    <div class="cabecalho">
      <img class="brasao" src="${BRASAO_URL}" alt="Brasão PMVC"/>
      <div>
        <div class="cab-prefeitura">Prefeitura Municipal de Vitória da Conquista — Estado da Bahia</div>
        <div class="cab-secretaria">${info.secretaria}</div>
        <div class="cab-gerencia">${info.gerencia}</div>
        <div class="cab-lei">${lei}</div>
      </div>
    </div>
  `
}

// ============================================================
// HTML do documento oficial (notificação / auto)
// ============================================================
function gerarHTML(r) {
  const info    = INFO_MODULO[r.gerencia] || INFO_MODULO.obras
  const ehAuto  = r.type === 'auto'
  const tipoNome = ehAuto ? 'AUTO DE INFRAÇÃO' : 'NOTIFICAÇÃO PRELIMINAR'
  const matFmt  = mascaraMatricula(r.matricula || '')
  const cpfFmt  = r.cpf ? mascaraCPF(r.cpf) : ''
  const lei     = r.gerencia === 'obras'
    ? 'Lei Municipal nº 1.481/2007 — Código de Obras e Edificações'
    : 'Lei Municipal nº 695/1993 — Código de Polícia Administrativa'
  const qrUrl   = `https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent(`https://fiscon.pmvc.ba.gov.br/portal?codigo=${r.codigo_acesso}`)}`

  const infracoesHtml = (r.infracoes || []).map((inf, i) => `
    <tr style="background:${i % 2 === 0 ? '#fff' : '#f8fafc'}">
      <td style="padding:6px 10px; font-size:11px; color:#374151; border-bottom:1px solid #e2e8f0;">
        ${inf.codigo ? `<strong>Art. ${inf.codigo}</strong> — ` : ''}${inf.descricao}
        ${inf.penalidade ? `<br/><span style="color:#64748b;font-size:10px;">${inf.penalidade}</span>` : ''}
      </td>
      ${ehAuto ? `<td style="padding:6px 10px; text-align:right; font-size:11px; font-weight:700; color:#B91C1C; border-bottom:1px solid #e2e8f0; white-space:nowrap;">
        ${inf.valor > 0 ? `R$ ${Number(inf.valor).toFixed(2).replace('.', ',')}` : '—'}
      </td>` : ''}
    </tr>
  `).join('')

  // Texto do prazo varia por tipo
  const prazoBadge = ehAuto
    ? `<div class="prazo-box">
        <span class="prazo-label">Prazo para apresentar defesa: 10 dias</span>
        <span class="prazo-data">${r.prazo || '—'}</span>
       </div>`
    : r.prazo
      ? `<div class="prazo-box">
          <span class="prazo-label">Prazo para regularização</span>
          <span class="prazo-data">${r.prazo}</span>
         </div>`
      : ''

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <title>${tipoNome} — ${r.num}</title>
  <link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&display=swap" rel="stylesheet"/>
  <style>${estilosBase()}</style>
</head>
<body>
<div class="marca-dagua"></div>
<div class="pagina">
<div class="conteudo">

  ${cabecalhoHTML(info, lei)}

  <div class="titulo-doc">
    <h1>${tipoNome}</h1>
    <div class="num">Nº ${r.num}</div>
    <div class="data">Vitória da Conquista, ${r.date}</div>
  </div>

  ${prazoBadge}

  <div class="secao">
    <div class="secao-titulo">${ehAuto ? 'Dados do Autuado' : 'Dados do Notificado'}</div>
    <div class="secao-corpo">
      <div class="campo"><span class="campo-label">Nome</span><span class="campo-valor"><strong>${r.owner || '—'}</strong></span></div>
      ${cpfFmt ? `<div class="campo"><span class="campo-label">CPF/CNPJ</span><span class="campo-valor">${cpfFmt}</span></div>` : ''}
      <div class="campo">
        <span class="campo-label">Endereço</span>
        <span class="campo-valor">${r.addr || '—'}${r.bairro ? `, ${r.bairro}` : ''}${r.loteamento ? ` — ${r.loteamento}` : ''}</span>
      </div>
    </div>
  </div>

  <div class="secao">
    <div class="secao-titulo">Infrações Constatadas</div>
    <div class="secao-corpo" style="padding:0;">
      <table class="tabela">
        <thead>
          <tr>
            <th>Descrição da Infração</th>
            ${ehAuto ? '<th style="text-align:right; white-space:nowrap;">Multa (R$)</th>' : ''}
          </tr>
        </thead>
        <tbody>${infracoesHtml}</tbody>
      </table>
    </div>
  </div>

  ${ehAuto && r.multa && Number(r.multa) > 0 ? `
  <div class="multa-total">
    <span class="multa-label">Valor Total da Multa</span>
    <span class="multa-valor">R$ ${Number(r.multa).toFixed(2).replace('.', ',')}</span>
  </div>` : ''}

  ${r.descricao ? `
  <div class="secao" style="margin-top:12px;">
    <div class="secao-titulo">Descrição das Irregularidades</div>
    <div class="secao-corpo">
      <p style="font-size:12px; color:#374151; line-height:1.7;">${r.descricao}</p>
    </div>
  </div>` : ''}

  ${ehAuto && (r.testemunha1 || r.testemunha2) ? `
  <div class="secao">
    <div class="secao-titulo">Testemunhas</div>
    <div class="secao-corpo">
      ${r.testemunha1 ? `<div class="campo"><span class="campo-label">Testemunha 1</span><span class="campo-valor">${r.testemunha1}</span></div>` : ''}
      ${r.testemunha2 ? `<div class="campo"><span class="campo-label">Testemunha 2</span><span class="campo-valor">${r.testemunha2}</span></div>` : ''}
      ${r.obs_recusa  ? `<div class="campo"><span class="campo-label">Obs. recusa</span><span class="campo-valor">${r.obs_recusa}</span></div>` : ''}
    </div>
  </div>` : ''}

  <div class="assinaturas">
    <div class="assinatura-box">
      <div class="assinatura-nome">${r.fiscal || '—'}</div>
      <div class="assinatura-cargo">Agente de Fiscalização — Mat. ${matFmt}</div>
    </div>
    <div class="assinatura-box">
      <div class="assinatura-nome">&nbsp;</div>
      <div class="assinatura-cargo">${ehAuto ? 'Assinatura do Autuado' : 'Assinatura do Notificado'}</div>
    </div>
  </div>

  <div class="rodape-portal">
    <img src="${qrUrl}" alt="QR Code"/>
    <div>
      <div class="rodape-titulo">Portal do Cidadão — Acesse seu documento online</div>
      <div class="rodape-sub">
        Escaneie o QR Code ou acesse <strong>fiscon.pmvc.ba.gov.br/portal</strong><br/>
        e informe o código abaixo para consultar, acompanhar e enviar defesa.
      </div>
      <div class="codigo-acesso">${r.codigo_acesso || '—'}</div>
    </div>
  </div>

  <div class="rodape-legal">
    Prefeitura Municipal de Vitória da Conquista — ${CNPJ_PMVC} — ${ENDERECO_PMVC}<br/>
    ${r.gerencia === 'obras'
      ? 'Documento emitido com fundamento na Lei Municipal nº 1.481/2007 (Código de Obras e Edificações de Vitória da Conquista).'
      : 'Documento emitido com fundamento na Lei Municipal nº 695/1993 (Código de Polícia Administrativa de Vitória da Conquista).'
    }<br/>
    O não cumprimento desta notificação no prazo estipulado poderá resultar em autuação e aplicação das penalidades previstas em lei.
  </div>

</div>
</div>
</body></html>`
}

// ============================================================
// HTML da defesa oficial
// ============================================================
function gerarHTMLDefesa(defesa, registro) {
  const info    = INFO_MODULO[registro?.gerencia] || INFO_MODULO.obras
  const tipoReg = registro?.type === 'auto' ? 'Auto de Infração' : 'Notificação Preliminar'
  const lei     = registro?.gerencia === 'obras'
    ? 'Lei Municipal nº 1.481/2007' : 'Lei Municipal nº 695/1993'

  const statusHtml = defesa.status !== 'pendente' ? `
    <div style="margin-top:18px; padding:13px; background:${defesa.status === 'deferida' ? '#F0FDF4' : '#FEE2E2'}; border:1px solid ${defesa.status === 'deferida' ? '#BBF7D0' : '#FECACA'}; border-radius:8px; -webkit-print-color-adjust:exact; print-color-adjust:exact;">
      <div style="font-size:11px; font-weight:700; color:${defesa.status === 'deferida' ? '#166534' : '#B91C1C'}; margin-bottom:6px;">
        DEFESA ${defesa.status === 'deferida' ? 'DEFERIDA ✅' : 'INDEFERIDA ❌'}
      </div>
      <div style="font-size:10px; color:#64748B; margin-bottom:4px;">Julgado por ${defesa.julgado_por} em ${defesa.julgado_em}</div>
      <div style="font-size:12px; color:#374151;">${defesa.parecer || ''}</div>
    </div>` : ''

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <title>Defesa — ${defesa.record_num}</title>
  <link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700&display=swap" rel="stylesheet"/>
  <style>${estilosBase()}</style>
</head>
<body>
<div class="marca-dagua"></div>
<div class="pagina">
<div class="conteudo">

  ${cabecalhoHTML(info, lei)}

  <div class="titulo-doc">
    <h1>DEFESA ADMINISTRATIVA</h1>
    <div class="num">Ref.: ${tipoReg} Nº ${defesa.record_num}</div>
    <div class="data">${defesa.created_at ? new Date(defesa.created_at).toLocaleDateString('pt-BR') : ''}</div>
  </div>

  <div class="secao">
    <div class="secao-titulo">Dados do Defensor</div>
    <div class="secao-corpo">
      <div class="campo"><span class="campo-label">Nome</span><span class="campo-valor"><strong>${defesa.nome}</strong></span></div>
      ${defesa.cpf ? `<div class="campo"><span class="campo-label">CPF</span><span class="campo-valor">${defesa.cpf}</span></div>` : ''}
    </div>
  </div>

  <div class="secao">
    <div class="secao-titulo">Texto da Defesa</div>
    <div class="secao-corpo">
      <p style="font-size:12px; color:#374151; line-height:1.8; white-space:pre-wrap;">${defesa.texto}</p>
    </div>
  </div>

  ${statusHtml}

  <div class="assinaturas">
    <div class="assinatura-box">
      <div class="assinatura-nome">${defesa.nome}</div>
      <div class="assinatura-cargo">Assinatura do Defensor</div>
    </div>
    <div class="assinatura-box">
      <div class="assinatura-nome">&nbsp;</div>
      <div class="assinatura-cargo">Recebido por / Data</div>
    </div>
  </div>

  <div class="rodape-legal">
    Prefeitura Municipal de Vitória da Conquista — ${CNPJ_PMVC} — ${ENDERECO_PMVC}<br/>
    Protocolo de Defesa Administrativa — Sistema FISCON — Documento com validade jurídica conforme legislação municipal vigente.
  </div>

</div>
</div>
</body></html>`
}
