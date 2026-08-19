"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Download, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { getSafeErrorMessage } from "@/lib/api";
import { buildCsvTemplate, parseHairstylesFile, type ImportRowResult } from "@/lib/hairstyle-import";
import { useCreateHairstyle } from "@/lib/queries/hairstyles";
import { FACE_SHAPE_LABELS, type FaceShape } from "@/types/admin";

type ImportOutcome = { row: number; ok: boolean; error?: string };

function formatScores(row: ImportRowResult) {
  if (!row.input) return "—";
  const entries = Object.entries(row.input.match_score_map) as [FaceShape, number][];
  if (entries.length === 0) return "—";
  return entries.map(([shape, score]) => `${FACE_SHAPE_LABELS[shape]} ${score}`).join(", ");
}

export function HairstylesImportDialog() {
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [rows, setRows] = useState<ImportRowResult[] | null>(null);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<ImportOutcome[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createHairstyle = useCreateHairstyle();

  const validCount = rows?.filter((r) => r.input).length ?? 0;
  const errorCount = rows ? rows.length - validCount : 0;

  function reset() {
    setFileName(null);
    setRows(null);
    setResults(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) reset();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResults(null);
    setParsing(true);
    try {
      const parsed = await parseHairstylesFile(file);
      setRows(parsed);
      if (parsed.length === 0) toast.error("File tidak berisi baris data.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal membaca file.");
      setRows(null);
    } finally {
      setParsing(false);
    }
  }

  async function handleImport() {
    if (!rows) return;
    setImporting(true);
    const outcomes: ImportOutcome[] = [];

    for (const row of rows) {
      if (!row.input) continue;
      try {
        await createHairstyle.mutateAsync(row.input);
        outcomes.push({ row: row.row, ok: true });
      } catch (err) {
        outcomes.push({ row: row.row, ok: false, error: getSafeErrorMessage(err, "Gagal disimpan") });
      }
    }

    setImporting(false);
    setResults(outcomes);

    const successCount = outcomes.filter((o) => o.ok).length;
    if (successCount > 0) toast.success(`${successCount} gaya rambut berhasil diimpor`);
    if (successCount < outcomes.length) {
      toast.error(`${outcomes.length - successCount} baris gagal diimpor`);
    }
  }

  function downloadTemplate() {
    const blob = new Blob([buildCsvTemplate()], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template-hairstyles.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button variant="outline" className="gap-2">
            <Upload className="size-4" />
            Import
          </Button>
        }
      />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import gaya rambut dari file</DialogTitle>
          <DialogDescription>
            Format didukung: CSV, Excel (.xlsx), atau JSON. Setiap baris valid langsung tampil ke customer nyata
            begitu diimpor — cek pratinjau di bawah sebelum lanjut.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={downloadTemplate} className="gap-1.5">
              <Download className="size-3.5" />
              Unduh template CSV
            </Button>
            <span className="text-xs text-muted-foreground">
              Kolom: name, image_url, description, oval, round, square, oblong, heart
            </span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls,.json"
            onChange={handleFileChange}
            className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
          />

          {parsing && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner color="brand" size="xs" label="Membaca file..." />
              Membaca {fileName}...
            </div>
          )}

          {rows && !parsing && (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="secondary">{validCount} valid</Badge>
                {errorCount > 0 && <Badge variant="destructive">{errorCount} error</Badge>}
                <span className="text-muted-foreground">dari {rows.length} baris di {fileName}</span>
              </div>

              <div className="max-h-64 overflow-y-auto rounded-lg border border-border">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-muted/90 backdrop-blur">
                    <tr className="text-left">
                      <th className="px-2 py-1.5 font-medium">#</th>
                      <th className="px-2 py-1.5 font-medium">Nama</th>
                      <th className="px-2 py-1.5 font-medium">Skor</th>
                      <th className="px-2 py-1.5 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => {
                      const outcome = results?.find((o) => o.row === r.row);
                      return (
                        <tr key={r.row} className="border-t border-border">
                          <td className="px-2 py-1.5 text-muted-foreground">{r.row}</td>
                          <td className="max-w-40 truncate px-2 py-1.5">
                            {r.input?.name ?? String(r.raw.name ?? "—")}
                          </td>
                          <td className="px-2 py-1.5 text-muted-foreground">{formatScores(r)}</td>
                          <td className="px-2 py-1.5">
                            {outcome ? (
                              outcome.ok ? (
                                <span className="text-emerald-600 dark:text-emerald-400">Berhasil</span>
                              ) : (
                                <span className="text-destructive" title={outcome.error}>
                                  Gagal: {outcome.error}
                                </span>
                              )
                            ) : r.input ? (
                              <span className="text-muted-foreground">Siap diimpor</span>
                            ) : (
                              <span className="text-destructive">{r.errors.join(", ")}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline">{results ? "Tutup" : "Batal"}</Button>} />
          {!results && (
            <Button disabled={!rows || validCount === 0 || importing} onClick={handleImport} className="gap-2">
              {importing && <Spinner color="brand" size="xs" label="Mengimpor..." />}
              Import{validCount > 0 ? ` ${validCount} gaya rambut` : ""}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
