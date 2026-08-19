import Papa from "papaparse";
import * as XLSX from "xlsx";
import { FACE_SHAPES, type FaceShape, type HairstyleInput } from "@/types/admin";

export type ImportRowResult = {
  row: number;
  raw: Record<string, unknown>;
  input: HairstyleInput | null;
  errors: string[];
};

function normalizeKey(key: string) {
  return key.trim().toLowerCase();
}

function toLowerKeyRecord(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    out[normalizeKey(key)] = value;
  }
  return out;
}

// Scores <= 0 (including blank cells, which coerce to 0) are treated as "not
// relevant for this shape" — same rule as the manual add/edit form.
function coerceScore(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const num = typeof value === "number" ? value : Number(String(value).trim());
  if (!Number.isFinite(num) || num <= 0) return undefined;
  return Math.min(100, Math.max(0, Math.round(num)));
}

function validateRow(raw: Record<string, unknown>, rowNumber: number): ImportRowResult {
  const normalized = toLowerKeyRecord(raw);
  const errors: string[] = [];

  const name = String(normalized.name ?? "").trim();
  const imageUrl = String(normalized.image_url ?? normalized["image url"] ?? normalized.image ?? "").trim();
  const description = String(normalized.description ?? "").trim();

  if (!name) errors.push("Nama kosong");
  if (!imageUrl) errors.push("URL foto kosong");
  if (!description) errors.push("Deskripsi kosong");

  const matchScoreMap: Partial<Record<FaceShape, number>> = {};
  const nested = normalized.match_score_map;

  if (nested && typeof nested === "object") {
    // JSON rows may carry the API's native nested shape directly.
    for (const shape of FACE_SHAPES) {
      const score = coerceScore((nested as Record<string, unknown>)[shape]);
      if (score !== undefined) matchScoreMap[shape] = score;
    }
  } else {
    // CSV/Excel rows (and flat JSON rows) carry one column per face shape.
    for (const shape of FACE_SHAPES) {
      const score = coerceScore(normalized[shape]);
      if (score !== undefined) matchScoreMap[shape] = score;
    }
  }

  if (errors.length > 0) {
    return { row: rowNumber, raw, input: null, errors };
  }

  return {
    row: rowNumber,
    raw,
    input: { name, image_url: imageUrl, description, match_score_map: matchScoreMap },
    errors: [],
  };
}

function isBlankRow(row: Record<string, unknown>) {
  return Object.values(row).every((value) => value === undefined || value === null || String(value).trim() === "");
}

function parseCsv(file: File): Promise<Record<string, unknown>[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data),
      error: (err: Error) => reject(err),
    });
  });
}

async function parseExcel(file: File): Promise<Record<string, unknown>[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return [];
  const sheet = workbook.Sheets[firstSheetName];
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
}

async function parseJson(file: File): Promise<Record<string, unknown>[]> {
  const text = await file.text();
  const data: unknown = JSON.parse(text);
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  if (data && typeof data === "object" && Array.isArray((data as { hairstyles?: unknown }).hairstyles)) {
    return (data as { hairstyles: Record<string, unknown>[] }).hairstyles;
  }
  throw new Error('JSON harus berupa array, atau objek dengan field "hairstyles" berisi array.');
}

export async function parseHairstylesFile(file: File): Promise<ImportRowResult[]> {
  const ext = file.name.split(".").pop()?.toLowerCase();

  let rawRows: Record<string, unknown>[];
  if (ext === "csv") {
    rawRows = await parseCsv(file);
  } else if (ext === "xlsx" || ext === "xls") {
    rawRows = await parseExcel(file);
  } else if (ext === "json") {
    rawRows = await parseJson(file);
  } else {
    throw new Error("Format file tidak didukung. Gunakan .csv, .xlsx, atau .json.");
  }

  return rawRows
    .filter((row) => !isBlankRow(row))
    .map((row, index) => validateRow(row, index + 1));
}

export function buildCsvTemplate(): string {
  const header = ["name", "image_url", "description", ...FACE_SHAPES].join(",");
  const example = [
    "Fade Pompadour",
    "https://contoh.com/foto-fade-pompadour.jpg",
    '"Potongan fade rapi dengan bagian atas disisir ke belakang, cocok untuk wajah oval dan kotak."',
    "92",
    "",
    "85",
    "",
    "",
  ].join(",");
  return `${header}\n${example}\n`;
}
