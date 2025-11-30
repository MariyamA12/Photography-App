// src/pages/Admin/PhotoDetails.jsx

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { HiChevronLeft, HiChevronRight, HiTrash, HiUpload, HiX } from "react-icons/hi";
import { useToast } from "../../features/toast/useToast";
import { fetchAttendance } from "../../services/admin/attendanceService";
import * as photoAPI from "../../services/admin/photoService";
import * as eventAPI from "../../services/admin/eventService";
import Spinner from "../../components/ui/Spinner";
import ConfirmModal from "../../components/ui/ConfirmModal";
import { routes } from "../../constants/routes";

export default function PhotoDetails() {
  const { eventId } = useParams();
  const { toast } = useToast();

  // filters & pagination
  const [eventName, setEventName]       = useState("");
  const [studentName, setStudentName]   = useState("");
  const [photoType, setPhotoType]       = useState("");
  const [uploadedOnly, setUploadedOnly] = useState("all");
  const [page, setPage]                 = useState(1);
  const limit = 10;

  // data states
  const [sessions, setSessions] = useState({ data: [], total: 0 });
  const [photos, setPhotos]     = useState([]);
  const [loading, setLoading]   = useState(false);

  // bulk upload states
  const [bulkUploading, setBulkUploading] = useState(false);
  const fileInputRef = useRef(null);

  // delete states
  const [photoToDelete, setPhotoToDelete]       = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  // preview
  const [modalUrl, setModalUrl] = useState("");

  // fetch event name
  useEffect(() => {
    eventAPI
      .fetchEventById(eventId)
      .then(ev => setEventName(ev.name))
      .catch(err => toast(err.message, "error"));
  }, [eventId, toast]);

  // load photos & sessions
  const loadPhotos = useCallback(async () => {
    try {
      const res = await photoAPI.fetchPhotosList({
        event_id: eventId,
        limit: Number.MAX_SAFE_INTEGER,
      });
      setPhotos(res.data);
    } catch (err) {
      toast(err.message, "error");
    }
  }, [eventId, toast]);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAttendance({
        event_id: eventId,
        student_name: studentName,
        photo_type: photoType,
        page,
        limit,
      });
      setSessions(res);
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [eventId, studentName, photoType, page, toast]);

  useEffect(() => {
    loadPhotos();
    loadSessions();
  }, [loadPhotos, loadSessions]);

  const totalPages = Math.ceil(sessions.total / limit) || 1;
  const getUploaded = id => photos.find(p => p.photo_session_id === id);

  // bulk upload handler (logic only change: display per-file errors if any)
  const handleBulkUpload = async e => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setBulkUploading(true);
    try {
      const { newCount, duplicateCount, details } = await photoAPI.uploadBulkPhotos({
        eventId: Number(eventId),
        files
        // sessionId: undefined  // (optional; supported in service if you add UI later)
      });

      toast(
        `Uploaded ${newCount} new photo${newCount !== 1 ? "s" : ""}, ` +
        `skipped ${duplicateCount} duplicate${duplicateCount !== 1 ? "s" : ""}.`,
        "success"
      );

      // NEW: surface any per-file errors returned by backend (no UI change)
      const failed = Array.isArray(details) ? details.filter(d => d && d.error) : [];
      if (failed.length) {
        const firstFew = failed.slice(0, 5)
          .map(f => `${f.fileName || "(unknown)"}: ${f.error}`)
          .join("\n");
        toast(
          `Some files failed:\n${firstFew}${failed.length > 5 ? `\n...and ${failed.length - 5} more` : ""}`,
          "error"
        );
      }

      await loadPhotos();
      await loadSessions();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setBulkUploading(false);
      e.target.value = null;
    }
  };

  // delete flow
  const confirmDelete = async () => {
    if (!photoToDelete) return;
    try {
      await photoAPI.deletePhoto(photoToDelete);
      toast("Deleted", "success");
      await loadPhotos();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setPhotoToDelete(null);
      setConfirmModalOpen(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Link to={routes.ADMIN_PHOTOS} className="text-gray-600 hover:underline flex items-center">
          <HiChevronLeft className="mr-1" /> Back to Events
        </Link>
        <h1 className="text-2xl font-bold">Photos for {eventName}</h1>
        <button
          onClick={() => fileInputRef.current.click()}
          disabled={bulkUploading}
          className="bg-primary text-white px-4 py-2 rounded hover:opacity-90 disabled:opacity-50"
        >
          {bulkUploading ? "Uploading…" : "Upload Bulk"}
        </button>
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          ref={fileInputRef}
          onChange={handleBulkUpload}
        />
      </div>

      {/* Filters */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <input
          placeholder="Student name…"
          className="border p-2 rounded"
          value={studentName}
          onChange={e => setStudentName(e.target.value)}
        />
        <select
          className="border p-2 rounded"
          value={photoType}
          onChange={e => setPhotoType(e.target.value)}
        >
          <option value="">All types</option>
          <option value="individual">Individual</option>
          <option value="with_sibling">Sibling</option>
          <option value="with_friend">Friend</option>
          <option value="group">Group</option>
        </select>
        <select
          className="border p-2 rounded"
          value={uploadedOnly}
          onChange={e => setUploadedOnly(e.target.value)}
        >
          <option value="all">All</option>
          <option value="yes">Uploaded</option>
          <option value="no">Pending</option>
        </select>
        <button
          className="bg-gray-200 p-2 rounded"
          onClick={() => { setPage(1); loadSessions(); }}
        >
          Apply
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <Spinner />
      ) : (
        <>
          <table className="w-full table-auto border-collapse mb-4">
            <thead>
              <tr className="bg-gray-100">
                {["Session ID", "Students", "Type", "Timestamp", "Status", "Actions"].map(h => (
                  <th key={h} className="p-2 border">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sessions.data
                .filter(s => {
                  const up = !!getUploaded(s.photo_session_id);
                  return (
                    uploadedOnly === "all" ||
                    (uploadedOnly === "yes" && up) ||
                    (uploadedOnly === "no" && !up)
                  );
                })
                .map(s => {
                  const up = getUploaded(s.photo_session_id);
                  return (
                    <tr key={s.photo_session_id}>
                      <td className="p-2 border">{s.photo_session_id}</td>
                      <td className="p-2 border">{s.student_names.join(", ")}</td>
                      <td className="p-2 border">{s.photo_type}</td>
                      <td className="p-2 border">{new Date(s.marked_at).toLocaleString()}</td>
                      <td className="p-2 border">{up ? "✅" : "⌛"}</td>
                      <td className="p-2 border space-x-2">
                        {up && (
                          <>
                            <button
                              onClick={() => setModalUrl(up.file_url)}
                              className="text-blue-600 hover:underline"
                            >
                              View
                            </button>
                            <button
                              onClick={() => {
                                setPhotoToDelete(up.id);
                                setConfirmModalOpen(true);
                              }}
                              className="text-red-600 hover:underline"
                            >
                              <HiTrash />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex justify-center items-center space-x-4">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="p-2 border rounded disabled:opacity-50"
            >
              <HiChevronLeft />
            </button>
            <span>Page {page} of {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="p-2 border rounded disabled:opacity-50"
            >
              <HiChevronRight />
            </button>
          </div>
        </>
      )}

      {/* Image preview */}
      {modalUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <button
            onClick={() => setModalUrl("")}
            className="absolute top-4 right-4 text-white text-2xl"
          >
            <HiX />
          </button>
          <img src={modalUrl} alt="Preview" className="max-h-full max-w-full rounded" />
        </div>
      )}

      {/* Delete confirmation */}
      <ConfirmModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={confirmDelete}
        message="Delete this photo?"
      />
    </div>
  );
}
