import { CircleCheckBig } from "lucide-react"


export default function AdminMonitoringTable({ summary = [], goToPatient }) {
  const getDateTime = (value) => {
    const time = new Date(value || 0).getTime()
    return Number.isNaN(time) ? 0 : time
  }


  const sortedSummary = [...summary].sort((a, b) => {
    return (
      getDateTime(b.createdAt || b.patientInfo?.patient?.created_at) -
      getDateTime(a.createdAt || a.patientInfo?.patient?.created_at)
    )
  })


  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-sm">
      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-bold text-slate-900">Patient Monitoring Table</h2>
          <p className="text-sm text-slate-500">
            Latest registered patients are shown first
          </p>
        </div>


        <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          Showing top 5 patients
        </span>
      </div>


      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-[720px] w-full text-sm">
          <thead>
            <tr className="bg-slate-100 text-slate-700">
              <th className="px-3 py-3 text-left font-semibold">Patient</th>
              <th className="px-3 py-3 text-left font-semibold">BP</th>
              <th className="px-3 py-3 text-left font-semibold">Pulse</th>
              <th className="px-3 py-3 text-left font-semibold">Weight</th>
              <th className="px-3 py-3 text-left font-semibold">Steps</th>
              <th className="px-3 py-3 text-left font-semibold">Status</th>
            </tr>
          </thead>


          <tbody>
            {sortedSummary.slice(0, 5).length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-6 text-center text-sm text-slate-500"
                >
                  No patient records found.
                </td>
              </tr>
            ) : (
              sortedSummary.slice(0, 5).map((item) => {
                const patient = item.patientInfo?.patient || {}


                const name =
                  `${patient.first_name || ""} ${patient.last_name || ""}`.trim() ||
                  patient.full_name ||
                  patient.name ||
                  "Unknown Patient"


                const s = item.summaryData?.summary || {}


                const latestWeight =
                  item.vitalsData?.vitals?.weight &&
                  item.vitalsData.vitals.weight.length > 0
                    ? item.vitalsData.vitals.weight[
                        item.vitalsData.vitals.weight.length - 1
                      ]?.value
                    : "-"


                return (
                  <tr
                    key={item.patientId}
                    className="cursor-pointer border-t border-slate-200 text-slate-700 transition hover:bg-slate-50"
                    onClick={() => goToPatient(item.patientId)}
                  >
                    <td className="px-3 py-3">
                      <div className="max-w-[220px] truncate font-semibold text-slate-900">
                        {name}
                      </div>
                    </td>


                    <td className="px-3 py-3">
                      {s.bpSystolic && s.bpDiastolic
                        ? `${s.bpSystolic}/${s.bpDiastolic}`
                        : "-"}
                    </td>


                    <td className="px-3 py-3">{s.bpPulse ?? "-"}</td>


                    <td className="px-3 py-3">
                      {latestWeight !== "-" ? `${latestWeight} kg` : "-"}
                    </td>


                    <td className="px-3 py-3">{s.stepsToday ?? "-"}</td>


                    <td className="px-3 py-3">
                      {item.status === "critical" ? (
                        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                          Critical
                        </span>
                      ) : item.status === "warning" ? (
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                          Warning
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                          <CircleCheckBig size={12} />
                          Stable
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}