import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound, Loader2, RefreshCw } from "lucide-react";

import {
  getAdminPasswordHelpRequests,
  PasswordHelpRequest,
} from "@/lib/api";

export default function PasswordHelpRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<PasswordHelpRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError("");
      const result = await getAdminPasswordHelpRequests();
      setRequests(result.requests || []);
    } catch (requestError: any) {
      setError(requestError?.message || "Failed to load password-help requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
    const timer = window.setInterval(loadRequests, 60000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-amber-600" />
            <h2 className="text-lg font-bold">Password Help Requests</h2>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Patients who requested help accessing MyHFGuard.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
            {requests.length} pending
          </span>
          <button
            type="button"
            onClick={loadRequests}
            disabled={loading}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {loading && requests.length === 0 ? (
        <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading password-help requests...
        </div>
      ) : error ? (
        <div className="px-4 py-6 text-sm text-red-600">{error}</div>
      ) : requests.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-slate-500">
          No pending password-help requests.
        </div>
      ) : (
        <div className="divide-y divide-slate-200">
          {requests.map((request) => (
            <div
              key={request.id}
              className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-semibold text-slate-900">
                  User ID: {request.assigned_user_id}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Requested {new Date(request.created_at).toLocaleString()}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  navigate(`/admin/patient/${request.patient_id}`, {
                    state: { from: "/admin/dashboard" },
                  })
                }
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                View Patient
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
