import React, { useCallback, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader } from "lucide-react";
import toast from "react-hot-toast";

import PageWrapper from "../../components/layout/PageWrapper";
import ErrorState from "../../components/shared/ErrorState";
import ImageUploader from "../../components/shared/ImageUploader";
import SimulationBanner from "../../components/shared/SimulationBanner";
import api, { errorMessage } from "../../api/axios";
import { EYES } from "../../constants";
import { useFetch } from "../../hooks/useFetch";

const Diagnosis = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [patientId, setPatientId] = useState(searchParams.get("pid") || "");
  const [eye, setEye] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Previously an unhandled rejection: the dropdown just stayed empty with no
  // indication that anything had failed.
  const fetchSetup = useCallback(async () => {
    const [patientsRes, modelRes] = await Promise.allSettled([
      api.get("/patients/", { params: { page: 1, limit: 200 } }),
      api.get("/stats/model"),
    ]);

    if (patientsRes.status === "rejected") throw patientsRes.reason;

    return {
      patients: patientsRes.value.data.items ?? [],
      // On failure assume simulated: better to over-warn than to present
      // placeholder output as if it came from a real model.
      modelInfo:
        modelRes.status === "fulfilled" ? modelRes.value.data : { is_simulated: true },
    };
  }, []);

  const { data, error: loadError, reload: loadPatients } = useFetch(
    fetchSetup,
    [],
    "Could not load your patient list."
  );

  const patients = data?.patients ?? [];
  const modelInfo = data?.modelInfo ?? null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!patientId || !eye || !imageFile) {
      toast.error("Select a patient and eye, and upload an image.");
      return;
    }

    setIsAnalyzing(true);
    const formData = new FormData();
    formData.append("patient_id", patientId);
    formData.append("eye", eye);
    formData.append("image_file", imageFile);

    try {
      const res = await api.post("/diagnosis/run", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        // Inference is the slowest call in the app; give it more room than the
        // 30s instance default.
        timeout: 120000,
      });
      navigate(`/diagnosis/${res.data.id}`);
    } catch (err) {
      toast.error(errorMessage(err, "Analysis failed. Please try again."));
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isAnalyzing) {
    return (
      <PageWrapper title="Run Diagnosis">
        <div className="flex flex-col items-center justify-center py-24">
          <Loader className="mb-4 animate-spin text-cyprus" size={48} aria-hidden="true" />
          <p className="text-lg font-medium text-gray-800" role="status">
            Analysing retinal image…
          </p>
          <p className="mt-1 text-sm text-gray-600">This may take a moment.</p>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Run Diagnosis">
      {modelInfo?.is_simulated !== false && <SimulationBanner className="mb-6" />}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="rounded-xl bg-white p-6 shadow-card">
              <label
                htmlFor="patient-select"
                className="mb-4 block text-lg font-semibold text-gray-900"
              >
                Patient
              </label>
              {loadError ? (
                <ErrorState message={loadError} onRetry={loadPatients} className="py-6" />
              ) : (
                <select
                  id="patient-select"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-accent focus:outline-none focus:ring-accent"
                >
                  <option value="">Select a patient…</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name}
                    </option>
                  ))}
                </select>
              )}
              {!loadError && patients.length === 0 && (
                <p className="mt-3 text-sm text-gray-600">
                  You have no patients yet.{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/patients/new")}
                    className="font-medium text-accent underline"
                  >
                    Add one first
                  </button>
                  .
                </p>
              )}
            </div>

            <div className="rounded-xl bg-white p-6 shadow-card">
              <fieldset>
                <legend className="mb-1 text-lg font-semibold text-gray-900">
                  Eye examined
                </legend>
                <p className="mb-3 text-sm text-gray-600">
                  A fundus image is of one eye. Recording which one is what
                  allows this scan to be compared against earlier scans of the
                  same eye.
                </p>
                <div className="flex gap-3">
                  {EYES.map((option) => {
                    const active = eye === option.value;
                    return (
                      <label
                        key={option.value}
                        className={`flex flex-1 cursor-pointer flex-col items-center rounded-control border-2 px-4 py-3 transition-colors ${
                          active
                            ? "border-cyprus bg-cyprus text-white"
                            : "border-gray-300 bg-white text-gray-800 hover:border-accent"
                        }`}
                      >
                        <input
                          type="radio"
                          name="eye"
                          value={option.value}
                          checked={active}
                          onChange={(e) => setEye(e.target.value)}
                          className="sr-only"
                        />
                        <span className="text-md font-bold tracking-wide">
                          {option.abbr}
                        </span>
                        <span className={`text-xs ${active ? "text-white/80" : "text-gray-600"}`}>
                          {option.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            </div>

            <button
              type="submit"
              disabled={!patientId || !eye || !imageFile}
              className="w-full rounded-lg bg-cyprus py-3 text-sm font-medium text-white transition-colors hover:bg-cyprus-light disabled:cursor-not-allowed disabled:opacity-50"
            >
              Run diagnosis
            </button>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-card">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Retinal fundus image</h2>
            <ImageUploader onFileSelect={setImageFile} />
          </div>
        </div>
      </form>
    </PageWrapper>
  );
};

export default Diagnosis;
