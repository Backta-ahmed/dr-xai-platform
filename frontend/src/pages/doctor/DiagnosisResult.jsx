import React, { useEffect, useState } from "react";
import PageWrapper from "../../components/layout/PageWrapper";
import api from "../../api/axios";
import DRStageBadge from "../../components/shared/DRStageBadge";
import { formatDate, drStageLabel } from "../../utils/helpers";
import { useParams, useNavigate } from "react-router-dom";
import { FileDown, User, Eye } from "lucide-react";

const DR_DESCRIPTIONS = [
  "No signs of diabetic retinopathy were detected. The retina appears healthy with no visible microaneurysms, hemorrhages, or exudates.",
  "Mild non-proliferative diabetic retinopathy. A few microaneurysms are present, indicating early retinal damage.",
  "Moderate non-proliferative diabetic retinopathy. Multiple microaneurysms, dot-blot hemorrhages, and possible hard exudates are observed.",
  "Severe non-proliferative diabetic retinopathy. Extensive hemorrhages and microaneurysms in all quadrants. High risk of progression to proliferative DR.",
  "Proliferative diabetic retinopathy. Neovascularization detected. Immediate specialist referral recommended to prevent vision loss."
];

const DiagnosisResult = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [diagnosis, setDiagnosis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/diagnosis/${id}`).then((res) => {
      setDiagnosis(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  const handleDownloadPdf = async () => {
    try {
      const res = await api.get(`/reports/${id}/pdf`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `DR_Report_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <PageWrapper title="Diagnosis Result">
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyprus"></div>
        </div>
      </PageWrapper>
    );
  }

  if (!diagnosis) {
    return <PageWrapper title="Diagnosis Not Found"><p className="text-gray-400">This diagnosis could not be found.</p></PageWrapper>;
  }

  const stageColors = ["bg-success", "bg-warning", "bg-warning", "bg-danger", "bg-danger"];
  const confidence = diagnosis.confidence ? (diagnosis.confidence * 100).toFixed(0) : 0;

  return (
    <PageWrapper title="Diagnosis Result">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column — Images */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-card p-6">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Original Retinal Image</h3>
            <div className="bg-black rounded-lg overflow-hidden">
              <img src={`http://localhost:8000${diagnosis.image_url}`} alt="Retinal scan" className="w-full h-64 object-contain" />
            </div>
          </div>

          {diagnosis.xai_image_url && (
            <div className="bg-white rounded-xl shadow-card p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">XAI Heatmap</h3>
                {diagnosis.xai_method && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-cyprus/10 text-cyprus uppercase">
                    {diagnosis.xai_method}
                  </span>
                )}
              </div>
              <div className="bg-black rounded-lg overflow-hidden">
                <img src={`http://localhost:8000${diagnosis.xai_image_url}`} alt="XAI Heatmap" className="w-full h-64 object-contain" />
              </div>
            </div>
          )}
        </div>

        {/* Right Column — Results */}
        <div className="space-y-6">
          {/* Stage Banner */}
          <div className={`${stageColors[diagnosis.dr_stage]} rounded-xl p-8 text-center text-white`}>
            <p className="text-sm font-medium uppercase tracking-wide opacity-80 mb-2">Detected Stage</p>
            <h2 className="text-3xl font-bold">{diagnosis.dr_label}</h2>
          </div>

          {/* Confidence Bar */}
          <div className="bg-white rounded-xl shadow-card p-6">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">AI Confidence</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${stageColors[diagnosis.dr_stage]}`}
                  style={{ width: `${confidence}%` }}
                ></div>
              </div>
              <span className="text-lg font-bold text-gray-900">{confidence}%</span>
            </div>
          </div>

          {/* Diagnosis Details */}
          <div className="bg-white rounded-xl shadow-card p-6 space-y-3 text-sm">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Details</h3>
            <div className="flex items-center gap-2"><User size={14} className="text-gray-400" /> Patient ID: <span className="font-medium">{diagnosis.patient_id}</span></div>
            <div>Date: <span className="font-medium">{formatDate(diagnosis.created_at)}</span></div>
          </div>

          {/* Clinical Description */}
          <div className="bg-white rounded-xl shadow-card p-6">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Clinical Description</h3>
            <p className="text-sm text-gray-700 leading-relaxed">{DR_DESCRIPTIONS[diagnosis.dr_stage]}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={handleDownloadPdf} className="flex-1 flex items-center justify-center px-4 py-3 bg-cyprus text-white rounded-lg hover:bg-cyprus-light transition-colors text-sm font-medium">
              <FileDown size={18} className="mr-2" /> Download PDF Report
            </button>
            <button onClick={() => navigate(`/patients/${diagnosis.patient_id}`)} className="flex-1 flex items-center justify-center px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
              <User size={18} className="mr-2" /> View Patient
            </button>
            <button onClick={() => navigate("/diagnosis/new")} className="flex-1 flex items-center justify-center px-4 py-3 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors text-sm font-medium">
              <Eye size={18} className="mr-2" /> New Diagnosis
            </button>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default DiagnosisResult;
