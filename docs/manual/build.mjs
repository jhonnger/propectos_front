// Genera MANUAL_ADMIN / MANUAL_COLABORADOR en .pdf y .docx desde los .md.
// PDF: Markdown -> HTML (marked) -> Chrome headless --print-to-pdf.
// DOCX: mismo HTML -> html-to-docx.
// Las imágenes se embeben como data URI para que ambos formatos las incluyan.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';
import HTMLtoDOCX from 'html-to-docx';

const here = dirname(fileURLToPath(import.meta.url));
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const CSS = `
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
         color: #1f2430; line-height: 1.55; font-size: 12pt; margin: 0; }
  h1 { color: #4f39d6; font-size: 24pt; margin: 0 0 4pt; }
  h1 + h3 { color: #6b7280; font-weight: 600; margin: 0 0 18pt; }
  h2 { color: #4f39d6; font-size: 16pt; border-bottom: 2px solid #e7e4fb;
       padding-bottom: 4pt; margin: 26pt 0 10pt; page-break-after: avoid; }
  h3 { font-size: 13pt; margin: 16pt 0 6pt; }
  p, li { font-size: 12pt; }
  img { max-width: 100%; height: auto; border: 1px solid #e2e2ea;
        border-radius: 6px; margin: 8pt 0; page-break-inside: avoid; }
  table { border-collapse: collapse; width: 100%; font-size: 11pt; margin: 8pt 0; }
  th, td { border: 1px solid #d6d6e0; padding: 6px 9px; text-align: left; }
  th { background: #f1effc; }
  blockquote { border-left: 4px solid #f0ad4e; background: #fff8ec;
               margin: 10pt 0; padding: 6pt 12pt; color: #5b4a2a; }
  code { background: #f0f0f5; padding: 1px 5px; border-radius: 4px; font-size: 11pt; }
  hr { border: 0; border-top: 1px solid #e2e2ea; margin: 20pt 0; }
  @page { size: A4; margin: 18mm 16mm; }
`;

function inlineImages(html) {
  return html.replace(/src="(img\/[^"]+)"/g, (m, rel) => {
    const p = resolve(here, rel);
    if (!existsSync(p)) { console.warn('  ! imagen no encontrada:', rel); return m; }
    const b64 = readFileSync(p).toString('base64');
    return `src="data:image/png;base64,${b64}"`;
  });
}

function wrap(title, body) {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8">
<title>${title}</title><style>${CSS}</style></head><body>${body}</body></html>`;
}

const docs = [
  { md: 'MANUAL_ADMIN.md',       out: 'MANUAL_ADMIN',       title: 'Manual del Administrador' },
  { md: 'MANUAL_COLABORADOR.md', out: 'MANUAL_COLABORADOR', title: 'Manual del Colaborador' },
];

for (const d of docs) {
  console.log(`\n== ${d.md} ==`);
  const mdText = readFileSync(resolve(here, d.md), 'utf8');
  const body = inlineImages(marked.parse(mdText));
  const html = wrap(d.title, body);

  const htmlPath = resolve(here, `${d.out}.html`);
  writeFileSync(htmlPath, html);

  // PDF con Chrome headless
  const pdfPath = resolve(here, `${d.out}.pdf`);
  execFileSync(CHROME, [
    '--headless', '--disable-gpu', '--no-sandbox',
    '--no-pdf-header-footer',
    `--print-to-pdf=${pdfPath}`,
    `file://${htmlPath}`,
  ], { stdio: 'ignore' });
  console.log('  PDF  ->', pdfPath);

  // DOCX
  const buf = await HTMLtoDOCX(html, null, {
    orientation: 'portrait',
    margins: { top: 720, right: 720, bottom: 720, left: 720 },
    table: { row: { cantSplit: true } },
  });
  const docxPath = resolve(here, `${d.out}.docx`);
  writeFileSync(docxPath, buf);
  console.log('  DOCX ->', docxPath);
}
console.log('\nListo.');
