import React, { useCallback, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Eye, FileDown, User } from "lucide-react";
import toast from "react-hot-toast";

import PageWrapper from "../../components/layout/PageWrapper";
import AuthenticatedImage from "../../components/shared/AuthenticatedImage";
import ErrorState from "../../components/shared/ErrorState";
import SimulationBanner from "../../components/shared/SimulationBanner";
import api, { errorMessage } from "../../api/axios";
import { useFetch } from "../../hooks/useFetch";
import { formatDate } from "../../utils/helpers";

const DR_DESCRIPTIONS = [
  "No signs of diabetic retinopathy were detected. The retina appears healthy with no visible microaneurysms, hemorrhages, or exudates.",
  "Mild non-proliferative diabetic retinopathy. A few microaneurysms are present, indicating early retinal damage.",
  "Moderate non-proliferative diabetic retinopathy. Multiple microaneurysms, dot-blot hemorrhages, and possible hard exudates are observed.",
  "Severe non-proliferative diabetic retinopathy. Extensive hemorrhages and microaneurysms in all quadrants. High risk of progression to proliferative DR.",
  "Proliferative diabetic retinopathy. Neovascularization detected. Immediate specialist referral recommended to prevent vision loss.",
];

// Indexed by dr_stage. Falls back to neutral rather than producing the literal
// class string "undefined" when a stage arrives outside 0-4.
const STAGE_BANNER = [
  "bg-success",
  "bg-warning",
  "bg-warning",
  "bg-danger",
  "bg-danger",
];

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
      // Previously console.error only: the button appeared to do nothing.
      toast.error(errorMessage(err, "Could not generate the report."));
    } finally {
      if (url) URL.revokeObjectURL(url);
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <PageWrapper title="Diagnosis Result">
        <div className="flex justify-center py-20">
          <div
            role="status"
            aria-label="Loading"
            className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-cyprus"
          />
        </div>
      </PageWrapper>
    );
  }

  if (error || !diagnosis) {
    return (
      <PageWrapper title="Diagnosis Result">
        <div className="rounded-xl bg-white shadow-card">
          <ErrorState message={error || "This diagnosis could not be found."} onRetry={load} />
        </div>
      </PageWrapper>
    );
  }

  const bannerColor = STAGE_BANNER[diagnosis.dr_stage] ?? "bg-gray-500";
  const description = DR_DESCRIPTIONS[diagnosis.dr_stage] ?? "No description available for this stage.";
  const confidence =
    diagnosis.confidence != null ? Math.round(diagnosis.confidence * 100) : null;

  return (
    <PageWrapper title="Diagnosis Result">
      {diagnosis.is_simulated && <SimulationBanner className="mb-6" />}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-xl bg-white p-6 shadow-card">
            <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-gray-600">
              Retinal Image
            </h3>
            <div className="overflow-hidden rounded-lg bg-black">
              <AuthenticatedImage
                path={`/images/${diagnosis.id}`}
                alt="Retinal fundus scan for this diagnosis"
                className="h-64 w-full object-contain"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className={`${bannerColor} rounded-xl p-8 text-center text-white`}>
            <p className="mb-2 text-sm font-medium uppercase tracking-wide opacity-90">
              {diagnosis.is_simulated ? "Simulated Stage" : "Detected Stage"}
            </p>
            <h2 className="text-3xl font-bold">{diagnosis.dr_label}</h2>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-card">
            <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-gray-600">
              Model Confidence
            </h3>
            {confidence === null ? (
              <p className="text-sm text-gray-600">Not reported by this model.</p>
            ) : (
              <div className="flex items-center gap-4">
                <div className="h-4 flex-1 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${bannerColor}`}
                    style={{ width: `${confidence}%` }}
                    role="progressbar"
                    aria-valuenow={confidence}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Model confidence"
                  />
                </div>
                <span className="text-lg font-bold text-gray-900">{confidence}%</span>
              </div>
            )}
          </div>

          <div className="space-y-2 rounded-xl bg-white p-6 text-sm shadow-card">
            <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-gray-600">
              Details
            </h3>
            <div>
              Date: <span className="font-medium">{formatDate(diagnosis.created_at)}</span>
            </div>
            <div>
              Model:{" "}
              <span className="font-medium">
                {diagnosis.model_name || "unknown"}
                {diagnosis.model_version ? ` (${diagnosis.model_version})` : ""}
              </span>
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-card">
            <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-gray-600">
              Clinical Description
            </h3>
            <p className="text-sm leading-relaxed text-gray-700">{description}</p>
            {diagnosis.is_simulated && (
              <p className="mt-3 text-xs italic text-gray-600">
                This is the standard description for the stage shown above. Because
                the stage is simulated, it does not describe the uploaded image.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="flex flex-1 items-center justify-center rounded-lg bg-cyprus px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-cyprus-light disabled:opacity-50"
            >
              <FileDown size={18} className="mr-2" aria-hidden="true" />
              {downloading ? "Preparing…" : "Download PDF"}
            </button>
            <button
              onClick={() => navigate(`/patients/${diagnosis.patient_id}`)}
              className="flex flex-1 items-center justify-center rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <User size={18} className="mr-2" aria-hidden="true" /> View Patient
            </button>
            <button
              onClick={() => navigate("/diagnosis/new")}
              className="flex flex-1 items-center justify-center rounded-lg bg-accent px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-accent/90"
            >
              <Eye size={18} className="mr-2" aria-hidden="true" /> New Diagnosis
            </button>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default DiagnosisResult;
