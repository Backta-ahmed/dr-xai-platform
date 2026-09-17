import React, { useCallback, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Edit, Eye, FileDown, PlusCircle } from "lucide-react";
import toast from "react-hot-toast";

import PageWrapper from "../../components/layout/PageWrapper";
import DRStageBadge from "../../components/shared/DRStageBadge";
import ErrorState from "../../components/shared/ErrorState";
import SimulationBanner from "../../components/shared/SimulationBanner";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card, { CardHeading } from "../../components/ui/Card";
import { TBody, TableShell, Td, Th, Tr } from "../../components/ui/DataTable";
import { LoadingPanel } from "../../components/ui/Spinner";
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
  const hasSimulated = diagnoses.some((d) => d.is_simulated);

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
        <LoadingPanel label="Loading patient" className="py-20" />
      </PageWrapper>
    );
  }

  if (error || !patient) {
    return (
      <PageWrapper title="Patient">
        <Card padding="none">
          <ErrorState message={error || "This patient could not be found."} onRetry={load} />
        </Card>
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
      <Card padding="sm" className="mb-3">
        <div className="mb-3 flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold text-gray-900">{patient.full_name}</h2>
          <div className="flex flex-shrink-0 items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate(`/patients/${id}/edit`)}>
              <Edit size={14} aria-hidden="true" />
              Edit
            </Button>
            <Button variant="primary" size="sm" onClick={() => navigate(`/diagnosis/new?pid=${id}`)}>
              <PlusCircle size={14} aria-hidden="true" />
              Run new diagnosis
            </Button>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm md:grid-cols-4">
          {details.map(([label, value]) => (
            <div key={label}>
              <dt className="block text-2xs font-medium uppercase tracking-wide text-gray-600">
                {label}
              </dt>
              <dd className="capitalize text-gray-900">{value}</dd>
            </div>
          ))}
          <div className="col-span-2 md:col-span-4">
            <dt className="block text-2xs font-medium uppercase tracking-wide text-gray-600">
              Notes
            </dt>
            <dd className="whitespace-pre-wrap text-gray-900">{patient.notes || "—"}</dd>
          </div>
        </dl>
      </Card>

      {hasSimulated && <SimulationBanner variant="inline" className="mb-3" />}

      <Card padding="none">
        {/* Wrapped rather than padded via CardHeading's className: `mb-0` there
            would lose to its own `mb-4` on stylesheet order, not class order. */}
        <div className="px-4 pt-3">
          <CardHeading as="h3">Diagnosis history</CardHeading>
        </div>
        {diagnosesFailed ? (
          <ErrorState message="The diagnosis history could not be loaded." onRetry={load} />
        ) : diagnoses.length === 0 ? (
          <p className="px-4 pb-10 pt-2 text-center text-sm text-gray-600">
            No diagnoses recorded yet.
          </p>
        ) : (
          <TableShell>
            <thead>
              <tr>
                <Th>Date</Th>
                <Th>Eye</Th>
                <Th>DR stage</Th>
                <Th>Confidence</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <TBody>
              {diagnoses.map((d, i) => (
                <Tr key={d.id} index={i}>
                  <Td nowrap className="tabular">
                    {formatDate(d.created_at)}
                  </Td>
                  <Td nowrap className="font-semibold tracking-wide text-cyprus">
                    {eyeAbbr(d.eye)}
                  </Td>
                  <Td nowrap>
                    <span className="flex items-center gap-2">
                      <DRStageBadge stage={d.dr_stage} />
                      {d.is_simulated && (
                        <Badge
                          tone="warning"
                          size="sm"
                          className="uppercase tracking-wide"
                          title="No diagnostic model is connected; this result is a placeholder."
                        >
                          Sim
                        </Badge>
                      )}
                    </span>
                  </Td>
                  <Td nowrap className="tabular">
                    {d.confidence != null ? `${Math.round(d.confidence * 100)}%` : "—"}
                  </Td>
                  <Td nowrap>
                    <span className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/diagnosis/${d.id}`)}
                        aria-label="View this diagnosis"
                      >
                        <Eye size={15} aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadPdf(d.id)}
                        disabled={downloadingId === d.id}
                        aria-label="Download the report for this diagnosis"
                      >
                        <FileDown size={15} aria-hidden="true" />
                      </Button>
                    </span>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </TableShell>
        )}
      </Card>
    </PageWrapper>
  );
};

export default PatientDetail;
