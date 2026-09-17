import React, { useCallback, useState } from "react";
import { ChevronLeft, ChevronRight, FileDown } from "lucide-react";
import toast from "react-hot-toast";

import PageWrapper from "../../components/layout/PageWrapper";
import DRStageBadge from "../../components/shared/DRStageBadge";
import ErrorState from "../../components/shared/ErrorState";
import SimulationBanner from "../../components/shared/SimulationBanner";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { PAGE_SIZE, TBody, TableShell, Td, Th, Tr } from "../../components/ui/DataTable";
import { LoadingPanel } from "../../components/ui/Spinner";
import api, { errorMessage } from "../../api/axios";
import { eyeAbbr } from "../../constants";
import { useFetch } from "../../hooks/useFetch";
import { formatDate } from "../../utils/helpers";

const Reports = () => {
  const [page, setPage] = useState(1);
  const [downloadingId, setDownloadingId] = useState(null);

  // One paginated request, with the patient name joined server-side. This
  // replaces a loop that issued a request per patient — 101 sequential round
  // trips for 100 patients — and swallowed every failure silently.
  const fetchReports = useCallback(
    () =>
      api
        .get("/diagnosis/", { params: { page, limit: PAGE_SIZE } })
        .then((r) => r.data),
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

      <Card padding="none">
        {loading ? (
          <LoadingPanel label="Loading reports" />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : rows.length === 0 ? (
          <p className="py-14 text-center text-sm text-gray-600">
            No reports yet. Run a diagnosis to create one.
          </p>
        ) : (
          <TableShell>
            <thead>
              <tr>
                <Th>Patient</Th>
                <Th>Date</Th>
                <Th>Eye</Th>
                <Th>DR stage</Th>
                <Th>Confidence</Th>
                <Th>Report</Th>
              </tr>
            </thead>
            <TBody>
              {rows.map((d, i) => (
                <Tr key={d.id} index={i}>
                  <Td nowrap className="font-medium text-gray-900">
                    {d.patient_name}
                  </Td>
                  <Td nowrap className="tabular">
                    {formatDate(d.created_at)}
                  </Td>
                  <Td nowrap className="font-semibold tracking-wide text-cyprus">
                    {eyeAbbr(d.eye)}
                  </Td>
                  <Td nowrap>
                    <div className="flex items-center gap-1.5">
                      <DRStageBadge stage={d.dr_stage} />
                      {d.is_simulated && (
                        <Badge
                          tone="warning"
                          size="sm"
                          className="font-semibold uppercase tracking-wide"
                          title="No diagnostic model is connected; this result is a placeholder."
                        >
                          Sim
                        </Badge>
                      )}
                    </div>
                  </Td>
                  <Td nowrap className="tabular">
                    {d.confidence != null ? `${Math.round(d.confidence * 100)}%` : "—"}
                  </Td>
                  <Td nowrap>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownloadPdf(d.id)}
                      disabled={downloadingId === d.id}
                      aria-label={`Download report for ${d.patient_name}`}
                    >
                      <FileDown size={16} aria-hidden="true" />
                    </Button>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </TableShell>
        )}
      </Card>

      {!loading && !error && totalPages > 1 && (
        <div className="mt-4 flex items-center justify-end gap-3">
          <span className="text-xs text-gray-700 tabular">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            aria-label="Previous page"
          >
            <ChevronLeft size={16} aria-hidden="true" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            aria-label="Next page"
          >
            <ChevronRight size={16} aria-hidden="true" />
          </Button>
        </div>
      )}
    </PageWrapper>
  );
};

export default Reports;
