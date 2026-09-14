import React, { useState, useEffect } from "react";
import PageWrapper from "../../components/layout/PageWrapper";
import ImageUploader from "../../components/shared/ImageUploader";
import api from "../../api/axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Loader } from "lucide-react";

const Diagnosis = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedPid = searchParams.get("pid") || "";

  const [patients, setPatients] = useState([]);
  const [patientId, setPatientId] = useState(preselectedPid);
  const [imageFile, setImageFile] = useState(null);
  const [xaiMethod, setXaiMethod] = useState("gradcam");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    api.get("/patients/?page=1&limit=100").then((res) => {
      setPatients(res.data.items || []);
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!patientId || !imageFile) {
      toast.error("Please select a patient and upload an image");
      return;
    }

    setIsAnalyzing(true);
    const formData = new FormData();
    formData.append("patient_id", patientId);
    formData.append("image_file", imageFile);
    formData.append("xai_method", xaiMethod);

    try {
      const res = await api.post("/diagnosis/run", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Diagnosis complete!");
      navigate(`/diagnosis/${res.data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Diagnosis failed");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isAnalyzing) {
    return (
      <PageWrapper title="Run Diagnosis">
        <div className="flex flex-col items-center justify-center py-24">
          <Loader className="animate-spin text-cyprus mb-4" size={48} />
          <p className="text-lg font-medium text-gray-700">Analyzing retinal image...</p>
          <p className="text-sm text-gray-400 mt-1">This may take a moment</p>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Run Diagnosis">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column — Form */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Patient</h3>
              <select
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent text-sm"
              >
                <option value="">Select a patient...</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.full_name}</option>
                ))}
              </select>
            </div>

            <div className="bg-white rounded-xl shadow-card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">XAI Method</h3>
              <div className="flex flex-wrap gap-3">
                {["gradcam", "lime", "shap", "none"].map((method) => (
                  <label key={method} className={`cursor-pointer px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    xaiMethod === method
                      ? "bg-cyprus text-white border-cyprus"
                      : "bg-white text-gray-700 border-gray-300 hover:border-accent"
                  }`}>
                    <input
                      type="radio"
                      name="xai_method"
                      value={method}
                      checked={xaiMethod === method}
                      onChange={(e) => setXaiMethod(e.target.value)}
                      className="hidden"
                    />
                    {method.toUpperCase()}
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-cyprus text-white rounded-lg hover:bg-cyprus-light transition-colors font-medium text-sm"
            >
              Run Diagnosis
            </button>
          </div>

          {/* Right Column — Image */}
          <div className="bg-white rounded-xl shadow-card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Retinal Fundus Image</h3>
            <ImageUploader onFileSelect={setImageFile} />
          </div>
        </div>
      </form>
    </PageWrapper>
  );
};

export default Diagnosis;
