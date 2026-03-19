import { INFO_MODULO } from '../../gerencia/GerenciaUI.jsx'
import { getGerencia, nomePerfil } from '../../gerencia/gerencia.js'
import { mascaraMatricula, mascaraCPF } from '../../components/MascaraInput.jsx'
import { getOne } from '../../config/supabase.js'

const BRASAO_URL = 'https://upload.wikimedia.org/wikipedia/commons/5/57/Bras%C3%A3o_Vitoria_da_Conquista.svg'

// Abre o crachá em nova guia, em tela cheia, sem bordas
export async function abrirCredencial(usuarioInicial) {
  // Recarrega do banco para pegar foto atualizada
  let usuario = usuarioInicial
  try {
    const dados = await getOne('usuarios', usuarioInicial.id)
    if (dados) usuario = dados
  } catch { /* usa o que tem */ }

  const g    = getGerencia(usuario.gerencia)
  const info = INFO_MODULO[usuario.gerencia] || INFO_MODULO.obras
  const mat  = mascaraMatricula(usuario.matricula || '')
  const cpf  = mascaraCPF(usuario.endereco || '')

  const gradiente = `linear-gradient(175deg, ${g.cor} 0%, ${g.cor}CC 50%, #0a1a4a 100%)`
  const fotoSrc   = usuario.foto_perfil || ''

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
  <title>Crachá — ${usuario.name}</title>
  <link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700&family=Barlow+Condensed:wght@700&display=swap" rel="stylesheet"/>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      height: 100%; width: 100%;
      display: flex; align-items: center; justify-content: center;
      background: #0a1a4a;
      font-family: 'Barlow', sans-serif;
      overflow: hidden;
    }
    .card {
      /* Proporção cartão vertical: 54mm × 85.6mm */
      width: min(90vw, 54vh * 0.631);
      height: min(90vh, 90vw / 0.631);
      background: ${gradiente};
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 16px 64px rgba(0,0,0,0.6);
      position: relative;
      display: flex;
      flex-direction: column;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    /* Marca d'água brasão */
    .dagua {
      position: absolute; inset: 0;
      display: flex; align-items: center; justify-content: center;
      pointer-events: none; z-index: 0;
    }
    .dagua img { width: 85%; height: 85%; opacity: 0.07; object-fit: contain; filter: brightness(10); }
    /* Faixa topo */
    .topo { height: 5px; background: rgba(255,255,255,0.5); position: relative; z-index: 1; }
    /* Cabeçalho */
    .cabecalho {
      padding: 3% 5% 2%; text-align: center;
      border-bottom: 1px solid rgba(255,255,255,0.2);
      position: relative; z-index: 1;
    }
    .brasao-img { width: 12%; height: auto; margin-bottom: 2%; }
    .cab-pref   { font-size: 1.8vmin; color: rgba(255,255,255,0.8); line-height: 1.3; }
    .cab-sec    { font-size: 2.2vmin; font-weight: 700; color: #fff; margin: 1% 0; line-height: 1.2; }
    .cab-ger    { font-size: 1.8vmin; color: rgba(255,255,255,0.75); line-height: 1.3; }
    /* Foto */
    .foto-wrap {
      display: flex; justify-content: center;
      padding: 5% 0 3%;
      position: relative; z-index: 1;
    }
    .foto-circulo {
      width: 26%; padding-top: 26%;
      border-radius: 50%;
      border: 3px solid rgba(255,255,255,0.85);
      overflow: hidden;
      background: rgba(255,255,255,0.15);
      position: relative;
      cursor: grab;
      flex-shrink: 0;
    }
    .foto-circulo img {
      position: absolute; top: 0; left: 0;
      width: 100%; height: 100%;
      object-fit: cover;
      object-position: center top;
      user-select: none;
      -webkit-user-drag: none;
    }
    .foto-sem {
      position: absolute; inset: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: 6vmin;
    }
    /* Nome e cargo */
    .nome-area { text-align: center; padding: 0 5% 3%; position: relative; z-index: 1; }
    .nome {
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 4.5vmin; font-weight: 700; color: #fff;
      line-height: 1.1; letter-spacing: 0.02em;
    }
    .cargo { font-size: 2.5vmin; color: rgba(255,255,255,0.9); font-weight: 600; margin-top: 1.5%; }
    /* Divisor */
    .divisor { height: 1px; background: rgba(255,255,255,0.25); margin: 0 5%; position: relative; z-index: 1; }
    /* Rodapé */
    .rodape {
      padding: 3% 5%; flex: 1;
      display: flex; flex-direction: column; justify-content: center;
      gap: 3%; position: relative; z-index: 1;
    }
    .row { display: flex; justify-content: space-between; align-items: flex-start; }
    .info-label { font-size: 1.6vmin; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 1px; }
    .info-valor { font-size: 2.8vmin; color: #fff; font-weight: 700; letter-spacing: 0.05em; }
    .info-valor-sm { font-size: 2.4vmin; color: #fff; font-weight: 600; letter-spacing: 0.04em; }
    /* Barra inferior */
    .barra-inf { height: 5px; background: rgba(255,255,255,0.3); position: relative; z-index: 1; }
    /* Dica de ajuste */
    .dica {
      position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
      font-size: 12px; color: rgba(255,255,255,0.5);
      background: rgba(0,0,0,0.4); padding: 6px 16px; border-radius: 999px;
      white-space: nowrap; pointer-events: none;
    }
  </style>
</head>
<body>
<div class="card">
  <div class="dagua"><img src="${BRASAO_URL}" alt=""/></div>
  <div class="topo"></div>

  <div class="cabecalho">
    <img class="brasao-img" src="${BRASAO_URL}" alt="Brasão"/>
    <div class="cab-pref">Prefeitura Municipal de Vitória da Conquista</div>
    <div class="cab-sec">${info.secretaria}</div>
    <div class="cab-ger">${info.gerencia}</div>
  </div>

  <div class="foto-wrap">
    <div class="foto-circulo" id="fotoBox">
      ${fotoSrc
        ? `<img src="${fotoSrc}" id="fotoImg" alt="Foto" draggable="false"/>`
        : `<div class="foto-sem">👤</div>`
      }
    </div>
  </div>

  <div class="nome-area">
    <div class="nome">${(usuario.name || '').toUpperCase()}</div>
    <div class="cargo">${usuario.cargo || nomePerfil(usuario)}</div>
  </div>

  <div class="divisor"></div>

  <div class="rodape">
    <div class="row">
      <div>
        <div class="info-label">Matrícula</div>
        <div class="info-valor">${mat}</div>
      </div>
    </div>
    ${cpf ? `
    <div>
      <div class="info-label">CPF</div>
      <div class="info-valor-sm">${cpf}</div>
    </div>` : ''}
  </div>

  <div class="barra-inf"></div>
</div>

${fotoSrc ? '<div class="dica">Arraste a foto para ajustar o enquadramento</div>' : ''}

<script>
  // Drag para ajustar posição da foto no círculo
  const img = document.getElementById('fotoImg')
  if (img) {
    let dragging = false
    let startY = 0
    let currentPos = 50 // percentual top

    img.style.objectPosition = 'center ' + currentPos + '%'

    img.addEventListener('mousedown', e => { dragging = true; startY = e.clientY; e.preventDefault() })
    img.addEventListener('touchstart', e => { dragging = true; startY = e.touches[0].clientY; e.preventDefault() }, { passive: false })

    document.addEventListener('mousemove', e => {
      if (!dragging) return
      const dy = e.clientY - startY
      currentPos = Math.max(0, Math.min(100, currentPos - dy * 0.3))
      img.style.objectPosition = 'center ' + currentPos + '%'
      startY = e.clientY
    })
    document.addEventListener('touchmove', e => {
      if (!dragging) return
      const dy = e.touches[0].clientY - startY
      currentPos = Math.max(0, Math.min(100, currentPos - dy * 0.3))
      img.style.objectPosition = 'center ' + currentPos + '%'
      startY = e.touches[0].clientY
    }, { passive: false })

    document.addEventListener('mouseup',  () => dragging = false)
    document.addEventListener('touchend', () => dragging = false)
  }
</script>
</body></html>`

  const win = window.open('', '_blank')
  win.document.write(html)
  win.document.close()
}
