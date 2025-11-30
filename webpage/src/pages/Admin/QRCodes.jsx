// src/pages/Admin/QRCodes.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineQrcode } from 'react-icons/hi';
import { useToast } from '../../features/toast/useToast';
import * as eventAPI from '../../services/admin/eventService';
import {
  generateQrCodes,
  downloadQrCodesZip,
} from '../../services/admin/qrCodeService';
import { fetchSchools } from '../../services/admin/schoolService';
import { fetchUsers } from '../../services/admin/userService';
import Spinner from '../../components/ui/Spinner';

export default function QRCodes() {
  const { toast } = useToast();
  const navigate = useNavigate();

  // Filters & pagination
  const [search, setSearch] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [photographerId, setPhotographerId] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Data
  const [events, setEvents] = useState({ data: [], total: 0 });
  const [schools, setSchools] = useState([]);
  const [photographers, setPhotographers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Action loading states
  const [generatingId, setGeneratingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  // Load schools & photographers
  useEffect(() => {
    Promise.all([
      fetchSchools({ sort: 'newest' }),
      fetchUsers({ role: 'photographer' }),
    ])
      .then(([sch, photRes]) => {
        setSchools(sch);
        setPhotographers(photRes.data);
      })
      .catch((err) => toast(err.message, 'error'));
  }, [toast]);

  // Fetch events
  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await eventAPI.fetchEvents({
        search,
        school_id: schoolId,
        photographer_id: photographerId,
        event_date: eventDate,
        page,
        limit,
      });
      setEvents({ data: res.data, total: res.total });
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [search, schoolId, photographerId, eventDate, page, toast]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const totalPages = Math.max(1, Math.ceil(events.total / limit));

  // Generate QR codes
  const handleGenerate = async (id) => {
    setGeneratingId(id);
    try {
      await generateQrCodes(id);
      toast('QR codes generated successfully', 'success');
      await loadEvents();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setGeneratingId(null);
    }
  };

  // Download ZIP
  const handleDownload = async (id) => {
    setDownloadingId(id);
    try {
      const response = await downloadQrCodesZip(id);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `event-${id}-qrcodes.zip`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="p-4">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">QR Codes by Event</h1>
      </header>

      {/* Filters */}
      <div className="grid grid-cols-5 gap-4 mb-4">
        <input
          type="text"
          placeholder="Search events…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-2 rounded"
        />
        <select
          value={schoolId}
          onChange={(e) => setSchoolId(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">All schools</option>
          {schools.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          value={photographerId}
          onChange={(e) => setPhotographerId(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">All photographers</option>
          {photographers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          className="border p-2 rounded"
        />
        <button
          onClick={() => {
            setPage(1);
            loadEvents();
          }}
          className="bg-gray-200 p-2 rounded"
        >
          Apply
        </button>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <>
          {/* Events table */}
          <table className="w-full table-auto border-collapse mb-4">
            <thead>
              <tr className="bg-gray-100">
                {['Name', 'Date', 'School', 'Photographer', 'Actions'].map((h) => (
                  <th key={h} className="p-2 border text-left">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {events.data.map((ev) => (
                <tr key={ev.id}>
                  <td className="p-2 border">{ev.name}</td>
                  <td className="p-2 border">
                    {new Date(ev.event_date).toLocaleDateString()}
                  </td>
                  <td className="p-2 border">
                    {schools.find((s) => s.id === ev.school_id)?.name || '—'}
                  </td>
                  <td className="p-2 border">
                    {photographers.find((p) => p.id === ev.photographer_id)?.name || '—'}
                  </td>
                  <td className="p-2 border space-x-2">
                    <button
                      onClick={() => handleGenerate(ev.id)}
                      disabled={generatingId === ev.id}
                      className={`px-3 py-1 rounded text-white ${
                        generatingId === ev.id
                          ? 'bg-gray-300 cursor-not-allowed'
                          : 'bg-primary hover:bg-primary-dark'
                      }`}
                    >
                      {generatingId === ev.id ? 'Generating' : 'Generate'}
                    </button>
                    <button
                      onClick={() => navigate(`/admin/qr-codes/${ev.id}`)}
                      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      <HiOutlineQrcode className="inline-block mr-1" />
                      Details
                    </button>
                    <button
                      onClick={() => handleDownload(ev.id)}
                      disabled={downloadingId === ev.id}
                      className={`px-3 py-1 rounded text-white ${
                        downloadingId === ev.id
                          ? 'bg-gray-300 cursor-not-allowed'
                          : 'bg-green-500 hover:bg-green-600'
                      }`}
                    >
                      {downloadingId === ev.id ? 'Downloading' : 'Download ZIP'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex justify-center items-center space-x-4">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
