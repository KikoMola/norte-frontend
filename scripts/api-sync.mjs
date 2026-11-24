// Descarga el contrato de norte-backend en una referencia concreta (tag, rama o commit) y la anota.
// Uso: npm run api:sync -- <ref>     (por defecto, master)
import { writeFile } from 'node:fs/promises';

const ref = process.argv[2] ?? 'master';
if (!/^[\w./-]+$/.test(ref)) {
  console.error(`Referencia no válida: ${ref}`);
  process.exit(1);
}

const url = `https://raw.githubusercontent.com/KikoMola/norte-backend/${ref}/api/openapi.yaml`;
const response = await fetch(url);
if (!response.ok) {
  console.error(`No se pudo descargar ${url}: ${response.status} ${response.statusText}`);
  process.exit(1);
}

await writeFile(new URL('../api/openapi.yaml', import.meta.url), await response.text());
await writeFile(new URL('../api/SOURCE_REF', import.meta.url), `${ref}\n`);
console.log(`Contrato actualizado desde norte-backend@${ref}. Ejecuta npm run api:generate.`);
