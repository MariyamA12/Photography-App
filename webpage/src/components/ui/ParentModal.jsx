// src/components/ui/ParentModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  HiX,
  HiSearch,
  HiChevronLeft,
  HiChevronRight,
  HiChevronDown,
  HiCheckCircle,
} from "react-icons/hi";
import { useToast } from "../../features/toast/useToast";
import { fetchUsers } from "../../services/admin/userService";
import { fetchSchools } from "../../services/admin/schoolService";
import { fetchStudents } from "../../services/admin/studentService";
import { createParentStudentLink } from "../../services/admin/parentStudentService";

// Page sizes
const PAGE_SIZE_PARENTS = 8;
const PAGE_SIZE_SCHOOLS = 8;
const PAGE_SIZE_STUDENTS = 10;

// Small debounce hook
function useDebouncedValue(value, delay = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function ParentModal({ isOpen, onClose }) {
  const { toast } = useToast();

  // Data
  const [parents, setParents] = useState([]);
  const [schools, setSchools] = useState([]);
  const [students, setStudents] = useState([]);

  // Selections
  const [selectedParent, setSelectedParent] = useState("");
  const [selectedSchool, setSelectedSchool] = useState("");

  // Mappings: [{ student_id, relationship_type }]
  const [mappings, setMappings] = useState([]);

  // Loading
  const [loading, setLoading] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Search
  const [parentSearch, setParentSearch] = useState("");
  const [schoolSearch, setSchoolSearch] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const dParentSearch = useDebouncedValue(parentSearch);
  const dSchoolSearch = useDebouncedValue(schoolSearch);
  const dStudentSearch = useDebouncedValue(studentSearch);

  // Pagination
  const [parentPage, setParentPage] = useState(1);
  const [schoolPage, setSchoolPage] = useState(1);
  const [studentPage, setStudentPage] = useState(1);

  useEffect(() => setParentPage(1), [dParentSearch]);
  useEffect(() => setSchoolPage(1), [dSchoolSearch]);
  useEffect(() => setStudentPage(1), [dStudentSearch]);

  // Steps (accordion)
  const STEP_PARENT = 1;
  const STEP_SCHOOL = 2;
  const STEP_STUDENTS = 3;
  const [currentStep, setCurrentStep] = useState(STEP_PARENT);
  const [openStep, setOpenStep] = useState(STEP_PARENT);

  // Reset all local state to pristine
  const resetAll = () => {
    setParents([]);
    setSchools([]);
    setStudents([]);
    setSelectedParent("");
    setSelectedSchool("");
    setMappings([]);
    setLoading(false);
    setLoadingStudents(false);
    setParentSearch("");
    setSchoolSearch("");
    setStudentSearch("");
    setParentPage(1);
    setSchoolPage(1);
    setStudentPage(1);
    setCurrentStep(STEP_PARENT);
    setOpenStep(STEP_PARENT);
  };

  // When modal opens, (re)load reference data and reset UI
  useEffect(() => {
    if (!isOpen) return;
    resetAll();

    (async () => {
      try {
        const res = await fetchUsers({ role: "parent" });
        const list = Array.isArray(res) ? res : res?.data ?? [];
        setParents(list);
      } catch (err) {
        toast(err.message || "Failed to load parents", "error");
      }
    })();

    (async () => {
      try {
        const res = await fetchSchools({ sort: "newest" });
        const list = Array.isArray(res) ? res : res?.data ?? [];
        setSchools(list);
      } catch (err) {
        toast(err.message || "Failed to load schools", "error");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Load students whenever a school is selected
  useEffect(() => {
    if (!selectedSchool) {
      setStudents([]);
      setMappings([]);
      setStudentSearch("");
      setStudentPage(1);
      return;
    }
    setLoadingStudents(true);
    fetchStudents({ schoolId: selectedSchool })
      .then((resp) => {
        const list = resp?.data ?? [];
        setStudents(Array.isArray(list) ? list : []);
        setMappings([]); // reset on school change
        setStudentSearch("");
        setStudentPage(1);
      })
      .catch((err) => toast(err.message || "Failed to load students", "error"))
      .finally(() => setLoadingStudents(false));
  }, [selectedSchool, toast]);

  // Filtered lists
  const filteredParents = useMemo(() => {
    const q = dParentSearch.trim().toLowerCase();
    if (!q) return parents;
    return parents.filter((p) =>
      [p.name, p.email]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [parents, dParentSearch]);

  const filteredSchools = useMemo(() => {
    const q = dSchoolSearch.trim().toLowerCase();
    if (!q) return schools;
    return schools.filter((s) =>
      [s.name, s.address]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [schools, dSchoolSearch]);

  const filteredStudents = useMemo(() => {
    const q = dStudentSearch.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) =>
      [s.name, s.class_name]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [students, dStudentSearch]);

  // Pagination
  const paginate = (arr, page, size) => {
    const totalPages = Math.max(1, Math.ceil(arr.length / size));
    const p = Math.min(Math.max(1, page), totalPages);
    const start = (p - 1) * size;
    return { items: arr.slice(start, start + size), page: p, totalPages };
  };

  const parentsPaged = useMemo(
    () => paginate(filteredParents, parentPage, PAGE_SIZE_PARENTS),
    [filteredParents, parentPage]
  );
  const schoolsPaged = useMemo(
    () => paginate(filteredSchools, schoolPage, PAGE_SIZE_SCHOOLS),
    [filteredSchools, schoolPage]
  );
  const studentsPaged = useMemo(
    () => paginate(filteredStudents, studentPage, PAGE_SIZE_STUDENTS),
    [filteredStudents, studentPage]
  );

  // Keep page valid
  useEffect(
    () => setParentPage((p) => Math.min(p, parentsPaged.totalPages)),
    [parentsPaged.totalPages]
  );
  useEffect(
    () => setSchoolPage((p) => Math.min(p, schoolsPaged.totalPages)),
    [schoolsPaged.totalPages]
  );
  useEffect(
    () => setStudentPage((p) => Math.min(p, studentsPaged.totalPages)),
    [studentsPaged.totalPages]
  );

  // Selected display
  const selectedParentObj = useMemo(
    () => parents.find((p) => String(p.id) === String(selectedParent)),
    [parents, selectedParent]
  );
  const selectedSchoolObj = useMemo(
    () => schools.find((s) => String(s.id) === String(selectedSchool)),
    [schools, selectedSchool]
  );

  // Mapping handlers
  const handleToggleStudent = (id) => {
    setMappings((ms) => {
      const exists = ms.find((m) => m.student_id === id);
      if (exists) return ms.filter((m) => m.student_id !== id);
      return [...ms, { student_id: id, relationship_type: "biological" }];
    });
  };

  const handleRelChange = (id, type) => {
    setMappings((ms) =>
      ms.map((m) =>
        m.student_id === id ? { ...m, relationship_type: type } : m
      )
    );
  };

  // Save
  const handleSave = async () => {
    if (!selectedParent || mappings.length === 0) {
      toast("Select a parent and at least one student", "error");
      return;
    }
    setLoading(true);
    try {
      for (const { student_id, relationship_type } of mappings) {
        await createParentStudentLink({
          parent_id: selectedParent,
          student_id,
          relationship_type,
        });
      }
      toast("Mappings saved", "success");

      // Immediately reset local state so the next open is clean
      resetAll();

      // Notify parent; parent can close or refresh list
      onClose(true);
    } catch (err) {
      toast(err.message || "Failed to save mappings", "error");
    } finally {
      setLoading(false);
    }
  };

  // Accordion header button (shows dynamic summaries)
  const stepHeader = (stepNum, title, subtitle, complete, rightBadge) => {
    const active = openStep === stepNum;
    return (
      <button
        type="button"
        onClick={() => {
          // prevent jumping ahead of current step
          if (stepNum > currentStep) return;
          setOpenStep(stepNum);
        }}
        className={`w-full flex items-center justify-between p-3 border rounded-md bg-white hover:bg-gray-50 transition
          ${active ? "ring-2 ring-primary/50" : ""}`}
        aria-expanded={active}
      >
        <div className="text-left">
          <div className="font-medium flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border text-xs">
              {stepNum}
            </span>
            {title}
            {complete && (
              <HiCheckCircle className="text-green-600" title="Done" />
            )}
          </div>
          {subtitle ? (
            <div className="text-xs text-gray-500 mt-0.5">{subtitle}</div>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {rightBadge}
          <HiChevronDown
            className={`shrink-0 transition-transform ${
              active ? "rotate-180" : ""
            }`}
            aria-hidden="true"
          />
        </div>
      </button>
    );
  };

  // Guards for moving forward
  const canProceedFromParent = !!selectedParent;
  const canProceedFromSchool = !!selectedSchool;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => onClose(false)}
      />
      {/* panel */}
      <div className="relative ml-auto h-full w-full max-w-md bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-xl font-semibold">Link Parent & Students</h2>
          <button
            onClick={() => onClose(false)}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <HiX className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Step 1: Select Parent */}
          <section className="space-y-2">
            {stepHeader(
              STEP_PARENT,
              "Step 1 · Select Parent",
              selectedParentObj
                ? `${selectedParentObj.name}${
                    selectedParentObj.email
                      ? ` — ${selectedParentObj.email}`
                      : ""
                  }`
                : "Choose the parent to link with students.",
              canProceedFromParent,
              selectedParentObj ? (
                <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded">
                  selected
                </span>
              ) : null
            )}
            {openStep === STEP_PARENT && (
              <div className="border rounded-md p-3 space-y-3">
                <div className="relative">
                  <HiSearch className="absolute left-2 top-2.5 text-gray-400" />
                  <input
                    value={parentSearch}
                    onChange={(e) => setParentSearch(e.target.value)}
                    placeholder="Search parents by name or email…"
                    className="w-full pl-8 pr-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                    aria-label="Search parents"
                  />
                </div>

                <ListPager
                  page={parentsPaged.page}
                  totalPages={parentsPaged.totalPages}
                  leftLabel={`Showing ${parentsPaged.items.length} / ${filteredParents.length}`}
                  onPrev={() => setParentPage((p) => Math.max(1, p - 1))}
                  onNext={() =>
                    setParentPage((p) =>
                      Math.min(parentsPaged.totalPages, p + 1)
                    )
                  }
                />

                <div className="border rounded divide-y max-h-56 overflow-auto">
                  {parentsPaged.items.length === 0 ? (
                    <div className="p-3 text-sm text-gray-500">
                      No parents found.
                    </div>
                  ) : (
                    parentsPaged.items.map((p) => {
                      const active = String(selectedParent) === String(p.id);
                      return (
                        <label
                          key={p.id}
                          className={`flex items-center gap-2 p-3 cursor-pointer ${
                            active ? "bg-gray-50" : ""
                          }`}
                          title={`${p.name}${p.email ? ` (${p.email})` : ""}`}
                        >
                          <input
                            type="radio"
                            name="parent"
                            checked={active}
                            onChange={() => {
                              setSelectedParent(String(p.id));
                              // Auto-advance: close this step and open next
                              setCurrentStep(STEP_SCHOOL);
                              setOpenStep(STEP_SCHOOL);
                            }}
                            aria-label={`Select parent ${p.name}`}
                          />
                          <div>
                            <div className="font-medium text-sm">{p.name}</div>
                            {p.email ? (
                              <div className="text-xs text-gray-500">
                                {p.email}
                              </div>
                            ) : null}
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Step 2: Select School */}
          <section className="space-y-2">
            {stepHeader(
              STEP_SCHOOL,
              "Step 2 · Select School",
              selectedSchoolObj
                ? selectedSchoolObj.name
                : "Filter students by school.",
              canProceedFromSchool,
              selectedSchoolObj ? (
                <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded">
                  selected
                </span>
              ) : null
            )}
            {openStep === STEP_SCHOOL && (
              <div className="border rounded-md p-3 space-y-3">
                <div className="relative">
                  <HiSearch className="absolute left-2 top-2.5 text-gray-400" />
                  <input
                    value={schoolSearch}
                    onChange={(e) => setSchoolSearch(e.target.value)}
                    placeholder="Search schools by name or address…"
                    className="w-full pl-8 pr-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                    aria-label="Search schools"
                  />
                </div>

                <ListPager
                  page={schoolsPaged.page}
                  totalPages={schoolsPaged.totalPages}
                  leftLabel={`Showing ${schoolsPaged.items.length} / ${filteredSchools.length}`}
                  onPrev={() => setSchoolPage((p) => Math.max(1, p - 1))}
                  onNext={() =>
                    setSchoolPage((p) =>
                      Math.min(schoolsPaged.totalPages, p + 1)
                    )
                  }
                />

                <div className="border rounded divide-y max-h-56 overflow-auto">
                  {schoolsPaged.items.length === 0 ? (
                    <div className="p-3 text-sm text-gray-500">
                      No schools found.
                    </div>
                  ) : (
                    schoolsPaged.items.map((s) => {
                      const active = String(selectedSchool) === String(s.id);
                      return (
                        <label
                          key={s.id}
                          className={`flex items-center gap-2 p-3 cursor-pointer ${
                            active ? "bg-gray-50" : ""
                          }`}
                          title={s.name}
                        >
                          <input
                            type="radio"
                            name="school"
                            checked={active}
                            onChange={() => {
                              setSelectedSchool(String(s.id));
                              // Auto-advance to students
                              setCurrentStep(STEP_STUDENTS);
                              setOpenStep(STEP_STUDENTS);
                            }}
                            aria-label={`Select school ${s.name}`}
                          />
                          <div>
                            <div className="font-medium text-sm">{s.name}</div>
                            {s.address ? (
                              <div className="text-xs text-gray-500">
                                {s.address}
                              </div>
                            ) : null}
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Step 3: Pick Students & Save */}
          <section className="space-y-2">
            {stepHeader(
              STEP_STUDENTS,
              "Step 3 · Pick Students & Save",
              selectedSchoolObj
                ? `Selected: ${mappings.length} student${
                    mappings.length === 1 ? "" : "s"
                  }`
                : "Select students and set relationship.",
              mappings.length > 0,
              mappings.length > 0 ? (
                <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded">
                  {mappings.length} selected
                </span>
              ) : null
            )}
            {openStep === STEP_STUDENTS && (
              <div className="border rounded-md p-3 space-y-3">
                <div className="relative">
                  <HiSearch className="absolute left-2 top-2.5 text-gray-400" />
                  <input
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder={
                      selectedSchool
                        ? "Search students by name or class…"
                        : "Select a school first"
                    }
                    className="w-full pl-8 pr-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                    aria-label="Search students"
                    disabled={!selectedSchool}
                  />
                </div>

                <ListPager
                  page={studentsPaged.page}
                  totalPages={studentsPaged.totalPages}
                  leftLabel={
                    loadingStudents
                      ? "Loading students…"
                      : `Showing ${studentsPaged.items.length} / ${filteredStudents.length}`
                  }
                  onPrev={() => setStudentPage((p) => Math.max(1, p - 1))}
                  onNext={() =>
                    setStudentPage((p) =>
                      Math.min(studentsPaged.totalPages, p + 1)
                    )
                  }
                />

                <div className="border rounded max-h-64 overflow-auto divide-y">
                  {!selectedSchool ? (
                    <div className="p-3 text-sm text-gray-500">
                      Select a school to view students.
                    </div>
                  ) : loadingStudents ? (
                    <div className="p-3 text-sm text-gray-500">Loading…</div>
                  ) : filteredStudents.length === 0 ? (
                    <div className="p-3 text-sm text-gray-500">
                      No students to display
                    </div>
                  ) : (
                    studentsPaged.items.map((s) => {
                      const mapped = mappings.find(
                        (m) => m.student_id === s.id
                      );
                      return (
                        <div
                          key={s.id}
                          className="flex items-center justify-between p-3"
                        >
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={!!mapped}
                              onChange={() => handleToggleStudent(s.id)}
                              aria-label={`Select ${s.name}`}
                            />
                            <span className="text-sm">
                              {s.name}{" "}
                              {s.class_name ? (
                                <span className="text-gray-500">
                                  ({s.class_name})
                                </span>
                              ) : null}
                            </span>
                          </label>
                          {mapped && (
                            <select
                              value={mapped.relationship_type}
                              onChange={(e) =>
                                handleRelChange(s.id, e.target.value)
                              }
                              className="border p-1 rounded text-sm"
                              aria-label={`Relationship for ${s.name}`}
                            >
                              <option value="biological">biological</option>
                              <option value="step">step</option>
                            </select>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className="px-3 py-2 border rounded hover:bg-gray-50"
                    onClick={() => setOpenStep(STEP_SCHOOL)}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={
                      loading || !selectedParent || mappings.length === 0
                    }
                    className="bg-primary text-white py-2 rounded hover:bg-primary-dark disabled:opacity-50"
                  >
                    {loading ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Footer (minimal; actions live in steps) */}
        <div className="border-t px-6 py-4">
          <button
            onClick={() => onClose(false)}
            className="w-full border border-gray-300 text-gray-700 py-2 rounded hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Reusable compact pager line (left status + prev/next + page)
function ListPager({ page, totalPages, leftLabel, onPrev, onNext }) {
  return (
    <div className="flex items-center justify-between text-xs text-gray-600">
      <span>{leftLabel}</span>
      <span className="flex items-center gap-2">
        <button
          onClick={onPrev}
          disabled={page <= 1}
          className="p-1.5 border rounded disabled:opacity-50"
          title="Previous"
        >
          <HiChevronLeft />
        </button>
        <span className="min-w-[70px] text-center">
          Page {page} / {totalPages}
        </span>
        <button
          onClick={onNext}
          disabled={page >= totalPages}
          className="p-1.5 border rounded disabled:opacity-50"
          title="Next"
        >
          <HiChevronRight />
        </button>
      </span>
    </div>
  );
}
