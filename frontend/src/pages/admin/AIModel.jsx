import React from "react";
import PageWrapper from "../../components/layout/PageWrapper";
import { Cpu, Upload, CheckCircle } from "lucide-react";

const AIModel = () => {
  return (
    <PageWrapper title="AI Model Manager">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Current Model Card */}
        <div className="bg-white rounded-xl shadow-card p-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-sand rounded-lg text-cyprus">
                <Cpu size={28} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">DR Classification Model</h3>
                <p className="text-sm text-gray-500">ResNet50-based retinal analysis</p>
              </div>
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Stub Mode
            </span>
          </div>

          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-sand-light rounded-lg p-3">
              <p className="text-gray-500 text-xs uppercase tracking-wide">Model Name</p>
              <p className="font-medium text-gray-900 mt-1">DR-ResNet50-v1</p>
            </div>
            <div className="bg-sand-light rounded-lg p-3">
              <p className="text-gray-500 text-xs uppercase tracking-wide">Version</p>
              <p className="font-medium text-gray-900 mt-1">1.0.0-stub</p>
            </div>
            <div className="bg-sand-light rounded-lg p-3">
              <p className="text-gray-500 text-xs uppercase tracking-wide">Status</p>
              <p className="font-medium text-yellow-600 mt-1">Mock / Stub</p>
            </div>
            <div className="bg-sand-light rounded-lg p-3">
              <p className="text-gray-500 text-xs uppercase tracking-wide">Last Updated</p>
              <p className="font-medium text-gray-900 mt-1">N/A</p>
            </div>
          </div>
        </div>

        {/* Upload New Model (Stub) */}
        <div className="bg-white rounded-xl shadow-card p-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload New Model</h3>
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-3 text-sm text-gray-500">Model upload functionality coming soon</p>
            <p className="text-xs text-gray-400 mt-1">Supported: .pt, .h5, .onnx, .pkl</p>
            <button disabled className="mt-4 px-4 py-2 bg-gray-200 text-gray-400 rounded-lg cursor-not-allowed text-sm">
              Upload Model File
            </button>
          </div>
        </div>

        {/* Integration Info */}
        <div className="bg-cyprus/5 border border-cyprus/20 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <CheckCircle size={20} className="text-cyprus mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-cyprus">Integration Ready</h4>
              <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                The system is designed for plug-and-play model integration. To connect a real AI model,
                modify <code className="bg-sand px-1.5 py-0.5 rounded text-xs font-mono">backend/app/services/model_service.py</code> with
                your inference logic. For XAI (Grad-CAM, LIME, SHAP), update <code className="bg-sand px-1.5 py-0.5 rounded text-xs font-mono">backend/app/services/xai_service.py</code>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default AIModel;
