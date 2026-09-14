import React, { useEffect, useState } from "react";
import PageWrapper from "../../components/layout/PageWrapper";
import api from "../../api/axios";
import DRStageBadge from "../../components/shared/DRStageBadge";
import { formatDate } from "../../utils/helpers";
import { useParams, useNavigate } from "react-router-dom";
import { Edit, Eye, FileDown, PlusCircle } from "lucide-react";

const PatientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [diagnoses, setDiagnoses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patientRes, diagRes] = await Promise.all([
          api.get(`/patients/${id}`),
          api.get(`/diagnosis/patient/${id}`),
        ]);
        setPatient(patientRes.data);
        setDiagnoses(diagRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleDownloadPdf = async (diagnosisId) => {
    try {
      const res = await api.get(`/reports/${diagnosisId}/pdf`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Report_${diagnosisId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <PageWrapper title="Patient Detail">
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyprus"></div>
        </div>
      </PageWrapper>
    );
  }

  if (!patient) {
    return <PageWrapper title="Patient Not Found"><p className="text-gray-400">Patient could not be found.</p></PageWrapper>;
  }

  return (
    <PageWrapper title="Patient Detail">
      {/* Patient Info Card */}
      <div className="bg-white rounded-xl shadow-card p-6 mb-8">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-semibold text-gray-900">{patient.full_name}</h2>
          <button onClick={() => navigate(`/patients/${id}/edit`)} className="flex items-center text-sm text-accent hover:text-cyprus transition-colors">
            <Edit size={16} className="mr-1" /> Edit
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><span className="text-gray-500 block">Date of Birth</span>{formatDate(patient.date_of_birth)}</div>
          <div><span className="text-gray-500 block">Gender</span><span className="capitalize">{patient.gender || "—"}</span></div>
          <div><span className="text-gray-500 block">Diabetes Type</span><span className="capitalize">{patient.diabetes_type || "—"}</span></div>
          <div><span className="text-gray-500 block">Duration</span>{patient.diabetes_duration_years ? `${patient.diabetes_duration_years} years` : "—"}</div>
          <div><span className="text-gray-500 block">Phone</span>{patient.phone || "—"}</div>
          <div className="col-span-2"><span className="text-gray-500 block">Notes</span>{patient.notes || "—"}</div>
        </div>
      </div>

      {/* Actions */}
      <div className="mb-6">
        <button onClick={() => navigate(`/diagnosis/new?pid=${id}`)} className="flex items-center px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors text-sm font-medium">
          <PlusCircle size={18} className="mr-2" /> Run New Diagnosis
        </button>
      </div>

      {/* Diagnosis History */}
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <h3 className="text-lg font-semibold text-gray-900 p-6 pb-0">Diagnosis History</h3>
        {diagnoses.length === 0 ? (
          <p className="text-gray-400 text-center py-12">No diagnoses recorded yet</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 mt-4">
            <thead className="bg-sand">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">DR Stage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Confidence</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">XAI</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {diagnoses.map((d, idx) => (
                <tr key={d.id} className={idx % 2 === 0 ? "bg-white" : "bg-sand-light"}>
                  <td className="px-6 py-4 text-sm text-gray-500">{formatDate(d.created_at)}</td>
                  <td className="px-6 py-4"><DRStageBadge stage={d.dr_stage} /></td>
                  <td className="px-6 py-4 text-sm text-gray-500">{d.confidence ? `${(d.confidence * 100).toFixed(0)}%` : "—"}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 capitalize">{d.xai_method || "—"}</td>
                  <td className="px-6 py-4 text-sm space-x-3">
                    <button onClick={() => navigate(`/diagnosis/${d.id}`)} className="text-accent hover:text-cyprus transition-colors"><Eye size={16} /></button>
                    <button onClick={() => handleDownloadPdf(d.id)} className="text-accent hover:text-cyprus transition-colors"><FileDown size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </PageWrapper>
  );
};

export default PatientDetail;
