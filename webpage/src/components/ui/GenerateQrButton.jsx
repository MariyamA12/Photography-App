// src/components/ui/GenerateQrButton.jsx
import React, { useState } from "react";
import { useToast } from "../../features/toast/useToast";
import { generateQrCodes } from "../../services/admin/qrCodeService";

export default function GenerateQrButton({ eventId, onSuccess }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await generateQrCodes(eventId);
      toast("QR codes generated", "success");
      if (onSuccess) onSuccess();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="px-3 py-1 bg-primary text-white rounded disabled:opacity-50"
    >
      {loading ? "Generating…" : "Generate QR"}
    </button>
  );
}
