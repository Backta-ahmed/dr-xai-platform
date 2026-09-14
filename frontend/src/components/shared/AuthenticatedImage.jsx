import React, { useEffect, useState } from "react";
import { ImageOff } from "lucide-react";
import api from "../../api/axios";

/**
 * Renders an image from an endpoint that requires the bearer token.
 *
 * A plain <img src="/api/v1/images/123"> cannot work here: the browser issues
 * that request without the Authorization header, so the API returns 401. The
 * image is therefore fetched with axios (which attaches the token), turned
 * into an object URL, and revoked on unmount — the revoke also fixes the
 * object-URL leak the old download and preview code had.
 */
const AuthenticatedImage = ({ path, alt, className = "" }) => {
  const [objectUrl, setObjectUrl] = useState(null);
  const [state, setState] = useState("loading");

  useEffect(() => {
    let cancelled = false;
    let createdUrl = null;

    const load = async () => {
      setState("loading");
      try {
        const response = await api.get(path, { responseType: "blob" });
        if (cancelled) return;
        createdUrl = URL.createObjectURL(response.data);
        setObjectUrl(createdUrl);
        setState("ready");
      } catch {
        if (!cancelled) setState("error");
      }
    };

    load();

    return () => {
      cancelled = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [path]);

  if (state === "loading") {
    return (
      <div className={`flex items-center justify-center bg-gray-900 ${className}`}>
        <div
          role="status"
          aria-label="Loading image"
          className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-white/70"
        />
      </div>
    );
  }

  if (state === "error") {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 bg-gray-100 text-gray-600 ${className}`}
      >
        <ImageOff size={26} aria-hidden="true" />
        <span className="text-xs">Image unavailable</span>
      </div>
    );
  }

  return <img src={objectUrl} alt={alt} className={className} />;
};

export default AuthenticatedImage;
