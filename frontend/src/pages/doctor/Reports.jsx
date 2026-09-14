import React, { useCallback, useState } from "react";
import { ChevronLeft, ChevronRight, FileDown } from "lucide-react";
import toast from "react-hot-toast";

import PageWrapper from "../../components/layout/PageWrapper";
import DRStageBadge from "../../components/shared/DRStageBadge";
import ErrorState from "../../components/shared/ErrorState";
import SimulationBanner from "../../components/shared/SimulationBanner";
import api, { errorMessage } from "../../api/axios";
import { useFetch } from "../../hooks/useFetch";
import { formatDate } from "../../utils/helpers";

const Reports = () => {
  const [page, setPage] = useState(1);
  const [downloadingId, setDownloadingId] = useState(null);

  // One paginated request, with the patient name joined server-side. This
  // replaces a loop that issued a request per patient — 101 sequential round
  // trips for 100 patients — and swallowed every failure silently.
  const fetchReports = useCallback(
    () => api.get("/diagnosis/", { params: { page, limit: 20 } }).then((r) => r.data),
    [page]
  );

  const { data, loading, error, reload: load } = useFetch(
    fetchReports,
    [page],
    "Could not load your reports."
  );

  const rows = data?.items ?? [];
  const totalPages = data?.pages ?? 1;

  const handleDownloadPdf = async (diagnosisId) => {
    setDownloadingId(diagnosisId);
    let url;
    try {
      const res = await api.get(`/reports/${diagnosisId}/pdf`, { responseType: "blob" });
      url = URL.createObjectURL(res.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `DR_Report_${diagnosisId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toast.error(errorMessage(err, "Could not generate the report."));
    } finally {
      if (url) URL.revokeObjectURL(url);
      setDownloadingId(null);
    }
  };

  const hasSimulated = rows.some((r) => r.is_simulated);

  return (
    <PageWrapper title="Reports">
      {hasSimulated && <SimulationBanner variant="inline" className="mb-4" />}

      <div className="rounded-xl bg-white shadow-card">
        {loading ? (
          <div className="flex justify-center py-16">
            <div
              role="status"
              aria-label="Loading"
              className="h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-cyprus"
            />
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : rows.length === 0 ? (
          <p className="py-16 text-center text-sm text-gray-600">
            No reports yet. Run a diagnosis to create one.
          </p>
        ) : (
          // overflow-x-auto, not overflow-hidden: the table scrolls on narrow
          // screens instead of being clipped.
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-sand">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-700">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-700">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-700">DR stage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-700">Confidence</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-700">Report</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((d, idx) => (
                  <tr key={d.id} className={idx % 2 === 0 ? "bg-white" : "bg-sand-light"}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                      {d.patient_name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                      {formatDate(d.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <DRStageBadge stage={d.dr_stage} />
                        {d.is_simulated && (
                          <span
                            className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900"
                            title="No diagnostic model is connected; this result is a placeholder."
                          >
                            Sim
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                      {d.confidence != null ? `${Math.round(d.confidence * 100)}%` : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDownloadPdf(d.id)}
                        disabled={downloadingId === d.id}
                        className="text-accent transition-colors hover:text-cyprus disabled:opacity-40"
                        aria-label={`Download report for ${d.patient_name}`}
                      >
                        <FileDown size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && !error && totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center space-x-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg bg-white p-2 shadow-card transition-colors hover:bg-sand disabled:opacity-30"
            aria-label="Previous page"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm text-gray-700">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg bg-white p-2 shadow-card transition-colors hover:bg-sand disabled:opacity-30"
            aria-label="Next page"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </PageWrapper>
  );
};

export default Reports;
