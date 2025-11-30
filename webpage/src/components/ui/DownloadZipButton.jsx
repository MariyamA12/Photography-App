// src/components/ui/DownloadZipButton.jsx
import React from "react";
import { HiDownload } from "react-icons/hi";

export default function DownloadZipButton({ eventId }) {
  const handleDownload = () => {
    window.location.href = `/api/admin/events/${eventId}/qrcodes/download`;
  };

  return (
    <button
      onClick={handleDownload}
      className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
    >
      <HiDownload className="inline-block mr-1" />
      Download ZIP
    </button>
  );
}
