import React, { useEffect, useState } from "react";
import PageWrapper from "../../components/layout/PageWrapper";
import api from "../../api/axios";
import DRStageBadge from "../../components/shared/DRStageBadge";
import { formatDate } from "../../utils/helpers";
import { FileDown } from "lucide-react";

const Reports = () => {
  const [diagnoses, setDiagnoses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const patientsRes = await api.get("/patients/?page=1&limit=100");
        const patients = patientsRes.data.items || [];
        let allDiags = [];
        for (const p of patients) {
          try {
            const dRes = await api.get(`/diagnosis/patient/${p.id}`);
            allDiags = [...allDiags, ...dRes.data.map(d => ({ ...d, patient_name: p.full_name }))];
          } catch (e) {}
        }
        allDiags.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setDiagnoses(allDiags);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

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

  return (
    <PageWrapper title="Reports">
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cyprus"></div>
          </div>
        ) : diagnoses.length === 0 ? (
          <p className="text-gray-400 text-center py-16">No reports available yet</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-sand">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">DR Stage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Confidence</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Download</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {diagnoses.map((d, idx) => (
                <tr key={d.id} className={idx % 2 === 0 ? "bg-white" : "bg-sand-light"}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{d.patient_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{formatDate(d.created_at)}</td>
                  <td className="px-6 py-4"><DRStageBadge stage={d.dr_stage} /></td>
                  <td className="px-6 py-4 text-sm text-gray-500">{d.confidence ? `${(d.confidence * 100).toFixed(0)}%` : "—"}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleDownloadPdf(d.id)} className="text-accent hover:text-cyprus transition-colors">
                      <FileDown size={18} />
                    </button>
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

export default Reports;
