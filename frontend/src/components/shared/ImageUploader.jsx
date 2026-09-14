import React, { useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import toast from "react-hot-toast";

const ImageUploader = ({ onFileSelect, accept = "image/jpeg,image/png" }) => {
  const [preview, setPreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    
    // Check MIME type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (JPG, PNG)");
      return;
    }
    
    // Check file size
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size exceeds 10MB limit");
      return;
    }
    setPreview(URL.createObjectURL(file));
    onFileSelect(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const clearImage = () => {
    setPreview(null);
    onFileSelect(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="w-full">
      {preview ? (
        <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-white shadow-card">
          <img src={preview} alt="Retinal scan preview" className="w-full h-64 object-contain bg-black" />
          <button
            onClick={clearImage}
            className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-red-50 transition-colors"
          >
            <X size={18} className="text-danger" />
          </button>
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
            dragActive ? "border-accent bg-accent/5" : "border-cyprus/30 hover:border-accent"
          }`}
          onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="mx-auto h-12 w-12 text-cyprus/40" />
          <p className="mt-3 text-sm text-gray-600">
            <span className="font-medium text-cyprus">Click to upload</span> or drag and drop
          </p>
          <p className="mt-1 text-xs text-gray-400">JPG, PNG up to 10MB</p>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleChange}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
