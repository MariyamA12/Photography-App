// src/pages/Admin/EventDetails.jsx
import React, { useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  HiPencil,
  HiTrash,
  HiBell,
  HiPhotograph,
  HiUsers,
} from "react-icons/hi";
import { useToast } from "../../features/toast/useToast";
import * as eventAPI from "../../services/admin/eventService";
import { fetchSchools } from "../../services/admin/schoolService";
import { fetchUsers } from "../../services/admin/userService";
import EventModal from "../../components/ui/EventModal";
import ConfirmModal from "../../components/ui/ConfirmModal";
import ParticipantsModal from "../../components/ui/ParticipantsModal";
import Spinner from "../../components/ui/Spinner";
import { routes } from "../../constants/routes";

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [event, setEvent] = useState(null);
  const [school, setSchool] = useState(null);
  const [photographer, setPhotographer] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [participantsOpen, setParticipantsOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [notifyLoading, setNotifyLoading] = useState({
    photographer: false,
    parents: false,
  });

  // countdown
  const [countdownMs, setCountdownMs] = useState(0);
  const countdownRef = useRef();

  // load event & meta
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const ev = await eventAPI.fetchEventById(id);
        setEvent(ev);
        setCountdownMs(ev.timeUntilJobMs);

        const [schs, userResp] = await Promise.all([
          fetchSchools({}),
          fetchUsers({ role: "photographer" }),
        ]);
        // fetchSchools returns an array
        setSchool(schs.find((s) => s.id === ev.school_id) || null);
        // fetchUsers now returns { data, total, ... }
        const photographersList = Array.isArray(userResp.data)
          ? userResp.data
          : [];
        setPhotographer(
          photographersList.find((p) => p.id === ev.photographer_id) ||
            null
        );
      } catch (err) {
        toast(err.message, "error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, toast]);

  // start countdown interval
  useEffect(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setCountdownMs((ms) => Math.max(ms - 1000, 0));
    }, 1000);
    return () => clearInterval(countdownRef.current);
  }, [event]);

  if (loading || !event) return <Spinner />;

  const formatCountdown = (ms) => {
    const totalSec = Math.floor(ms / 1000);
    const days = Math.floor(totalSec / 86400);
    const hours = Math.floor((totalSec % 86400) / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${days}d ${hours}h ${mins}m ${secs}s`;
  };

  const handleNotifyPhotographer = async () => {
    setNotifyLoading((l) => ({ ...l, photographer: true }));
    try {
      const { event: updated } = await eventAPI.notifyPhotographer(id);
      setEvent(updated);
      toast("Photographer alerted", "success");
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setNotifyLoading((l) => ({ ...l, photographer: false }));
    }
  };

  const handleNotifyParents = async () => {
    setNotifyLoading((l) => ({ ...l, parents: true }));
    try {
      const { event: updated } = await eventAPI.notifyParents(id);
      setEvent(updated);
      toast("Parents alerted", "success");
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setNotifyLoading((l) => ({ ...l, parents: false }));
    }
  };

  return (
    <div>
      <Link
        to={routes.ADMIN_EVENTS}
        className="text-blue-600 hover:underline mb-4 inline-block"
      >
        ← Back to Events
      </Link>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{event.name}</h1>
        <div className="space-x-2">
          <button
            onClick={() => setParticipantsOpen(true)}
            className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
          >
            <HiUsers className="inline mr-1" />
            View Participants
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            <HiPencil className="inline mr-1" /> Edit
          </button>
          <button
            onClick={() => setConfirmDel(true)}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            <HiTrash className="inline mr-1" /> Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div>
          <p>
            <strong>Date:</strong>{" "}
            {new Date(event.event_date).toLocaleDateString()}
          </p>
          <p>
            <strong>School:</strong> {school?.name || event.school_id}
          </p>
          <p>
            <strong>Photographer:</strong> {photographer?.name || "—"}
          </p>
          <p className="mt-2">
            <strong>Auto‐alert in:</strong> {formatCountdown(countdownMs)}
          </p>
        </div>
        <div>
          <p>
            <strong>Description:</strong>
          </p>
          <p className="whitespace-pre-wrap">{event.description || "—"}</p>
        </div>
      </div>

      <div className="space-x-4 mb-8">
        <button
          onClick={handleNotifyPhotographer}
          disabled={event.photographerButtonSent || notifyLoading.photographer}
          className={`px-4 py-2 rounded ${
            !event.photographerButtonSent
              ? "bg-blue-500 text-white hover:bg-blue-600"
              : "bg-gray-300 text-gray-700 cursor-default"
          }`}
        >
          {notifyLoading.photographer
            ? "Sending…"
            : event.photographerButtonSent
            ? `Sent at ${new Date(
                event.photographerButtonSentAt
              ).toLocaleString()}`
            : (
                <>
                  <HiPhotograph className="inline mr-1" />
                  Send Alert to Photographer
                </>
              )}
        </button>

        <button
          onClick={handleNotifyParents}
          disabled={event.parentsButtonSent || notifyLoading.parents}
          className={`px-4 py-2 rounded ${
            !event.parentsButtonSent
              ? "bg-indigo-500 text-white hover:bg-indigo-600"
              : "bg-gray-300 text-gray-700 cursor-default"
          }`}
        >
          {notifyLoading.parents
            ? "Sending…"
            : event.parentsButtonSent
            ? `Sent at ${new Date(
                event.parentsButtonSentAt
              ).toLocaleString()}`
            : (
                <>
                  <HiBell className="inline mr-1" />
                  Notify Parents
                </>
              )}
        </button>
      </div>

      <ParticipantsModal
        isOpen={participantsOpen}
        eventId={id}
        onClose={() => setParticipantsOpen(false)}
      />

      <EventModal
        isOpen={modalOpen}
        initial={event}
        onClose={(didRefresh) => {
          setModalOpen(false);
          if (didRefresh) {
            navigate(routes.ADMIN_EVENT_DETAILS.replace(":id", id), {
              replace: true,
            });
          }
        }}
      />

      <ConfirmModal
        isOpen={confirmDel}
        message={`Delete event "${event.name}"?`}
        onClose={() => setConfirmDel(false)}
        onConfirm={async () => {
          try {
            await eventAPI.deleteEvent(id);
            toast("Event deleted", "success");
            navigate(routes.ADMIN_EVENTS);
          } catch (err) {
            toast(err.message, "error");
          }
        }}
      />
    </div>
  );
}
