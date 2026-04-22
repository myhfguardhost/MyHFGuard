export default function AdminSummaryPanels({ dashboardData }) {
  return (
    <>
      <section className="lg:col-span-4 rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
        <h2 className="font-semibold text-slate-800 mb-3">Overall Status</h2>

        <div className="flex flex-col items-center">
          <div className="relative h-40 w-40 rounded-full bg-[conic-gradient(#22c55e_0deg,#22c55e_220deg,#f59e0b_220deg,#f59e0b_300deg,#ef4444_300deg,#ef4444_360deg)] p-4">
            <div className="flex h-full w-full items-center justify-center rounded-full bg-white text-center">
              <div>
                <p className="text-3xl font-bold text-slate-800">
                  {dashboardData.totalPatients}
                </p>
                <p className="text-sm text-slate-500">Patients</p>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 w-full">
            <div className="rounded-lg bg-emerald-50 p-3 text-center">
              <p className="font-bold text-emerald-600">{dashboardData.stable}</p>
              <p className="text-xs text-slate-500">Stable</p>
            </div>
            <div className="rounded-lg bg-amber-50 p-3 text-center">
              <p className="font-bold text-amber-600">{dashboardData.warning}</p>
              <p className="text-xs text-slate-500">Warning</p>
            </div>
            <div className="rounded-lg bg-red-50 p-3 text-center">
              <p className="font-bold text-red-600">{dashboardData.critical}</p>
              <p className="text-xs text-slate-500">Critical</p>
            </div>
          </div>
        </div>
      </section>

      <section className="lg:col-span-4 rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
        <h2 className="font-semibold text-slate-800 mb-3">Patient Summary</h2>

        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
            <span className="text-sm text-slate-600">Total Patients</span>
            <span className="font-bold text-slate-900">{dashboardData.totalPatients}</span>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
            <span className="text-sm text-slate-600">New This Month</span>
            <span className="font-bold text-slate-900">{dashboardData.newThisMonth}</span>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
            <span className="text-sm text-slate-600">Active Patients</span>
            <span className="font-bold text-slate-900">{dashboardData.activePatients}</span>
          </div>
        </div>
      </section>
    </>
  )
}