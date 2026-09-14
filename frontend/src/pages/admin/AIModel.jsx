import React, { useCallback } from "react";
import { AlertTriangle, CheckCircle, Cpu } from "lucide-react";

import PageWrapper from "../../components/layout/PageWrapper";
import ErrorState from "../../components/shared/ErrorState";
import api from "../../api/axios";
import { useFetch } from "../../hooks/useFetch";

/**
 * Reports the model backend the server is actually running.
 *
 * Everything on this page used to be hardcoded text claiming a "DR-ResNet50-v1"
 * model that does not exist. It now reads GET /admin/model, so it cannot drift
 * out of step with reality.
 */
const AIModel = () => {
  const fetchModel = useCallback(() => api.get("/admin/model").then((r) => r.data), []);
  const {
    data: info,
    loading,
    error,
    reload: load,
  } = useFetch(fetchModel, [], "Could not read the model status.");

  if (loading) {
    return (
      <PageWrapper title="AI Model">
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

  if (error || !info) {
    return (
      <PageWrapper title="AI Model">
        <div className="rounded-xl bg-white shadow-card">
          <ErrorState message={error ?? "No model status available."} onRetry={load} />
        </div>
      </PageWrapper>
    );
  }

  const simulated = info.is_simulated;

  return (
    <PageWrapper title="AI Model">
      <div className="mx-auto max-w-3xl space-y-8">
        {simulated && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border-2 border-red-300 bg-red-50 p-4"
          >
            <AlertTriangle size={22} className="mt-0.5 flex-shrink-0 text-red-700" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-red-900">
                No diagnostic model is connected
              </p>
              <p className="mt-1 text-sm leading-relaxed text-red-800">
                The platform is running the stub backend. Every diagnosis it produces
                is a randomly generated placeholder, recorded in the database as
                simulated and watermarked on every exported report. This must not be
                used for patient care.
              </p>
            </div>
          </div>
        )}

        <div className="rounded-xl bg-white p-8 shadow-card">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-sand p-3 text-cyprus">
                <Cpu size={28} aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  DR grading backend
                </h2>
                <p className="text-sm text-gray-600">
                  Selected by MODEL_BACKEND in backend/.env
                </p>
              </div>
            </div>
            <span
              className={`inline-flex flex-shrink-0 items-center rounded-full px-3 py-1 text-xs font-semibold ${
                simulated ? "bg-amber-100 text-amber-900" : "bg-green-100 text-green-900"
              }`}
            >
              {simulated ? "Simulated" : "Live"}
            </span>
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-4 text-sm md:grid-cols-3">
            {[
              ["Backend key", info.key],
              ["Model name", info.name],
              ["Version", info.version],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-sand-light p-3">
                <dt className="text-xs uppercase tracking-wide text-gray-600">{label}</dt>
                <dd className="mt-1 font-mono font-medium text-gray-900">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="rounded-xl border border-cyprus/20 bg-cyprus/5 p-6">
          <div className="flex items-start gap-3">
            <CheckCircle size={20} className="mt-0.5 flex-shrink-0 text-cyprus" aria-hidden="true" />
            <div>
              <h3 className="text-sm font-semibold text-cyprus">Connecting a real model</h3>
              <p className="mt-1 text-sm leading-relaxed text-gray-700">
                Implement a class satisfying the <code className="rounded bg-sand px-1.5 py-0.5 font-mono text-xs">ModelBackend</code>{" "}
                protocol in{" "}
                <code className="rounded bg-sand px-1.5 py-0.5 font-mono text-xs">
                  backend/app/services/model_service.py
                </code>
                , register it in <code className="rounded bg-sand px-1.5 py-0.5 font-mono text-xs">_BACKENDS</code>, then set{" "}
                <code className="rounded bg-sand px-1.5 py-0.5 font-mono text-xs">MODEL_BACKEND</code> to its key. That file
                documents the full input and output contract. No other part of the
                application needs to change.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default AIModel;
