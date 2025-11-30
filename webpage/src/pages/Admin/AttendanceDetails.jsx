// src/pages/Admin/AttendanceDetails.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { HiChevronLeft, HiChevronRight, HiDownload } from "react-icons/hi";
import { useToast } from "../../features/toast/useToast";
import * as attendanceAPI from "../../services/admin/attendanceService";
import * as eventAPI from "../../services/admin/eventService";
import Spinner from "../../components/ui/Spinner";
import { routes } from "../../constants/routes";

export default function AttendanceDetails() {
  const { toast } = useToast();
  const { eventId } = useParams();

  // full event name
  const [eventName, setEventName] = useState("");

  // filters state
  const [filters, setFilters] = useState({
    student_name: "",
    class_name: "",
    photo_type: "",
    presence: "",
    is_random: "",
    date_from: "",
    date_to: "",
  });

  // pagination
  const [page, setPage] = useState(1);
  const limit = 10;

  // fetched records
  const [records, setRecords] = useState({ data: [], total: 0 });
  const [loading, setLoading] = useState(false);

  // load event name on mount
  useEffect(() => {
    eventAPI
      .fetchEventById(eventId)
      .then(ev => setEventName(ev.name))
      .catch(err => toast(err.message, "error"));
  }, [eventId, toast]);

  // fetch attendance with filters + pagination
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await attendanceAPI.fetchAttendance({
        event_id: eventId,
        page,
        limit,
        ...filters,
      });
      setRecords(res);
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [eventId, filters, page, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.ceil(records.total / limit) || 1;
  const onChange = e =>
    setFilters(f => ({ ...f, [e.target.name]: e.target.value }));

  return (
    <div>
      <Link
        to={routes.ADMIN_ATTENDANCE}
        className="text-blue-600 hover:underline mb-4 inline-block"
      >
        ← Back to Attendance Overview
      </Link>

      <h1 className="text-2xl font-bold mb-4">
        {eventName
          ? `${eventName} Attendance`
          : `Event #${eventId} Attendance`}
      </h1>

      {/* Filters */}
      <div className="grid grid-cols-7 gap-4 mb-4">
        <input
          name="student_name"
          value={filters.student_name}
          onChange={onChange}
          placeholder="Student name…"
          className="border p-2 rounded"
        />
        <input
          name="class_name"
          value={filters.class_name}
          onChange={onChange}
          placeholder="Class…"
          className="border p-2 rounded"
        />
        <select
          name="photo_type"
          value={filters.photo_type}
          onChange={onChange}
          className="border p-2 rounded"
        >
          <option value="">All types</option>
          <option value="individual">Individual</option>
          <option value="with_sibling">With sibling</option>
          <option value="with_friend">With friend</option>
          <option value="group">Group</option>
        </select>
        <select
          name="presence"
          value={filters.presence}
          onChange={onChange}
          className="border p-2 rounded"
        >
          <option value="">Status</option>
          <option value="present">Present</option>
          <option value="absent">Absent</option>
        </select>
        <select
          name="is_random"
          value={filters.is_random}
          onChange={onChange}
          className="border p-2 rounded"
        >
          <option value="">Photo source</option>
          <option value="true">Random</option>
          <option value="false">QR</option>
        </select>
        <input
          type="date"
          name="date_from"
          value={filters.date_from}
          onChange={onChange}
          className="border p-2 rounded"
        />
        <input
          type="date"
          name="date_to"
          value={filters.date_to}
          onChange={onChange}
          className="border p-2 rounded"
        />
      </div>

      {/* Export + Apply */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() =>
            attendanceAPI.exportAttendance({
              event_id: eventId,
              ...filters,
            })
          }
          className="flex items-center bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark"
        >
          <HiDownload className="mr-2" /> Export CSV
        </button>
        <button
          onClick={() => {
            setPage(1);
            load();
          }}
          className="bg-gray-200 px-4 py-2 rounded"
        >
          Apply Filters
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <Spinner />
      ) : !loading && records.data.length === 0 ? (
        <div className="text-center py-8 text-gray-600">
          No records found.
        </div>
      ) : (
        <>
          <table className="w-full table-auto border-collapse mb-4">
            <thead>
              <tr className="bg-gray-100">
                {[
                  "Student",
                  "Class",
                  "Status",
                  "Photo Type",
                  "Photo Name",
                  "Marked At",
                  "QRCode?",
                ].map(h => (
                  <th key={h} className="p-2 border">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.data.map(r => (
                <tr key={r.attendance_id}>
                  <td className="p-2 border">
                    {Array.isArray(r.student_names)
                      ? r.student_names.join(", ")
                      : r.student_name}
                  </td>
                  <td className="p-2 border">
                    {Array.isArray(r.class_names)
                      ? r.class_names.join(", ")
                      : r.class_name}
                  </td>
                  <td className="p-2 border">{r.status}</td>
                  <td className="p-2 border">{r.photo_type}</td>
                  <td className="p-2 border">{r.photo_name}</td>
                  <td className="p-2 border">
                    {new Date(r.marked_at).toLocaleString()}
                  </td>
                  <td className="p-2 border">
                    {r.qrcode_id ? "QR" : "Random"}
                  </td>
                </tr>
              ))}
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
            <span>
              Page {page} of {totalPages}
            </span>
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
