export default function AdminSummaryPanels({ dashboardData }) {
  const stable = Number(dashboardData.stable || 0);
  const warning = Number(dashboardData.warning || 0);
  const critical = Number(dashboardData.critical || 0);
  const total = stable + warning + critical || Number(dashboardData.totalPatients || 0);

  const stableDeg = total > 0 ? (stable / total) * 360 : 0;
  const warningDeg = total > 0 ? (warning / total) * 360 : 0;
  const criticalDeg = total > 0 ? (critical / total) * 360 : 0;

  const stableEnd = stableDeg;
  const warningEnd = stableDeg + warningDeg;
  const criticalEnd = stableDeg + warningDeg + criticalDeg;

  const donutStyle = {
    background:
      total > 0
        ? `conic-gradient(
            #22c55e 0deg ${stableEnd}deg,
            #f59e0b ${stableEnd}deg ${warningEnd}deg,
            #ef4444 ${warningEnd}deg ${criticalEnd}deg
          )`
        : "#e5e7eb",
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      <section className="lg:col-span-12 rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
        <h2 className="font-semibold text-slate-900 mb-4">Overall Status</h2>

        <div className="flex flex-col items-center">
          <div
            className="relative h-36 w-36 rounded-full p-4"
            style={donutStyle}
          >
            <div className="flex h-full w-full items-center justify-center rounded-full bg-white text-center">
              <div>
                <p className="text-3xl font-bold text-slate-900">
                  {dashboardData.totalPatients}
                </p>
                <p className="text-sm text-slate-600">Patients</p>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3 w-full">
            <div className="rounded-xl bg-emerald-50 p-3 text-center">
              <p className="font-bold text-emerald-700 text-lg">{stable}</p>
              <p className="text-sm text-slate-700">Stable</p>
            </div>

            <div className="rounded-xl bg-amber-50 p-3 text-center">
              <p className="font-bold text-amber-700 text-lg">{warning}</p>
              <p className="text-sm text-slate-700">Warning</p>
            </div>

            <div className="rounded-xl bg-red-50 p-3 text-center">
              <p className="font-bold text-red-700 text-lg">{critical}</p>
              <p className="text-sm text-slate-700">Critical</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}