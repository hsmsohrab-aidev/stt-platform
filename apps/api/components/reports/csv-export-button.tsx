'use client';

import { Button } from '@/components/ui/button';
import { logGeneratedReportAction } from '@/app/(dashboard)/reports/actions';

type CsvExportButtonProps = {
  filename: string;
  headers: string[];
  rows: Array<Array<string | number | null | undefined>>;
  label?: string;
  reportType?: string;
  reportTitle?: string;
};

export function CsvExportButton({
  filename,
  headers,
  rows,
  label = 'Export CSV',
  reportType,
  reportTitle,
}: CsvExportButtonProps) {
  async function onExport() {
    const escape = (v: string | number | null | undefined) => {
      const s = v == null ? '' : String(v);
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const lines = [
      headers.map(escape).join(','),
      ...rows.map((r) => r.map(escape).join(',')),
    ];
    const blob = new Blob([lines.join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    if (reportType) {
      const fd = new FormData();
      fd.set('report_type', reportType);
      fd.set('title', reportTitle ?? label);
      fd.set('format', 'csv');
      try {
        await logGeneratedReportAction(fd);
      } catch {
        // history is best-effort
      }
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="h-8 rounded-[9px] text-xs font-semibold print:hidden"
      onClick={() => void onExport()}
    >
      {label}
    </Button>
  );
}
