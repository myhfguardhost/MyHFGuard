import {
  Download,
  FileSpreadsheet,
  FileText,
  Menu,
  RefreshCw,
} from "lucide-react";
import logo from "@/assets/loginlogo.jpg";

export default function AdminTopBar({
  title = "Dashboard",
  subtitle = "Monitor alerts, patient status, clinical data and reports.",
  showExportBox = false,
  setShowExportBox,
  exportPDF,
  exportExcel,
  onRefresh,
  onMenuClick,
  showExport = true,
  showRefresh = true,
}) {
  return (
    <header className="mb-5 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-slate-900 shadow-sm sm:px-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <img
            src={logo}
            alt="MyHFGuard logo"
            className="h-12 w-12 shrink-0 rounded-xl object-cover shadow-sm"
          />

          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold text-slate-900 sm:text-3xl">
              {title}
            </h1>
            <p className="mt-1 text-sm text-slate-500 sm:text-base">
              {subtitle}
            </p>
          </div>
        </div>

        <div className="relative flex flex-wrap items-center justify-end gap-2">
          {showRefresh && onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          )}

          {showExport && setShowExportBox && (
            <button
              type="button"
              onClick={() => setShowExportBox((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <Download size={16} />
              Export Data
            </button>
          )}

          <button
            type="button"
            onClick={onMenuClick}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
            aria-label="Toggle admin menu"
          >
            <Menu size={21} />
          </button>

          {showExport && showExportBox && (
            <div className="absolute right-0 top-12 z-20 w-64 rounded-xl border border-slate-200 bg-white p-4 text-slate-900 shadow-2xl">
              <h3 className="font-semibold text-slate-900">Export Data</h3>
              <p className="mb-3 text-sm text-slate-500">
                Choose export format
              </p>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={exportPDF}
                  className="flex w-full items-center gap-2 rounded-lg bg-red-600 px-4 py-3 font-medium text-white hover:bg-red-700"
                >
                  <FileText size={16} />
                  Download as PDF
                </button>

                <button
                  type="button"
                  onClick={exportExcel}
                  className="flex w-full items-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 font-medium text-white hover:bg-emerald-700"
                >
                  <FileSpreadsheet size={16} />
                  Download as Excel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}