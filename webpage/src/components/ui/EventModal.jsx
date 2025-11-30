// src/components/ui/EventModal.jsx
import React, { useState, useEffect } from "react";
import { HiX } from "react-icons/hi";
import { useToast } from "../../features/toast/useToast";
import {
  createEvent as apiCreate,
  updateEvent as apiUpdate,
} from "../../services/admin/eventService";
import { fetchSchools } from "../../services/admin/schoolService";
import { fetchUsers } from "../../services/admin/userService";

export default function EventModal({ isOpen, onClose, initial }) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [photographerId, setPhotographerId] = useState("");
  const [schools, setSchools] = useState([]);
  const [photographers, setPhotographers] = useState([]);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load schools & photographers once
  useEffect(() => {
    if (!isOpen) return;
    setLoadingMeta(true);
    Promise.all([
      fetchSchools({ sort: "newest" }),            // returns an array
      fetchUsers({ role: "photographer" }),        // returns { data, total, ... }
    ])
      .then(([schRes, userRes]) => {
        setSchools(schRes);
        setPhotographers(Array.isArray(userRes.data) ? userRes.data : []);
      })
      .catch(err => toast(err.message, "error"))
      .finally(() => setLoadingMeta(false));
  }, [isOpen, toast]);

  // Prefill on edit
  useEffect(() => {
    if (initial) {
      setName(initial.name);
      setDescription(initial.description || "");
      setDate(initial.event_date);
      setSchoolId(initial.school_id);
      setPhotographerId(initial.photographer_id || "");
    } else {
      setName("");
      setDescription("");
      setDate("");
      setSchoolId("");
      setPhotographerId("");
    }
  }, [initial, isOpen]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        name,
        description,
        event_date: date,
        school_id: schoolId,
        photographer_id: photographerId || null,
      };
      if (initial) {
        await apiUpdate(initial.id, payload);
        toast("Event updated", "success");
      } else {
        await apiCreate(payload);
        toast("Event created", "success");
      }
      onClose(true);
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex z-50">
      <div
        className="absolute inset-0 bg-black opacity-40"
        onClick={() => onClose(false)}
      />
      <div className="relative ml-auto w-1/3 bg-white h-full shadow-lg p-6 flex flex-col">
        <button
          onClick={() => onClose(false)}
          className="self-end text-gray-500"
        >
          <HiX className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-semibold mb-4">
          {initial ? "Edit Event" : "Create Event"}
        </h2>

        <label className="mt-2">Name</label>
        <input
          className="border p-2 rounded mb-3"
          value={name}
          onChange={e => setName(e.target.value)}
        />

        <label>Description</label>
        <textarea
          className="border p-2 rounded mb-3"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />

        <label>Date</label>
        <input
          type="date"
          className="border p-2 rounded mb-3"
          value={date}
          onChange={e => setDate(e.target.value)}
        />

        <label>School</label>
        <select
          className="border p-2 rounded mb-3"
          disabled={loadingMeta}
          value={schoolId}
          onChange={e => setSchoolId(e.target.value)}
        >
          <option value="">Select school</option>
          {schools.map(s => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <label>Photographer</label>
        <select
          className="border p-2 rounded mb-6"
          disabled={loadingMeta}
          value={photographerId}
          onChange={e => setPhotographerId(e.target.value)}
        >
          <option value="">None</option>
          {photographers.map(p => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-auto bg-primary text-white py-2 rounded hover:bg-primary-dark disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
