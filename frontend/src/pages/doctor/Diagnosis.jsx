import React, { useCallback, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";

import PageWrapper from "../../components/layout/PageWrapper";
import ErrorState from "../../components/shared/ErrorState";
import ImageUploader from "../../components/shared/ImageUploader";
import SimulationBanner from "../../components/shared/SimulationBanner";
import Button from "../../components/ui/Button";
import Card, { CardHeading } from "../../components/ui/Card";
import Field from "../../components/ui/Field";
import { Spinner } from "../../components/ui/Spinner";
import api, { errorMessage } from "../../api/axios";
import { EYES } from "../../constants";
import { useFetch } from "../../hooks/useFetch";

// Matches the server's `le=100` on GET /patients/. A clinician with more than
// this cannot reach the rest from the dropdown; the real fix is a searchable
// selector backed by the endpoint's own `search` parameter.
const PATIENT_FETCH_LIMIT = 100;

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
      // 100 is the server's hard cap on this endpoint. Asking for 200 made the
      // request 422, which took out the whole patient selector and made running
      // a diagnosis impossible — the page's only job.
      api.get("/patients/", { params: { page: 1, limit: PATIENT_FETCH_LIMIT } }),
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
        <Card padding="md" className="mx-auto max-w-md">
          <div className="flex flex-col items-center py-10 text-center">
            <Spinner size="lg" label="Analysing retinal image" />
            <p className="mt-4 text-md font-medium text-gray-900">
              Analysing retinal image…
            </p>
            <p className="mt-1 text-sm text-gray-600">This may take a moment.</p>
          </div>
        </Card>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Run Diagnosis">
      {modelInfo?.is_simulated !== false && <SimulationBanner className="mb-5" />}

      <form onSubmit={handleSubmit}>
        {/* Image-weighted: the fundus is the thing being read, the two inputs
            beside it are a few seconds of data entry. */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="flex flex-col gap-4 lg:col-span-5">
            <Card padding="sm">
              <div className="space-y-4">
                {loadError ? (
                  <div>
                    <CardHeading as="h2" className="mb-2">
                      Patient
                    </CardHeading>
                    <ErrorState
                      message={loadError}
                      onRetry={loadPatients}
                      className="py-6"
                    />
                  </div>
                ) : (
                  <>
                    <Field label="Patient" required>
                      {(p) => (
                        <select
                          {...p}
                          value={patientId}
                          onChange={(e) => setPatientId(e.target.value)}
                        >
                          <option value="">Select a patient…</option>
                          {patients.map((patient) => (
                            <option key={patient.id} value={patient.id}>
                              {patient.full_name}
                            </option>
                          ))}
                        </select>
                      )}
                    </Field>

                    {patients.length === 0 && (
                      <p className="text-sm text-gray-600">
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
                  </>
                )}

                {/* Laterality is stored with the scan, so a follow-up can be
                    compared against the same eye. Required — the submit stays
                    disabled until it is set. */}
                <fieldset>
                  <legend className="block text-sm font-medium text-gray-700">
                    Eye examined
                    <span className="ml-0.5 text-danger" aria-hidden="true">
                      *
                    </span>
                  </legend>
                  <div className="mt-1 grid grid-cols-2 gap-2">
                    {EYES.map((option) => {
                      const active = eye === option.value;
                      return (
                        <label
                          key={option.value}
                          className={`flex cursor-pointer items-baseline justify-center gap-2 rounded-control border px-3 py-2 transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent ${
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
                          <span
                            className={`text-xs ${active ? "text-white/80" : "text-gray-600"}`}
                          >
                            {option.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              </div>
            </Card>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={!patientId || !eye || !imageFile}
            >
              Run diagnosis
            </Button>
          </div>

          <Card padding="sm" className="lg:col-span-7">
            <CardHeading as="h2">Retinal fundus image</CardHeading>
            <ImageUploader onFileSelect={setImageFile} />
          </Card>
        </div>
      </form>
    </PageWrapper>
  );
};

export default Diagnosis;
