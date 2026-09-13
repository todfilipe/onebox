import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const output = path.join(process.cwd(), "docs", "readme");

const themes = {
  light: {
    bg: "#FFFFFF",
    alt: "#F5F5F7",
    surface: "#FFFFFF",
    glass: "#FFFFFFD9",
    text: "#1D1D1F",
    secondary: "#6E6E73",
    tertiary: "#86868B",
    hairline: "#D2D2D7",
    accent: "#0071E3",
    link: "#0066CC",
    positive: "#1D7F4C",
    warning: "#B25000",
    destructive: "#C4271C",
    shadow: "#0000002E",
  },
  dark: {
    bg: "#000000",
    alt: "#1D1D1F",
    surface: "#1D1D1F",
    glass: "#1E1E20E8",
    text: "#F5F5F7",
    secondary: "#A1A1A6",
    tertiary: "#86868B",
    hairline: "#3A3A3C",
    accent: "#0A84FF",
    link: "#2997FF",
    positive: "#30D158",
    warning: "#FF9F0A",
    destructive: "#FF453A",
    shadow: "#000000A6",
  },
};

const font =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI Variable', 'Segoe UI', Inter, system-ui, sans-serif";

function escape(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function text(x, y, value, size, color, weight = 400, anchor = "start") {
  return `<text x="${x}" y="${y}" fill="${color}" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}" letter-spacing="${size >= 36 ? "-0.022em" : size >= 20 ? "-0.012em" : "-0.016em"}">${escape(value)}</text>`;
}

function multiline(x, y, lines, size, color, weight = 400, gap = 1.35) {
  return `<text x="${x}" y="${y}" fill="${color}" font-size="${size}" font-weight="${weight}" letter-spacing="-0.016em">${lines
    .map(
      (line, index) =>
        `<tspan x="${x}" dy="${index ? size * gap : 0}">${escape(line)}</tspan>`,
    )
    .join("")}</text>`;
}

function frame(
  title,
  description,
  width,
  height,
  theme,
  body,
  extraDefs = "",
  extraCss = "",
) {
  const c = themes[theme];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title description">
  <title id="title">${escape(title)}</title>
  <desc id="description">${escape(description)}</desc>
  <defs>
    <filter id="float" x="-20%" y="-25%" width="140%" height="160%">
      <feDropShadow dx="0" dy="18" stdDeviation="24" flood-color="${c.shadow}"/>
    </filter>
    ${extraDefs}
  </defs>
  <style>
    text { font-family: ${font}; }
    .flow { stroke-dasharray: 10 18; animation: travel 8s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
    .pulse { animation: pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
    @keyframes travel { 0% { stroke-dashoffset: 140; } 100% { stroke-dashoffset: 0; } }
    @keyframes pulse { 0%, 10%, 100% { opacity: .35; } 44%, 72% { opacity: 1; } }
    @media (prefers-reduced-motion: reduce) {
      .flow, .pulse { animation: none; }
      .flow { stroke-dashoffset: 0; }
      .pulse { opacity: 1; }
    }
    ${extraCss}
  </style>
  <rect width="${width}" height="${height}" fill="${c.bg}"/>
  ${body(c)}
</svg>
`;
}

function logo(x, y, c, size = 42) {
  const scale = size / 42;
  return `<g transform="translate(${x} ${y}) scale(${scale})">
    <rect width="42" height="42" rx="12" fill="${c.accent}"/>
    <g fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 8v26"/><path d="M10 13h5c2.5 0 4 1.5 4 4v5"/>
      <path d="M32 13h-5c-2.5 0-4 1.5-4 4v5"/><path d="M11 27h5l3 5h4l3-5h5"/>
    </g>
  </g>`;
}

function panel(x, y, width, height, radius, c, contents, glass = false) {
  return `<g filter="url(#float)">
    <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="${glass ? c.glass : c.surface}" stroke="${c.hairline}"/>
    ${contents}
  </g>`;
}

function mailIcon(x, y, c, size = 26) {
  return `<g transform="translate(${x} ${y})" fill="none" stroke="${c.text}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <rect width="${size}" height="${size * 0.72}" y="${size * 0.14}" rx="4"/>
    <path d="M2 ${size * 0.24} L${size / 2} ${size * 0.52} L${size - 2} ${size * 0.24}"/>
  </g>`;
}

function searchIcon(x, y, c) {
  return `<g transform="translate(${x} ${y})" fill="none" stroke="${c.text}" stroke-width="1.5" stroke-linecap="round"><circle cx="10" cy="10" r="7"/><path d="m15 15 6 6"/></g>`;
}

function clockIcon(x, y, c) {
  return `<g transform="translate(${x} ${y})" fill="none" stroke="${c.text}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="9"/><path d="M11 6v5l4 2"/></g>`;
}

function slidersIcon(x, y, c) {
  return `<g transform="translate(${x} ${y})" fill="none" stroke="${c.text}" stroke-width="1.5" stroke-linecap="round"><path d="M1 7h10M17 7h6M1 17h4M11 17h12"/><circle cx="14" cy="7" r="3"/><circle cx="8" cy="17" r="3"/></g>`;
}

function connector(x1, y1, x2, y2, c, animated = false) {
  return `<path d="M${x1} ${y1} H${x2}" fill="none" stroke="${animated ? c.accent : c.hairline}" stroke-width="${animated ? 3 : 2}" stroke-linecap="round" ${animated ? 'class="flow"' : ""}/>`;
}

function node(x, y, width, title, subtitle, c, accent = false) {
  return `<g>
    <rect x="${x}" y="${y}" width="${width}" height="112" rx="20" fill="${accent ? c.accent : c.surface}" stroke="${accent ? c.accent : c.hairline}"/>
    ${text(x + 24, y + 46, title, 20, accent ? "#FFFFFF" : c.text, 600)}
    ${text(x + 24, y + 76, subtitle, 14, accent ? "#FFFFFF" : c.secondary, 400)}
  </g>`;
}

const assets = {
  nav: (theme) =>
    frame(
      "Navegação do OneBox",
      "Barra de navegação com o símbolo e o nome OneBox.",
      1400,
      96,
      theme,
      (c) => `<rect width="1400" height="96" fill="${c.glass}"/>
        ${logo(72, 27, c, 42)}
        ${text(130, 59, "OneBox", 22, c.text, 600)}
        ${text(1328, 58, "oneboxai.me", 15, c.link, 500, "end")}`,
    ),

  accounts: (theme) =>
    frame(
      "Todas as contas numa caixa",
      "Quatro contas Gmail convergem numa só inbox, sem perder a origem de cada mensagem.",
      1400,
      720,
      theme,
      (c) => {
        const accounts = [
          ["T", "Trabalho", 178],
          ["P", "Pessoal", 278],
          ["U", "Faculdade", 378],
          ["A", "Antiga", 478],
        ];
        const left = accounts
          .map(
            ([initial, label, y]) => `<g>
              <rect x="96" y="${y}" width="310" height="76" rx="18" fill="${c.surface}" stroke="${c.hairline}"/>
              <circle cx="137" cy="${y + 38}" r="20" fill="${c.alt}" stroke="${c.hairline}"/>
              ${text(137, y + 44, initial, 15, c.text, 600, "middle")}
              ${text(174, y + 35, label, 17, c.text, 600)}
              ${text(174, y + 57, "Conta Gmail ligada", 13, c.secondary)}
              ${connector(406, y + 38, 594, 360, c, false)}
            </g>`,
          )
          .join("");
        const rows = [
          ["T", "Ana Marques", "Proposta revista para sexta", "Alta", 230],
          ["P", "Rita Nogueira", "Jantar de sábado", "Média", 326],
          ["U", "Serviços Académicos", "Prazo na terça", "Alta", 422],
          ["A", "EDP Comercial", "Fatura disponível", "Baixa", 518],
        ];
        const inboxRows = rows
          .map(
            ([initial, sender, subject, category, y]) => `<g>
              <circle cx="665" cy="${y + 30}" r="18" fill="${c.alt}" stroke="${c.hairline}"/>
              ${text(665, y + 35, initial, 13, c.text, 600, "middle")}
              ${text(700, y + 24, sender, 16, c.text, 600)}
              ${text(700, y + 48, subject, 14, c.secondary)}
              <rect x="1114" y="${y + 12}" width="94" height="32" rx="16" fill="${c.alt}" stroke="${c.hairline}"/>
              ${text(1161, y + 33, category, 13, c.text, 500, "middle")}
            </g>`,
          )
          .join("");
        return `${text(96, 92, "4 contas ligadas", 28, c.text, 600)}
          ${text(96, 126, "A origem continua visível em cada linha.", 16, c.secondary)}
          ${left}
          <path d="M594 216 V504" stroke="${c.hairline}" stroke-width="2"/>
          ${connector(594, 360, 622, 360, c, true)}
          ${panel(
            622,
            130,
            682,
            490,
            28,
            c,
            `
            ${text(666, 190, "Inbox unificada", 24, c.text, 600)}
            <rect x="1036" y="160" width="224" height="44" rx="22" fill="${c.alt}" stroke="${c.hairline}"/>
            ${searchIcon(1056, 171, c)}
            ${text(1090, 188, "Pesquisar em todas", 14, c.secondary)}
            ${inboxRows}
          `,
          )}`;
      },
    ),

  ai: (theme) =>
    frame(
      "A IA lê primeiro",
      "Um email é transformado num resumo de uma linha e numa classificação de importância.",
      1400,
      720,
      theme,
      (c) => `${panel(
        80,
        120,
        560,
        480,
        28,
        c,
        `
          ${mailIcon(124, 164, c, 30)}
          ${text(174, 181, "Email recebido", 15, c.secondary, 500)}
          ${text(124, 244, "Proposta revista para sexta", 26, c.text, 600)}
          ${text(124, 286, "Ana Marques · 09:24", 15, c.secondary)}
          ${multiline(124, 354, ["Olá Filipe, segue a versão revista da proposta.", "Preciso da tua confirmação até sexta para fechar", "o orçamento e manter o prazo de novembro."], 17, c.text, 400, 1.55)}
        `,
      )}
        ${connector(640, 360, 760, 360, c, true)}
        <circle cx="700" cy="360" r="24" fill="${c.accent}"/>
        ${text(700, 367, "IA", 14, "#FFFFFF", 600, "middle")}
        ${panel(
          760,
          120,
          560,
          480,
          28,
          c,
          `
          ${text(804, 181, "Lido antes de abrir", 15, c.link, 600)}
          ${text(804, 244, "Resumo", 22, c.text, 600)}
          ${multiline(804, 286, ["Precisa da tua confirmação até sexta", "e anexa o orçamento final."], 18, c.text, 400, 1.55)}
          ${text(804, 392, "Importância", 15, c.secondary, 500)}
          <rect x="804" y="416" width="126" height="42" rx="21" fill="${c.alt}" stroke="${c.hairline}"/>
          <circle cx="829" cy="437" r="5" fill="${c.destructive}"/>
          ${text(851, 443, "Alta", 15, c.text, 600)}
          ${text(804, 520, "Resposta sugerida pronta", 15, c.secondary, 500)}
          <path d="M804 546 H1208" stroke="${c.hairline}"/>
        `,
        )}`,
    ),

  reply: (theme) =>
    frame(
      "Responde em segundos",
      "Cartão de resposta sugerida com controlos para ajustar o tom antes do envio.",
      1400,
      720,
      theme,
      (c) => `${text(80, 94, "Resposta sugerida", 17, c.link, 600)}
        ${text(80, 145, "O rascunho já está pronto.", 40, c.text, 600)}
        ${panel(
          80,
          200,
          1240,
          430,
          28,
          c,
          `
          <g>
            ${text(128, 256, "Ajustar tom", 15, c.secondary, 500)}
            ${["Mais formal", "Mais curta", "Mais simpática", "Mais direta"]
              .map((label, index) => {
                const widths = [132, 126, 152, 130];
                const x =
                  128 +
                  widths
                    .slice(0, index)
                    .reduce((sum, value) => sum + value + 12, 0);
                return `<rect x="${x}" y="280" width="${widths[index]}" height="40" rx="20" fill="${index === 1 ? c.accent : c.alt}" stroke="${index === 1 ? c.accent : c.hairline}"/>
                  ${text(x + widths[index] / 2, 306, label, 14, index === 1 ? "#FFFFFF" : c.text, 500, "middle")}`;
              })
              .join("")}
          </g>
          <rect x="128" y="350" width="1144" height="190" rx="16" fill="${c.bg}" stroke="${c.hairline}"/>
          ${multiline(164, 397, ["Olá Ana,", "Confirmado: o novo valor e o prazo de novembro funcionam.", "Filipe"], 17, c.text, 400, 1.7)}
          <rect x="1084" y="560" width="188" height="48" rx="24" fill="${c.accent}"/>
          ${text(1178, 590, "Rever e enviar", 15, "#FFFFFF", 600, "middle")}
        `,
        )}`,
    ),

  pipeline: (theme) =>
    frame(
      "Pipeline de processamento do OneBox",
      "Duas contas Gmail enviam eventos para o n8n, a Gemini resume, as regras pessoais prevalecem e o email chega classificado à inbox.",
      1400,
      520,
      theme,
      (
        c,
      ) => `${text(70, 80, "Do email novo à inbox organizada", 34, c.text, 600)}
        ${text(70, 116, "Uma pipeline orientada a eventos, sem polling.", 16, c.secondary)}
        ${node(70, 190, 170, "Gmail", "Contas A e B", c)}
        ${node(280, 190, 170, "Pub/Sub", "Evento push", c)}
        ${node(490, 190, 170, "n8n", "Orquestra", c, true)}
        ${node(700, 190, 170, "Gemini", "Resume e sugere", c)}
        ${node(910, 190, 190, "Regras", "Ganham à IA", c)}
        ${node(1140, 190, 190, "Inbox", "Já classificado", c, true)}
        ${connector(240, 246, 280, 246, c, true)}
        ${connector(450, 246, 490, 246, c, true)}
        ${connector(660, 246, 700, 246, c, true)}
        ${connector(870, 246, 910, 246, c, true)}
        ${connector(1100, 246, 1140, 246, c, true)}
        <g class="pulse">
          <rect x="918" y="350" width="404" height="86" rx="20" fill="${c.alt}" stroke="${c.hairline}"/>
          ${text(946, 384, "Prioridade determinística", 16, c.text, 600)}
          ${text(946, 412, "A escolha do utilizador é aplicada por último.", 14, c.secondary)}
        </g>`,
    ),

  features: (theme) =>
    frame(
      "Funcionalidades do dia a dia",
      "Três cartões mostram pesquisa global, arquivo e adiados, e regras pessoais.",
      1400,
      600,
      theme,
      (c) => {
        const cards = [
          [
            70,
            "Pesquisa",
            "em todas as contas",
            "Procura no assunto, remetente",
            "e resumo ao mesmo tempo.",
            searchIcon,
          ],
          [
            490,
            "Arquivo e adiados",
            "sem perder o fio",
            "O email volta à inbox",
            "à hora que escolheste.",
            clockIcon,
          ],
          [
            910,
            "Regras pessoais",
            "sempre primeiro",
            "Remetente, domínio ou palavra.",
            "A tua decisão prevalece.",
            slidersIcon,
          ],
        ];
        return `${text(70, 82, "O resto do que precisas.", 34, c.text, 600)}
          ${cards
            .map(([x, first, second, line1, line2, icon]) =>
              panel(
                x,
                130,
                370,
                390,
                28,
                c,
                `
              <circle cx="${x + 54}" cy="190" r="30" fill="${c.alt}" stroke="${c.hairline}"/>
              ${icon(x + 43, 179, c)}
              ${text(x + 42, 284, first, 25, c.text, 600)}
              ${text(x + 42, 317, second, 25, c.text, 600)}
              ${multiline(x + 42, 382, [line1, line2], 16, c.secondary, 400, 1.55)}
            `,
              ),
            )
            .join("")}`;
      },
    ),

  architecture: (theme) =>
    frame(
      "Arquitetura do OneBox",
      "Diagrama com Next.js, Auth.js, Supabase, Gmail API, Pub/Sub, n8n, Gemini e o VPS Hetzner.",
      1400,
      760,
      theme,
      (c) => `${text(70, 82, "Como é feito.", 34, c.text, 600)}
        ${text(70, 118, "Produto, dados e automação com responsabilidades separadas.", 16, c.secondary)}
        <rect x="60" y="150" width="1280" height="540" rx="32" fill="${c.alt}"/>
        ${text(92, 190, "VPS Hetzner · Docker", 14, c.secondary, 600)}
        ${node(100, 230, 220, "Next.js", "Interface e API", c, true)}
        ${node(100, 410, 220, "Auth.js", "OAuth Google", c)}
        ${node(460, 230, 220, "Supabase", "RLS e Realtime", c)}
        ${node(460, 410, 220, "Gmail API", "watch e history", c)}
        ${node(820, 230, 220, "n8n", "Pipeline", c, true)}
        ${node(820, 410, 220, "Gemini", "Resumo e resposta", c)}
        ${node(1110, 320, 170, "Pub/Sub", "Eventos push", c)}
        <path d="M320 286 H460" stroke="${c.hairline}" stroke-width="2"/>
        <path d="M320 466 H390 V342 H460" fill="none" stroke="${c.hairline}" stroke-width="2"/>
        <path d="M680 466 H750 V286 H820" fill="none" stroke="${c.hairline}" stroke-width="2"/>
        <path d="M1040 286 H1110 V376" fill="none" stroke="${c.hairline}" stroke-width="2"/>
        <path d="M1110 376 H1074 V466 H1040" fill="none" stroke="${c.hairline}" stroke-width="2"/>
        <path d="M820 466 H750 V342 H680" fill="none" stroke="${c.accent}" stroke-width="3" class="flow"/>
        <path d="M460 286 H390 V286 H320" fill="none" stroke="${c.accent}" stroke-width="3" class="flow"/>
        ${text(700, 650, "Realtime entrega cada email sem refrescar a página", 15, c.secondary, 500, "middle")}`,
    ),

  roadmap: (theme) =>
    frame(
      "Roadmap do OneBox",
      "Linha temporal das fases zero a nove, da fundação ao deploy.",
      1400,
      430,
      theme,
      (c) => {
        const phases = [
          ["0", "Fundação"],
          ["1", "Contas"],
          ["2", "Dados"],
          ["3", "Pipeline"],
          ["4", "Inbox"],
          ["5", "Email"],
          ["6", "Escrita"],
          ["7", "Regras"],
          ["8", "Pesquisa"],
          ["9", "Deploy"],
        ];
        return `${text(70, 82, "Construído por fases.", 34, c.text, 600)}
          ${text(70, 118, "Cada camada foi validada antes de receber a seguinte.", 16, c.secondary)}
          <path d="M110 240 H1290" stroke="${c.hairline}" stroke-width="4" stroke-linecap="round"/>
          <path d="M110 240 H1290" stroke="${c.accent}" stroke-width="4" stroke-linecap="round"/>
          ${phases
            .map(([number, label], index) => {
              const x = 110 + index * (1180 / 9);
              const highlight = index === 9;
              return `<g>
                <circle cx="${x}" cy="240" r="${highlight ? 24 : 17}" fill="${highlight ? c.accent : c.surface}" stroke="${c.accent}" stroke-width="3"/>
                ${text(x, 246, number, 14, highlight ? "#FFFFFF" : c.text, 600, "middle")}
                ${text(x, 294, label, 13, c.text, 500, "middle")}
              </g>`;
            })
            .join("")}
          <rect x="1016" y="344" width="314" height="46" rx="23" fill="${c.alt}" stroke="${c.hairline}"/>
          ${text(1173, 373, "10 fases · MVP em produção", 14, c.text, 600, "middle")}`;
      },
    ),
};

await mkdir(output, { recursive: true });

for (const [name, render] of Object.entries(assets)) {
  for (const theme of Object.keys(themes)) {
    await writeFile(path.join(output, `${name}-${theme}.svg`), render(theme));
  }
}

console.log(`Gerados ${Object.keys(assets).length * 2} SVGs em ${output}`);
