import React, { useCallback, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Edit, Eye, FileDown, PlusCircle } from "lucide-react";
import toast from "react-hot-toast";

import PageWrapper from "../../components/layout/PageWrapper";
import DRStageBadge from "../../components/shared/DRStageBadge";
import ErrorState from "../../components/shared/ErrorState";
import api, { errorMessage } from "../../api/axios";
import { eyeAbbr } from "../../constants";
import { useFetch } from "../../hooks/useFetch";
import { formatDate } from "../../utils/helpers";

const PatientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [downloadingId, setDownloadingId] = useState(null);

  const fetchPatient = useCallback(async () => {
    // allSettled, not all: a failure fetching the history used to discard the
    // patient too and render "Patient could not be found" for a patient that
    // had loaded perfectly well.
    const [patientResult, diagResult] = await Promise.allSettled([
      api.get(`/patients/${id}`),
      api.get(`/diagnosis/patient/${id}`),
    ]);

    if (patientResult.status === "rejected") throw patientResult.reason;

    return {
      patient: patientResult.value.data,
      diagnoses: diagResult.status === "fulfilled" ? diagResult.value.data ?? [] : [],
      diagnosesFailed: diagResult.status === "rejected",
    };
  }, [id]);

  const { data, loading, error, reload: load } = useFetch(
    fetchPatient,
    [id],
    "This patient could not be loaded."
  );

  const patient = data?.patient ?? null;
  const diagnoses = data?.diagnoses ?? [];
  const diagnosesFailed = data?.diagnosesFailed ?? false;

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

  if (loading) {
    return (
      <PageWrapper title="Patient">
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

  if (error || !patient) {
    return (
      <PageWrapper title="Patient">
        <div className="rounded-xl bg-white shadow-card">
          <ErrorState message={error || "This patient could not be found."} onRetry={load} />
        </div>
      </PageWrapper>
    );
  }

  const details = [
    ["Date of birth", formatDate(patient.date_of_birth)],
    ["Gender", patient.gender || "—"],
    ["Diabetes type", patient.diabetes_type || "—"],
    [
      "Duration",
      patient.diabetes_duration_years != null
        ? `${patient.diabetes_duration_years} years`
        : "—",
    ],
    ["Phone", patient.phone || "—"],
  ];

  return (
    <PageWrapper title="Patient">
      <div className="mb-8 rounded-xl bg-white p-6 shadow-card">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-xl font-semibold text-gray-900">{patient.full_name}</h2>
          <button
            onClick={() => navigate(`/patients/${id}/edit`)}
            className="flex flex-shrink-0 items-center text-sm text-accent transition-colors hover:text-cyprus"
          >
            <Edit size={16} className="mr-1" aria-hidden="true" /> Edit
          </button>
        </div>
        <dl className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
          {details.map(([label, value]) => (
            <div key={label}>
              <dt className="block text-gray-600">{label}</dt>
              <dd className="capitalize text-gray-900">{value}</dd>
            </div>
          ))}
          <div className="col-span-2">
            <dt className="block text-gray-600">Notes</dt>
            <dd className="whitespace-pre-wrap text-gray-900">{patient.notes || "—"}</dd>
          </div>
        </dl>
      </div>

      <div className="mb-6">
        <button
          onClick={() => navigate(`/diagnosis/new?pid=${id}`)}
          className="flex items-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent/90"
        >
          <PlusCircle size={18} className="mr-2" aria-hidden="true" /> Run new diagnosis
        </button>
      </div>

      <div className="rounded-xl bg-white shadow-card">
        <h3 className="p-6 pb-0 text-lg font-semibold text-gray-900">Diagnosis history</h3>
        {diagnosesFailed ? (
          <ErrorState message="The diagnosis history could not be loaded." onRetry={load} />
        ) : diagnoses.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-600">
            No diagnoses recorded yet.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-sand">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-700">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-700">Eye</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-700">DR stage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-700">Confidence</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {diagnoses.map((d, idx) => (
                  <tr key={d.id} className={idx % 2 === 0 ? "bg-white" : "bg-sand-light"}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                      {formatDate(d.created_at)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold tracking-wide text-cyprus">
                      {eyeAbbr(d.eye)}
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
                    <td className="space-x-3 whitespace-nowrap px-6 py-4 text-sm">
                      <button
                        onClick={() => navigate(`/diagnosis/${d.id}`)}
                        className="text-accent transition-colors hover:text-cyprus"
                        aria-label="View this diagnosis"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleDownloadPdf(d.id)}
                        disabled={downloadingId === d.id}
                        className="text-accent transition-colors hover:text-cyprus disabled:opacity-40"
                        aria-label="Download the report for this diagnosis"
                      >
                        <FileDown size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default PatientDetail;
