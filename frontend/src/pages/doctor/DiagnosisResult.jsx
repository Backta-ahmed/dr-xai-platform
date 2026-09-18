import React, { useCallback, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Eye, FileDown, User } from "lucide-react";
import toast from "react-hot-toast";

import PageWrapper from "../../components/layout/PageWrapper";
import ClinicalNotes from "../../components/shared/ClinicalNotes";
import ErrorState from "../../components/shared/ErrorState";
import FundusViewer from "../../components/shared/FundusViewer";
import SimulationBanner from "../../components/shared/SimulationBanner";
import Button from "../../components/ui/Button";
import Card, { CardHeading, FieldLabel } from "../../components/ui/Card";
import { LoadingPanel } from "../../components/ui/Spinner";
import api, { errorMessage } from "../../api/axios";
import { eyeFull } from "../../constants";
import { useFetch } from "../../hooks/useFetch";
import { formatDateTime } from "../../utils/helpers";

// Wash surface with dark ink, never a solid fill under white text: solid
// --color-success and --color-warning measure ~2.9:1 against white, so the
// previous treatment left the page's most prominent element legible only for
// stages 3 and 4.
const STAGE_SURFACE = [
  "bg-success-wash text-success-ink border-success/30",
  "bg-warning-wash text-warning-ink border-warning/40",
  "bg-warning-wash text-warning-ink border-warning/40",
  "bg-danger-wash text-danger-ink border-danger/40",
  "bg-danger-wash text-danger-ink border-danger/50",
];

// Solid fill for the meter, which carries no text over it.
const STAGE_FILL = ["bg-success", "bg-warning", "bg-warning", "bg-danger", "bg-danger"];

const DiagnosisResult = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [downloading, setDownloading] = useState(false);

  const fetchDiagnosis = useCallback(
    () => api.get(`/diagnosis/${id}`).then((r) => r.data),
    [id]
  );
  const {
    data: diagnosis,
    loading,
    error,
    reload: load,
  } = useFetch(fetchDiagnosis, [id], "This diagnosis could not be loaded.");

  const handleDownloadPdf = async () => {
    setDownloading(true);
    let url;
    try {
      const res = await api.get(`/reports/${id}/pdf`, { responseType: "blob" });
      url = URL.createObjectURL(res.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `DR_Report_${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toast.error(errorMessage(err, "Could not generate the report."));
    } finally {
      if (url) URL.revokeObjectURL(url);
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <PageWrapper title="Diagnosis">
        <LoadingPanel label="Loading diagnosis" className="py-20" />
      </PageWrapper>
    );
  }

  if (error || !diagnosis) {
    return (
      <PageWrapper title="Diagnosis">
        <Card padding="none">
          <ErrorState
            message={error || "This diagnosis could not be found."}
            onRetry={load}
          />
        </Card>
      </PageWrapper>
    );
  }

  const stageSurface =
    STAGE_SURFACE[diagnosis.dr_stage] ?? "bg-gray-100 text-gray-900 border-gray-300";
  const stageFill = STAGE_FILL[diagnosis.dr_stage] ?? "bg-gray-400";
  const confidence =
    diagnosis.confidence != null ? Math.round(diagnosis.confidence * 100) : null;

  return (
    <PageWrapper title="Diagnosis">
      {diagnosis.is_simulated && <SimulationBanner className="mb-5" />}

      {/* Image-primary. The clinician reads the retina first and consults the
          model second; the previous layout inverted that. */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <Card padding="sm">
            {/* Laterality labels the image itself rather than sitting in a
                details list. Which eye you are looking at is part of reading
                the scan, not metadata to look up afterwards. */}
            <div className="mb-2 flex items-baseline gap-2 px-1">
              <span className="text-md font-bold tracking-wide text-cyprus">
                {diagnosis.eye ? diagnosis.eye.toUpperCase() : "—"}
              </span>
              <span className="text-sm text-gray-600">
                {diagnosis.eye
                  ? eyeFull(diagnosis.eye).split("—")[1].trim()
                  : "Eye not recorded"}
              </span>
            </div>
            <FundusViewer
              imagePath={`/images/${diagnosis.id}`}
              alt={`Retinal fundus image — ${eyeFull(diagnosis.eye)}`}
            />
          </Card>
        </div>

        <aside className="flex flex-col gap-4 lg:col-span-4">
          <div className={`${stageSurface} rounded-card border px-5 py-4`}>
            <FieldLabel className="opacity-80">
              {diagnosis.is_simulated ? "Simulated grade" : "Model grade"}
            </FieldLabel>
            <p className="mt-1 text-xl font-bold">
              Stage {diagnosis.dr_stage}
            </p>
            <p className="text-sm font-medium opacity-90">{diagnosis.dr_label}</p>
          </div>

          <Card padding="sm">
            <FieldLabel>Confidence</FieldLabel>
            {confidence === null ? (
              <p className="mt-2 text-sm text-gray-600">Not reported by this model.</p>
            ) : (
              <>
                <div className="mt-2 flex items-center gap-3">
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className={`h-full rounded-full ${stageFill}`}
                      style={{ width: `${confidence}%` }}
                      role="progressbar"
                      aria-valuenow={confidence}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label="Model confidence"
                    />
                  </div>
                  <span className="tabular text-md font-semibold text-gray-900">
                    {confidence}%
                  </span>
                </div>
                {/* A specialist cannot calibrate against a bare scalar. Until the
                    real model reports an operating characteristic, say plainly
                    what this number is and is not. */}
                <p className="mt-2 text-xs leading-relaxed text-gray-600">
                  Reported for the assigned stage. No sensitivity or specificity is
                  published for this backend.
                </p>
              </>
            )}
          </Card>

          <Card padding="sm">
            <FieldLabel>Provenance</FieldLabel>
            <dl className="mt-2 space-y-1.5 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-gray-600">Model</dt>
                <dd className="text-right font-medium text-gray-900">
                  {diagnosis.model_name || "unknown"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-gray-600">Version</dt>
                <dd className="text-right font-medium text-gray-900">
                  {diagnosis.model_version || "unknown"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-gray-600">Analysed</dt>
                <dd className="tabular text-right font-medium text-gray-900">
                  {formatDateTime(diagnosis.created_at)}
                </dd>
              </div>
            </dl>
          </Card>

          {/* The specialist's own read. This is a second-reader tool, so the
              assessment that matters most is theirs, not the model's. */}
          <ClinicalNotes
            diagnosisId={diagnosis.id}
            value={diagnosis.notes}
            onSaved={load}
          />


          {/* One primary action. Previously three flex-1 buttons gave download,
              navigation and a new diagnosis identical weight. */}
          <div className="flex flex-col gap-2">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleDownloadPdf}
              disabled={downloading}
            >
              <FileDown size={17} aria-hidden="true" />
              {downloading ? "Preparing…" : "Download report"}
            </Button>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => navigate(`/patients/${diagnosis.patient_id}`)}
              >
                <User size={16} aria-hidden="true" /> Patient
              </Button>
              <Button variant="secondary" fullWidth onClick={() => navigate("/diagnosis/new")}>
                <Eye size={16} aria-hidden="true" /> New scan
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </PageWrapper>
  );
};

export default DiagnosisResult;
