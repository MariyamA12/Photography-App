// src/pages/Admin/QrCodeDetails.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi';
import { useToast } from '../../features/toast/useToast';
import { fetchQrCodes } from '../../services/admin/qrCodeService';
import { fetchEventById } from '../../services/admin/eventService';
import Spinner from '../../components/ui/Spinner';

export default function QrCodeDetails() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Event name
  const [eventName, setEventName] = useState('');

  const loadEvent = useCallback(async () => {
    try {
      const ev = await fetchEventById(eventId);
      setEventName(ev.name);
    } catch (err) {
      toast(err.message, 'error');
    }
  }, [eventId, toast]);

  // Filters & pagination
  const [studentName, setStudentName] = useState('');
  const [photoType, setPhotoType] = useState('');
  const [isScanned, setIsScanned] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  // Data & loading
  const [qrCodes, setQrCodes] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // Load QR codes
  const loadQRCodes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchQrCodes(eventId, {
        studentName,
        photoType,
        isScanned,
        page,
        limit,
      });
      setQrCodes(res.data);
      setTotal(res.total);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [eventId, studentName, photoType, isScanned, page, toast]);

  useEffect(() => {
    loadEvent();
    loadQRCodes();
  }, [loadEvent, loadQRCodes]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="p-4">
      <header className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/admin/qr-codes')}
          className="text-blue-500 hover:underline flex items-center"
        >
          <HiChevronLeft className="mr-1" /> Back to list
        </button>
        <h1 className="text-2xl font-bold">
          QR Codes for “{eventName || '…'}”
        </h1>
        {/* spacer */}
        <div style={{ width: '1rem' }} />
      </header>

      {/* Filters */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <input
          type="text"
          placeholder="Student name…"
          value={studentName}
          onChange={e => setStudentName(e.target.value)}
          className="border p-2 rounded"
        />
        <select
          value={photoType}
          onChange={e => setPhotoType(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">All types</option>
          {['individual', 'with_sibling', 'with_friend', 'group'].map(t => (
            <option key={t} value={t}>
              {t.replace('_', ' ')}
            </option>
          ))}
        </select>
        <select
          value={isScanned}
          onChange={e => setIsScanned(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">All</option>
          <option value="true">Scanned</option>
          <option value="false">Not scanned</option>
        </select>
        <button
          onClick={() => { setPage(1); loadQRCodes(); }}
          className="bg-gray-200 p-2 rounded"
        >
          Apply
        </button>
      </div>

      {/* Table or spinner */}
      {loading ? (
        <Spinner />
      ) : (
        <>
          {qrCodes.length > 0 ? (
            <table className="w-full table-auto border-collapse mb-4">
              <thead>
                <tr className="bg-gray-100">
                  {['QR Image', 'Type', 'Students', 'Scanned', 'Scanned At'].map(h => (
                    <th key={h} className="p-2 border text-left">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {qrCodes.map(qr => (
                  <tr key={qr.id}>
                    <td className="p-2 border">
                      <img
                        src={qr.image_url}
                        alt="QR code"
                        className="w-16 h-16"
                      />
                    </td>
                    <td className="p-2 border">
                      {qr.photo_type.replace('_', ' ')}
                    </td>
                    <td className="p-2 border">
                      {qr.students.map(s => s.name).join(', ')}
                    </td>
                    <td className="p-2 border">
                      {qr.is_scanned ? 'Yes' : 'No'}
                    </td>
                    <td className="p-2 border">
                      {qr.scanned_at
                        ? new Date(qr.scanned_at).toLocaleString()
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-center text-gray-600">
              {total > 0
                ? 'No records match your filters.'
                : 'No QR codes found.'}
            </p>
          )}

          {/* Pagination */}
          <div className="flex justify-center items-center space-x-4 mt-4">
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
    </div>
  );
}
