import { readdir, readFile, writeFile } from "node:fs/promises";

const templates = "scripts/readme";
const output = "docs/readme";
const maxBytes = 1024 * 1024;

const shared = {
  font: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI Variable', 'Segoe UI', Inter, system-ui, sans-serif",
  ease: "cubic-bezier(0.4, 0, 0.6, 1)",
  // Fundo de botão igual nos dois temas: o #0A84FF não chega a 4.5:1 com texto branco.
  fill: "#0071E3",
  onFill: "#FFFFFF",
};

const themes = {
  light: {
    ...shared,
    bg: "#FFFFFF",
    bgAlt: "#F5F5F7",
    text: "#1D1D1F",
    secondary: "#6E6E73",
    hairline: "rgba(0,0,0,0.08)",
    glass: "rgba(255,255,255,0.62)",
    accent: "#0071E3",
    link: "#0066CC",
    positive: "#1D7F4C",
    warning: "#B25000",
    shadow: "0.18",
    glassShadow: "0.10",
  },
  dark: {
    ...shared,
    bg: "#000000",
    bgAlt: "#1D1D1F",
    text: "#F5F5F7",
    secondary: "#86868B",
    hairline: "rgba(255,255,255,0.12)",
    glass: "rgba(30,30,32,0.70)",
    accent: "#0A84FF",
    link: "#2997FF",
    positive: "#30D158",
    warning: "#FF9F0A",
    shadow: "0.65",
    glassShadow: "0.50",
  },
};

async function embed(file) {
  const png = await readFile(file);
  return `data:image/png;base64,${png.toString("base64")}`;
}

const only = process.argv.slice(2);
const files = (await readdir(templates)).filter(
  (file) => !only.length || only.includes(file.replace(/\.svg$/, "")),
);

for (const file of files) {
  const template = await readFile(`${templates}/${file}`, "utf8");

  for (const [theme, tokens] of Object.entries(themes)) {
    const images = {};
    for (const [, path] of template.matchAll(/\{\{image:(.+?)\}\}/g)) {
      images[path] ??= await embed(path.replace("{theme}", theme));
    }

    const svg = template.replace(
      /\{\{(image:)?(.+?)\}\}/g,
      (match, image, key) => {
        const value = image ? images[key] : tokens[key];
        if (value === undefined) throw new Error(`${file}: ${match} sem valor`);
        return value;
      },
    );

    const name = `${file.replace(/\.svg$/, "")}-${theme}.svg`;
    if (svg.includes("{{"))
      throw new Error(`${name} tem marcadores por trocar`);
    const bytes = Buffer.byteLength(svg);
    if (bytes > maxBytes) throw new Error(`${name} passa de 1 MB`);

    await writeFile(`${output}/${name}`, svg);
    console.log(`${name} ${Math.round(bytes / 1024)} KB`);
  }
}
