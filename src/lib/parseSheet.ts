import * as XLSX from "xlsx";

export type Row = Record<string, string>;

export async function parseFile(file: File): Promise<Row[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
    defval: "",
  });

  return json.map((r) => {
    const out: Row = {};
    for (const [k, v] of Object.entries(r)) out[k] = String(v ?? "").trim();
    return out;
  });
}
