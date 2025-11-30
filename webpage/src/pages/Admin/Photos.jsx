// src/pages/Admin/Photos.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi";
import { useToast } from "../../features/toast/useToast";
import * as eventAPI from "../../services/admin/eventService";
import { fetchSchools } from "../../services/admin/schoolService";
import { fetchUsers }   from "../../services/admin/userService";
import Spinner from "../../components/ui/Spinner";
import { routes } from "../../constants/routes";

export default function Photos() {
  const { toast } = useToast();
  const navigate = useNavigate();

  // filters & pagination
  const [search, setSearch] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [photographerId, setPhotographerId] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  // data
  const [events, setEvents] = useState({ data: [], total: 0 });
  const [schools, setSchools] = useState([]);
  const [photographers, setPhotographers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetchSchools({ sort: "newest" }),
      fetchUsers({ role: "photographer" }),
    ])
      .then(([sch, ph]) => {
        setSchools(sch);
        setPhotographers(ph.data || []);
      })
      .catch(err => toast(err.message, "error"));
  }, [toast]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await eventAPI.fetchEvents({
        search,
        school_id: schoolId,
        photographer_id: photographerId,
        page,
        limit,
      });
      setEvents(res);
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [search, schoolId, photographerId, page, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.ceil(events.total / limit) || 1;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Photos</h1>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <input
          placeholder="Event name…"
          className="border p-2 rounded"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="border p-2 rounded"
          value={schoolId}
          onChange={e => setSchoolId(e.target.value)}
        >
          <option value="">All schools</option>
          {schools.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <select
          className="border p-2 rounded"
          value={photographerId}
          onChange={e => setPhotographerId(e.target.value)}
        >
          <option value="">All photographers</option>
          {photographers.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <button
          className="bg-gray-200 p-2 rounded"
          onClick={() => { setPage(1); load(); }}
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
                {["Name","Date","School","Photographer","Photos"].map(h => (
                  <th key={h} className="p-2 border">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {events.data.map(ev => (
                <tr key={ev.id}>
                  <td className="p-2 border">{ev.name}</td>
                  <td className="p-2 border">
                    {new Date(ev.event_date).toLocaleDateString()}
                  </td>
                  <td className="p-2 border">
                    {schools.find(s=>s.id===ev.school_id)?.name || "—"}
                  </td>
                  <td className="p-2 border">
                    {photographers.find(p=>p.id===ev.photographer_id)?.name||"—"}
                  </td>
                  <td className="p-2 border">
                    <button
                      onClick={()=>navigate(
                        routes.ADMIN_PHOTOS_DETAILS.replace(":eventId", ev.id)
                      )}
                      className="text-blue-600 hover:underline"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex justify-center items-center space-x-4">
            <button
              disabled={page<=1}
              onClick={()=>setPage(p=>p-1)}
              className="p-2 border rounded disabled:opacity-50"
            ><HiChevronLeft/></button>
            <span>Page {page} of {totalPages}</span>
            <button
              disabled={page>=totalPages}
              onClick={()=>setPage(p=>p+1)}
              className="p-2 border rounded disabled:opacity-50"
            ><HiChevronRight/></button>
          </div>
        </>
      )}
    </div>
  );
}
