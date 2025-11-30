// src/components/ui/NotificationFilters.jsx
import React, { useState, useEffect } from 'react';
import { fetchEvents } from '../../services/admin/eventService';
import { fetchSchools } from '../../services/admin/schoolService';

export default function NotificationFilters({ filters, setFilters }) {
  const [eventOptions, setEventOptions] = useState([]);
  const [schoolOptions, setSchoolOptions] = useState([]);

  // Load matching events for the dropdown
  useEffect(() => {
    if (!filters.eventName) {
      setEventOptions([]);
      return;
    }
    fetchEvents({ search: filters.eventName, page: 1, limit: 10 })
      .then(res => setEventOptions(res.data || []))
      .catch(() => setEventOptions([]));
  }, [filters.eventName]);

  // Load matching schools for the dropdown
  useEffect(() => {
    if (!filters.schoolName) {
      setSchoolOptions([]);
      return;
    }
    fetchSchools({ search: filters.schoolName, page: 1, limit: 10 })
      .then(res => setSchoolOptions(res.data || []))
      .catch(() => setSchoolOptions([]));
  }, [filters.schoolName]);

  const handleChange = e => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      {/* Notification Type */}
      <div>
        <label className="block text-sm font-medium">Type</label>
        <select
          name="type"
          value={filters.type}
          onChange={handleChange}
          className="mt-1 block w-full border rounded px-2 py-1"
        >
          <option value="">All</option>
          <option value="preference_request">Preference Request</option>
          <option value="photographer_assignment">Photographer Assignment</option>
        </select>
      </div>

      {/* Recipient Role */}
      <div>
        <label className="block text-sm font-medium">Recipient</label>
        <select
          name="recipientRole"
          value={filters.recipientRole}
          onChange={handleChange}
          className="mt-1 block w-full border rounded px-2 py-1"
        >
          <option value="">All</option>
          <option value="parent">Parent</option>
          <option value="photographer">Photographer</option>
        </select>
      </div>

      {/* Event Name (searchable dropdown) */}
      <div>
        <label className="block text-sm font-medium">Event</label>
        <input
          list="events-list"
          name="eventName"
          value={filters.eventName}
          onChange={handleChange}
          placeholder="Search events..."
          className="mt-1 block w-full border rounded px-2 py-1"
        />
        <datalist id="events-list">
          {(eventOptions || []).map(ev => (
            <option key={ev.id} value={ev.name} />
          ))}
        </datalist>
      </div>

      {/* School Name (searchable dropdown) */}
      <div>
        <label className="block text-sm font-medium">School</label>
        <input
          list="schools-list"
          name="schoolName"
          value={filters.schoolName}
          onChange={handleChange}
          placeholder="Search schools..."
          className="mt-1 block w-full border rounded px-2 py-1"
        />
        <datalist id="schools-list">
          {(schoolOptions || []).map(s => (
            <option key={s.id} value={s.name} />
          ))}
        </datalist>
      </div>

      {/* Date From */}
      <div>
        <label className="block text-sm font-medium">From</label>
        <input
          type="date"
          name="from"
          value={filters.from}
          onChange={handleChange}
          className="mt-1 block w-full border rounded px-2 py-1"
        />
      </div>

      {/* Date To */}
      <div>
        <label className="block text-sm font-medium">To</label>
        <input
          type="date"
          name="to"
          value={filters.to}
          onChange={handleChange}
          className="mt-1 block w-full border rounded px-2 py-1"
        />
      </div>
    </div>
);
}
