import React, { useEffect, useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import toast from "react-hot-toast";

const MAX_BYTES = 10 * 1024 * 1024;
// Kept in step with ALLOWED_FORMATS in backend/app/services/storage_service.py.
// These checks are a convenience so the user gets instant feedback; the server
// re-validates by actually decoding the file, since anything here is bypassable.
const ACCEPTED_TYPES = "image/jpeg,image/png,image/tiff,image/bmp,image/webp";

const ImageUploader = ({ onFileSelect, accept = ACCEPTED_TYPES }) => {
  const [preview, setPreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  // Object URLs are not garbage collected on their own; without this the blob
  // stays in memory for the lifetime of the tab.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleFile = (file) => {
    if (!file) return;

    if (!ACCEPTED_TYPES.split(",").includes(file.type)) {
      toast.error("Upload a JPG, PNG, TIFF, BMP or WEBP image.");
      return;
    }

    if (file.size > MAX_BYTES) {
      toast.error("That image is larger than the 10MB limit.");
      return;
    }

    setPreview((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return URL.createObjectURL(file);
    });
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
    setPreview((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return null;
    });
    onFileSelect(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="w-full">
      {preview ? (
        <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-white shadow-card">
          <img src={preview} alt="Retinal scan preview" className="w-full h-64 object-contain bg-black" />
          <button
            type="button"
            onClick={clearImage}
            aria-label="Remove the selected image"
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
          <p className="mt-1 text-xs text-gray-600">JPG, PNG, TIFF, BMP or WEBP, up to 10MB</p>
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
