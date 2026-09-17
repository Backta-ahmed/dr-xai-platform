import React, { useCallback } from "react";
import { AlertTriangle, CheckCircle, Cpu } from "lucide-react";

import PageWrapper from "../../components/layout/PageWrapper";
import ErrorState from "../../components/shared/ErrorState";
import Badge from "../../components/ui/Badge";
import Card, { FieldLabel } from "../../components/ui/Card";
import { LoadingPanel } from "../../components/ui/Spinner";
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
        <LoadingPanel label="Reading model status" />
      </PageWrapper>
    );
  }

  if (error || !info) {
    return (
      <PageWrapper title="AI Model">
        <Card padding="none">
          <ErrorState message={error ?? "No model status available."} onRetry={load} />
        </Card>
      </PageWrapper>
    );
  }

  const simulated = info.is_simulated;

  return (
    <PageWrapper title="AI Model">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* The loudest thing on the page, deliberately. No diagnostic model is
            connected, and an administrator must not be able to skim past that.
            danger-wash under danger-ink reads at roughly 8:1; the previous raw
            red utilities were outside the design system's palette. */}
        {simulated && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-card border-2 border-danger/50 bg-danger-wash p-4"
          >
            <AlertTriangle
              size={22}
              className="mt-0.5 flex-shrink-0 text-danger"
              aria-hidden="true"
            />
            <div>
              <p className="text-md font-semibold text-danger-ink">
                No diagnostic model is connected
              </p>
              <p className="mt-1 text-sm leading-relaxed text-danger-ink">
                The platform is running the stub backend. Every diagnosis it produces
                is a randomly generated placeholder, recorded in the database as
                simulated and watermarked on every exported report. This must not be
                used for patient care.
              </p>
            </div>
          </div>
        )}

        <Card>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-control bg-sand p-2.5 text-cyprus">
                <Cpu size={24} aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-md font-semibold text-gray-900">DR grading backend</h2>
                <p className="text-xs text-gray-600">
                  Selected by MODEL_BACKEND in backend/.env
                </p>
              </div>
            </div>
            <Badge tone={simulated ? "danger" : "success"} size="md" className="flex-shrink-0">
              {simulated ? "Simulated" : "Live"}
            </Badge>
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3">
            {[
              ["Backend key", info.key],
              ["Model name", info.name],
              ["Version", info.version],
            ].map(([label, value]) => (
              <div key={label} className="rounded-control bg-sand-light p-3">
                <dt>
                  <FieldLabel>{label}</FieldLabel>
                </dt>
                <dd className="mt-1 font-mono text-sm font-medium text-gray-900">{value}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <div className="rounded-card border border-cyprus/20 bg-cyprus/5 p-5">
          <div className="flex items-start gap-3">
            <CheckCircle size={18} className="mt-0.5 flex-shrink-0 text-cyprus" aria-hidden="true" />
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
