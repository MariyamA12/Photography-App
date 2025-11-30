// src/pages/Admin/Events.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  HiPlus,
  HiPencil,
  HiTrash,
  HiChevronLeft,
  HiChevronRight,
} from "react-icons/hi";
import { useToast } from "../../features/toast/useToast";
import * as eventAPI from "../../services/admin/eventService";
import { fetchSchools } from "../../services/admin/schoolService";
import { fetchUsers } from "../../services/admin/userService";
import EventModal from "../../components/ui/EventModal";
import ConfirmModal from "../../components/ui/ConfirmModal";
import Spinner from "../../components/ui/Spinner";
import { routes } from "../../constants/routes";

export default function Events() {
  const { toast } = useToast();
  const navigate = useNavigate();

  // Filters + pagination
  const [search, setSearch] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [photographerId, setPhotographerId] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  // Data + loading
  const [eventsData, setEventsData] = useState({ data: [], total: 0 });
  const [schools, setSchools] = useState([]);
  const [photographers, setPhotographers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal / confirm state
  const [modal, setModal] = useState({ type: null, data: null });
  const [confirm, setConfirm] = useState({ isOpen: false, target: null });

  // Load schools & photographers once
  useEffect(() => {
    Promise.all([
      fetchSchools({ sort: "newest" }),
      fetchUsers({ role: "photographer" }),
    ])
      .then(([sch, photRes]) => {
        setSchools(sch);
        setPhotographers(Array.isArray(photRes.data) ? photRes.data : []);
      })
      .catch((err) => toast(err.message, "error"));
  }, [toast]);

  // Fetch events
  const load = useCallback(async () => {
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
      setEventsData({ data: res.data, total: res.total });
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [search, schoolId, photographerId, eventDate, page, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.ceil(eventsData.total / limit) || 1;

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Events</h1>
        <button
          onClick={() => setModal({ type: "add", data: null })}
          className="flex items-center bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark"
        >
          <HiPlus className="mr-2" /> Add Event
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-5 gap-4 mb-4">
        <input
          type="text"
          placeholder="Search by name…"
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
            load();
          }}
          className="bg-gray-200 p-2 rounded"
        >
          Apply
        </button>
      </div>

      {/* Table or Spinner */}
      {loading ? (
        <Spinner />
      ) : (
        <>
          <table className="w-full table-auto border-collapse mb-4">
            <thead>
              <tr className="bg-gray-100">
                {["Name", "Date", "School", "Photographer", "Actions"].map(
                  (h) => (
                    <th key={h} className="p-2 border">
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {eventsData.data.map((ev) => (
                <tr key={ev.id}>
                  <td className="p-2 border">{ev.name}</td>
                  <td className="p-2 border">
                    {new Date(ev.event_date).toLocaleDateString()}
                  </td>
                  <td className="p-2 border">
                    {
                      schools.find((s) => s.id === ev.school_id)
                        ?.name || ev.school_id
                    }
                  </td>
                  <td className="p-2 border">
                    {
                      photographers.find(
                        (p) => p.id === ev.photographer_id
                      )?.name || "—"
                    }
                  </td>
                  <td className="p-2 border space-x-2">
                    <button
                      onClick={() =>
                        navigate(
                          routes.ADMIN_EVENT_DETAILS.replace(
                            ":id",
                            ev.id
                          )
                        )
                      }
                      className="text-blue-600 hover:underline"
                    >
                      View
                    </button>
                    <button
                      onClick={() =>
                        setModal({ type: "edit", data: ev })
                      }
                      className="text-green-600 hover:underline"
                    >
                      <HiPencil />
                    </button>
                    <button
                      onClick={() =>
                        setConfirm({ isOpen: true, target: ev })
                      }
                      className="text-red-600 hover:underline"
                    >
                      <HiTrash />
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
              className="p-2 border rounded disabled:opacity-50"
            >
              <HiChevronLeft />
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="p-2 border rounded disabled:opacity-50"
            >
              <HiChevronRight />
            </button>
          </div>
        </>
      )}

      {/* Modals */}
      <EventModal
        isOpen={modal.type === "add" || modal.type === "edit"}
        initial={modal.data}
        onClose={(didRefresh) => {
          setModal({ type: null, data: null });
          if (didRefresh) load();
        }}
      />
      <ConfirmModal
        isOpen={confirm.isOpen}
        message={`Delete event "${confirm.target?.name}"?`}
        onClose={() =>
          setConfirm({ isOpen: false, target: null })
        }
        onConfirm={async () => {
          try {
            await eventAPI.deleteEvent(confirm.target.id);
            toast("Event deleted", "success");
            load();
          } catch (err) {
            toast(err.message, "error");
          }
        }}
      />
    </div>
  );
}
