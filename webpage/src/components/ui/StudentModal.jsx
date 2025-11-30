// src/components/ui/StudentModal.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  HiX,
  HiUpload,
  HiSearch,
  HiChevronLeft,
  HiChevronRight,
  HiCheckCircle,
  HiInformationCircle,
  HiChevronDown,
} from 'react-icons/hi';
import { useToast } from '../../features/toast/useToast';
import {
  createStudent,
  updateStudent,
} from '../../services/admin/studentService';
import { fetchSchools } from '../../services/admin/schoolService';

const PAGE_SIZE_SCHOOLS = 8; // front-end paging size for school picker

export default function StudentModal({ isOpen, onClose, initial }) {
  const { toast } = useToast();

  // ---------------------------
  // Create / Edit (existing UX)
  // ---------------------------
  const [name, setName] = useState('');
  const [className, setClassName] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [schools, setSchools] = useState([]);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [loading, setLoading] = useState(false);

  // --------------------------------
  // CSV Import (UI-only restructuring)
  // --------------------------------
  const [csvPanel, setCsvPanel] = useState(false);
  const [schoolsLoaded, setSchoolsLoaded] = useState(false);

  const [schoolSearch, setSchoolSearch] = useState('');
  const [schoolPage, setSchoolPage] = useState(1);
  const [selectedSchool, setSelectedSchool] = useState(null);

  const fileInputRef = useRef(null);
  const [csvFileName, setCsvFileName] = useState('');
  const [rows, setRows] = useState([]); // parsed valid rows: [{name, class_name}]
  const [rowErrors, setRowErrors] = useState([]); // parse issues
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ total: 0, success: 0, failed: 0 });

  // Accordion / Steps (UI only; logic unchanged)
  const STEP_SELECT_SCHOOL = 1;
  const STEP_UPLOAD_CSV = 2;
  const STEP_REVIEW_CONFIRM = 3;
  const STEP_IMPORT = 4;
  const [currentStep, setCurrentStep] = useState(STEP_SELECT_SCHOOL);
  const [openStep, setOpenStep] = useState(STEP_SELECT_SCHOOL);

  // Reset entire modal to pristine state
  const resetAll = useCallback(() => {
    // base form
    setName('');
    setClassName('');
    setSchoolId('');
    // csv panel
    setCsvPanel(false);
    setSchoolsLoaded(false);
    setSchoolSearch('');
    setSchoolPage(1);
    setSelectedSchool(null);
    setCsvFileName('');
    setRows([]);
    setRowErrors([]);
    setImporting(false);
    setProgress({ total: 0, success: 0, failed: 0 });
    setCurrentStep(STEP_SELECT_SCHOOL);
    setOpenStep(STEP_SELECT_SCHOOL);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  // When modal opens, init state
  useEffect(() => {
    if (!isOpen) return;
    if (initial) {
      setName(initial.name);
      setClassName(initial.class_name);
      setSchoolId(initial.school_id ?? '');
    } else {
      resetAll();
    }
  }, [isOpen, initial, resetAll]);

  // Load schools (for both dropdown & CSV panel)
  useEffect(() => {
    if (!isOpen) return;
    setLoadingSchools(true);
    fetchSchools({ sort: 'newest' })
      .then((data) => {
        setSchools(Array.isArray(data) ? data : []);
        setSchoolsLoaded(true);
      })
      .catch((err) => toast(err.message, 'error'))
      .finally(() => setLoadingSchools(false));
  }, [isOpen, toast]);

  // -----------------------
  // Existing save behaviour
  // -----------------------
  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = {
        name,
        class_name: className,
        school_id: schoolId || null,
      };
      if (initial) {
        await updateStudent(initial.id, payload);
        toast('Student updated', 'success');
      } else {
        await createStudent(payload);
        toast('Student created', 'success');
      }
      onClose(true); // parent refreshes list
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // -------------------
  // CSV helpers & UI
  // -------------------
  const filteredSchools = useMemo(() => {
    const q = schoolSearch.trim().toLowerCase();
    if (!q) return schools;
    return schools.filter((s) =>
      [s.name, s.address].filter(Boolean).some((v) => String(v).toLowerCase().includes(q))
    );
  }, [schools, schoolSearch]);

  const totalSchoolPages = Math.max(1, Math.ceil(filteredSchools.length / PAGE_SIZE_SCHOOLS));
  const pagedSchools = useMemo(() => {
    const start = (schoolPage - 1) * PAGE_SIZE_SCHOOLS;
    return filteredSchools.slice(start, start + PAGE_SIZE_SCHOOLS);
  }, [filteredSchools, schoolPage]);

  useEffect(() => {
    setSchoolPage(1);
  }, [schoolSearch]);

  const parseCsv = (text) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) {
      return { rows: [], errors: [{ index: 0, message: 'Empty file' }] };
    }

    const tokenize = (line) => {
      const out = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (inQuotes && line[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (ch === ',' && !inQuotes) {
          out.push(cur);
          cur = '';
        } else {
          cur += ch;
        }
      }
      out.push(cur);
      return out.map((v) => v.trim());
    };

    const headers = tokenize(lines[0]).map((h) => h.toLowerCase());
    const nameIdx = headers.indexOf('name');
    const classIdx = headers.indexOf('class_name');

    const errors = [];
    if (nameIdx === -1 || classIdx === -1) {
      errors.push({ index: 1, message: 'Missing required headers. Expected: name,class_name' });
      return { rows: [], errors };
    }

    const parsed = [];
    for (let li = 1; li < lines.length; li++) {
      const cols = tokenize(lines[li]);
      if (cols.every((c) => c === '')) continue;
      const nameVal = (cols[nameIdx] || '').trim();
      const classVal = (cols[classIdx] || '').trim();

      if (!nameVal) {
        errors.push({ index: li + 1, message: 'name is required' });
        continue;
      }
      if (!classVal) {
        errors.push({ index: li + 1, message: 'class_name is required' });
        continue;
      }
      parsed.push({ name: nameVal, class_name: classVal });
    }
    return { rows: parsed, errors };
  };

  const handleCsvFile = async (file) => {
    if (!file) return;
    if (!/\.csv$/i.test(file.name)) {
      toast('Please select a .csv file', 'error');
      return;
    }
    try {
      const text = await file.text();
      const { rows: parsed, errors } = parseCsv(text);
      setCsvFileName(file.name);
      setRows(parsed);
      setRowErrors(errors);
      if (errors.length) {
        toast(`Parsed with ${errors.length} issue${errors.length > 1 ? 's' : ''}.`, 'info');
      } else {
        toast(`Parsed ${parsed.length} row(s).`, 'success');
      }
    } catch {
      toast('Failed to read the file', 'error');
    }
  };

  const progressPct = useMemo(() => {
    const done = progress.success + progress.failed;
    if (!progress.total) return 0;
    return Math.round((done / progress.total) * 100);
  }, [progress]);

  // Main import (logic unchanged)
  const importRows = async () => {
    if (!selectedSchool) {
      toast('Please select a school first', 'error');
      return;
    }
    if (rows.length === 0) {
      toast('No valid rows to import', 'error');
      return;
    }

    setImporting(true);
    setProgress({ total: rows.length, success: 0, failed: 0 });

    const batchSize = 5;
    let success = 0;
    let failed = 0;

    // small helper: sleep to allow UI progress bar to repaint smoothly
    const tick = () => new Promise((r) => setTimeout(r, 0));

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);

      // run in parallel with limited concurrency
      const results = await Promise.allSettled(
        batch.map((r) =>
          createStudent({
            name: r.name,
            class_name: r.class_name,
            school_id: selectedSchool.id,
          })
        )
      );

      results.forEach((res) => {
        if (res.status === 'fulfilled') success += 1;
        else failed += 1;
      });

      setProgress({ total: rows.length, success, failed });
      await tick();
    }

    setImporting(false);

    if (failed === 0) {
      toast(`Imported ${success} student(s)`, 'success');
      // Fresh state for another import, keep panel open for convenience
      setRows([]);
      setCsvFileName('');
      setRowErrors([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      // also notify parent to refresh main list
      onClose(true);
      // re-open clean modal for next add
      setTimeout(() => {
        resetAll();
        setCsvPanel(true);
        setCurrentStep(STEP_SELECT_SCHOOL);
        setOpenStep(STEP_SELECT_SCHOOL);
      }, 0);
    } else {
      toast(`Imported ${success}, failed ${failed}.`, 'error');
    }
  };

  // Step helpers (UI only)
  const canProceedFromStep1 = !!selectedSchool;
  const canProceedFromStep2 = rows.length > 0; // we allow issues; they’re surfaced in step 3
  const hasBlockingIssues = rows.length === 0; // no valid rows is a blocker
  const stepHeader = (stepNum, title, subtitle) => {
    const active = openStep === stepNum;
    const complete =
      (stepNum === STEP_SELECT_SCHOOL && canProceedFromStep1) ||
      (stepNum === STEP_UPLOAD_CSV && canProceedFromStep2) ||
      (stepNum === STEP_REVIEW_CONFIRM && !hasBlockingIssues && canProceedFromStep2 && canProceedFromStep1);

    return (
      <button
        type="button"
        onClick={() => {
          // Prevent opening steps that are ahead of completion flow
          if (stepNum > currentStep) return;
          setOpenStep(stepNum);
        }}
        className={`w-full flex items-center justify-between p-3 border rounded-md bg-white hover:bg-gray-50 transition
          ${active ? 'ring-2 ring-primary/50' : ''}`}
        aria-expanded={active}
      >
        <div className="text-left">
          <div className="font-medium flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border text-xs">
              {stepNum}
            </span>
            {title}
            {complete && <HiCheckCircle className="text-green-600" title="Done" />}
          </div>
          {subtitle && <div className="text-xs text-gray-500 mt-0.5">{subtitle}</div>}
        </div>
        <HiChevronDown
          className={`shrink-0 transition-transform ${active ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={() => onClose(false)} />
      {/* panel */}
      <div className="relative ml-auto h-full w-full max-w-md bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-xl font-semibold">
            {csvPanel ? 'Import Students via CSV' : initial ? 'Edit Student' : 'Add Student'}
          </h2>
          <button onClick={() => onClose(false)} className="text-gray-500 hover:text-gray-700">
            <HiX className="w-6 h-6" />
          </button>
        </div>

        {/* Content (scrollable) */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {!csvPanel ? (
            <>
              <div>
                <label className="block mb-1">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Student name"
                />
              </div>

              <div>
                <label className="block mb-1">Class</label>
                <input
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g., 4A, Grade 6B"
                />
              </div>

              <div>
                <label className="block mb-1">School</label>
                <select
                  value={schoolId}
                  onChange={(e) => setSchoolId(e.target.value)}
                  disabled={loadingSchools}
                  className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">-- Select a school --</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-md bg-orange-50 border border-orange-200 p-3 text-sm text-orange-700 flex items-start gap-2">
                <HiInformationCircle className="mt-0.5 shrink-0" />
                <div>
                  <div className="font-medium">Bulk import</div>
                  <div>
                    You can add many students at once: upload a CSV with{' '}
                    <code className="font-mono">name,class_name</code>.
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Step 1: Select School */}
              <section className="space-y-2">
                {stepHeader(
                  STEP_SELECT_SCHOOL,
                  'Step 1 · Select School',
                  'Choose the school that all imported students will belong to.'
                )}

                {openStep === STEP_SELECT_SCHOOL && (
                  <div className="border rounded-md p-3 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <HiSearch className="absolute left-2 top-2.5 text-gray-400" />
                        <input
                          value={schoolSearch}
                          onChange={(e) => setSchoolSearch(e.target.value)}
                          placeholder="Search schools..."
                          className="w-full pl-8 pr-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                          aria-label="Search schools"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSchoolPage((p) => Math.max(1, p - 1))}
                          disabled={schoolPage <= 1}
                          className="p-2 border rounded disabled:opacity-50"
                          title="Previous page"
                        >
                          <HiChevronLeft />
                        </button>
                        <div className="text-sm min-w-[90px] text-center">
                          Page {schoolPage} / {totalSchoolPages}
                        </div>
                        <button
                          onClick={() => setSchoolPage((p) => Math.min(totalSchoolPages, p + 1))}
                          disabled={schoolPage >= totalSchoolPages}
                          className="p-2 border rounded disabled:opacity-50"
                          title="Next page"
                        >
                          <HiChevronRight />
                        </button>
                      </div>
                    </div>

                    <div className="border rounded max-h-48 overflow-auto divide-y">
                      {pagedSchools.length === 0 ? (
                        <div className="p-3 text-sm text-gray-500">No schools found.</div>
                      ) : (
                        pagedSchools.map((s) => {
                          const active = selectedSchool?.id === s.id;
                          return (
                            <button
                              type="button"
                              key={s.id}
                              onClick={() => setSelectedSchool(s)}
                              className={`w-full text-left p-3 hover:bg-gray-50 ${
                                active ? 'bg-gray-100' : ''
                              }`}
                              aria-pressed={active}
                            >
                              <div className="font-medium">{s.name}</div>
                              {s.address ? (
                                <div className="text-xs text-gray-500">{s.address}</div>
                              ) : null}
                            </button>
                          );
                        })
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      {selectedSchool ? (
                        <div className="mt-1 text-sm">
                          Selected:{' '}
                          <span className="font-medium">{selectedSchool.name}</span>
                        </div>
                      ) : (
                        <div className="mt-1 text-sm text-red-600">
                          Please select a school.
                        </div>
                      )}

                      <button
                        type="button"
                        className="px-3 py-2 bg-primary text-white rounded disabled:opacity-50"
                        onClick={() => {
                          if (!canProceedFromStep1) {
                            toast('Select a school to continue', 'error');
                            return;
                          }
                          setCurrentStep(STEP_UPLOAD_CSV);
                          setOpenStep(STEP_UPLOAD_CSV);
                        }}
                        disabled={!canProceedFromStep1}
                      >
                        Continue
                      </button>
                    </div>
                  </div>
                )}
              </section>

              {/* Step 2: Upload CSV */}
              <section className="space-y-2">
                {stepHeader(
                  STEP_UPLOAD_CSV,
                  'Step 2 · Upload CSV',
                  'Upload a CSV with headers: name,class_name.'
                )}

                {openStep === STEP_UPLOAD_CSV && (
                  <div className="border rounded-md p-3 space-y-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={(e) => handleCsvFile(e.target.files?.[0])}
                      className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-dark"
                      aria-label="Upload CSV file"
                    />
                    {csvFileName ? (
                      <div className="text-sm text-gray-700">Selected: {csvFileName}</div>
                    ) : null}
                    <p className="text-xs text-gray-500">
                      Expected headers: <code>name,class_name</code>. Each row will be created in the
                      selected school.
                    </p>

                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        className="px-3 py-2 border rounded hover:bg-gray-50"
                        onClick={() => {
                          setOpenStep(STEP_SELECT_SCHOOL);
                        }}
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        className="px-3 py-2 bg-primary text-white rounded disabled:opacity-50"
                        onClick={() => {
                          if (!canProceedFromStep2) {
                            toast('Upload a CSV with at least one valid row to continue', 'error');
                            return;
                          }
                          setCurrentStep(STEP_REVIEW_CONFIRM);
                          setOpenStep(STEP_REVIEW_CONFIRM);
                        }}
                        disabled={!canProceedFromStep2}
                      >
                        Continue
                      </button>
                    </div>
                  </div>
                )}
              </section>

              {/* Step 3: Review & Confirm */}
              <section className="space-y-2">
                {stepHeader(
                  STEP_REVIEW_CONFIRM,
                  'Step 3 · Review & Confirm',
                  'Check parsed rows and any issues before importing.'
                )}

                {openStep === STEP_REVIEW_CONFIRM && (
                  <div className="border rounded-md p-3 space-y-3">
                    {/* Summary */}
                    <div className="text-sm">
                      Parsed rows:{' '}
                      <span className="font-medium">{rows.length}</span>{' '}
                      {rowErrors.length > 0 && (
                        <span className="ml-2 text-red-600">
                          {rowErrors.length} issue{rowErrors.length > 1 ? 's' : ''} detected
                        </span>
                      )}
                    </div>

                    {/* Issues table (same as before, trimmed to 30 to keep UI snappy) */}
                    {rowErrors.length > 0 && (
                      <div className="max-h-28 overflow-auto border rounded">
                        <table className="w-full text-xs">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="p-2 border">Row</th>
                              <th className="p-2 border">Issue</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rowErrors.slice(0, 30).map((e, i) => (
                              <tr key={`${e.index}-${i}`}>
                                <td className="p-2 border">{e.index}</td>
                                <td className="p-2 border">{e.message}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Preview table */}
                    <div className="border rounded">
                      <div className="flex items-center justify-between px-2 py-1 bg-gray-50 text-xs">
                        <span className="font-medium">Preview</span>
                        <span>
                          Showing {Math.min(rows.length, 50)} of {rows.length}
                        </span>
                      </div>
                      <div className="max-h-56 overflow-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="p-2 border text-left">#</th>
                              <th className="p-2 border text-left">Name</th>
                              <th className="p-2 border text-left">Class Name</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rows.slice(0, 50).map((r, idx) => (
                              <tr key={`${r.name}-${idx}`}>
                                <td className="p-2 border">{idx + 1}</td>
                                <td className="p-2 border">{r.name}</td>
                                <td className="p-2 border">{r.class_name}</td>
                              </tr>
                            ))}
                            {rows.length === 0 && (
                              <tr>
                                <td className="p-2 border text-sm text-gray-500" colSpan={3}>
                                  No valid rows to display.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        className="px-3 py-2 border rounded hover:bg-gray-50"
                        onClick={() => setOpenStep(STEP_UPLOAD_CSV)}
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        className="px-3 py-2 bg-primary text-white rounded disabled:opacity-50"
                        onClick={() => {
                          if (hasBlockingIssues) {
                            toast('No valid rows to import', 'error');
                            return;
                          }
                          setCurrentStep(STEP_IMPORT);
                          setOpenStep(STEP_IMPORT);
                        }}
                        disabled={hasBlockingIssues}
                      >
                        Looks good — Continue
                      </button>
                    </div>
                  </div>
                )}
              </section>

              {/* Step 4: Import */}
              <section className="space-y-2">
                {stepHeader(
                  STEP_IMPORT,
                  'Step 4 · Import',
                  'Start the import. You can monitor progress below.'
                )}

                {openStep === STEP_IMPORT && (
                  <div className="border rounded-md p-3 space-y-3">
                    {/* Confirmation summary */}
                    <div className="text-sm">
                      <div>
                        <span className="text-gray-600">School:</span>{' '}
                        <span className="font-medium">
                          {selectedSchool ? selectedSchool.name : '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Rows to import:</span>{' '}
                        <span className="font-medium">{rows.length}</span>
                      </div>
                      {rowErrors.length > 0 && (
                        <div className="text-xs text-orange-700 mt-1">
                          Note: {rowErrors.length} non-blocking issue{rowErrors.length > 1 ? 's' : ''} were detected.
                          Rows with issues were skipped during parsing.
                        </div>
                      )}
                    </div>

                    {/* Progress (unchanged) */}
                    {importing && (
                      <section>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="flex items-center gap-2">
                            <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
                            Importing…
                          </span>
                          <span>{progressPct}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded overflow-hidden">
                          <div
                            className="h-2 bg-primary transition-[width] duration-200"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        <div className="mt-2 text-xs text-gray-600">
                          Total: {progress.total} • Success: {progress.success} • Failed: {progress.failed}
                        </div>
                      </section>
                    )}

                    {/* Actions */}
                    {/* <div className="grid grid-cols-2 gap-2"> */}
                      {/* <button
                        type="button"
                        onClick={() => setOpenStep(STEP_REVIEW_CONFIRM)}
                        disabled={importing}
                        className="border border-gray-300 text-gray-700 py-2 rounded hover:bg-gray-50 disabled:opacity-50"
                      >
                        Back
                      </button> */}
                      {/* <button
                        type="button"
                        onClick={importRows}
                        disabled={importing || !selectedSchool || rows.length === 0}
                        className="bg-primary text-white py-2 rounded hover:bg-primary-dark disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {importing ? (
                          <>
                            <span className="inline-block w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                            Importing…
                          </>
                        ) : (
                          <>
                            <HiCheckCircle className="w-5 h-5" />
                            Import
                          </>
                        )}
                      </button> */}
                    {/* </div> */}
                  </div>
                )}
              </section>
            </>
          )}
        </div>

        {/* Footer (sticky) */}
        <div className="border-t px-6 py-4">
          {!csvPanel ? (
            <div className="flex gap-2">
              <button
                onClick={() => onClose(false)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 bg-primary text-white py-2 rounded hover:bg-primary-dark disabled:opacity-50"
              >
                {loading ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => {
                  // open CSV panel with a clean CSV state (logic preserved)
                  setCsvPanel(true);
                  setSchoolSearch('');
                  setSchoolPage(1);
                  setSelectedSchool(null);
                  setCsvFileName('');
                  setRows([]);
                  setRowErrors([]);
                  setImporting(false);
                  setProgress({ total: 0, success: 0, failed: 0 });
                  setCurrentStep(STEP_SELECT_SCHOOL);
                  setOpenStep(STEP_SELECT_SCHOOL);
                  if (!schoolsLoaded && !loadingSchools) {
                    // ensure schools are fetched (effect above handles this)
                  }
                }}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                <HiUpload className="w-5 h-5" />
                Upload CSV
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCsvPanel(false)}
                disabled={importing}
                className="border border-gray-300 text-gray-700 py-2 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Back
              </button>
              {/* Primary action depends on step; keep footer minimal to avoid duplication with step controls */}
              <button
                type="button"
                onClick={() => {
                  if (openStep === STEP_SELECT_SCHOOL && canProceedFromStep1) {
                    setCurrentStep(STEP_UPLOAD_CSV);
                    setOpenStep(STEP_UPLOAD_CSV);
                  } else if (openStep === STEP_UPLOAD_CSV && canProceedFromStep2) {
                    setCurrentStep(STEP_REVIEW_CONFIRM);
                    setOpenStep(STEP_REVIEW_CONFIRM);
                  } else if (openStep === STEP_REVIEW_CONFIRM && !hasBlockingIssues) {
                    setCurrentStep(STEP_IMPORT);
                    setOpenStep(STEP_IMPORT);
                  } else if (openStep === STEP_IMPORT) {
                    if (!importing && selectedSchool && rows.length > 0) importRows();
                  } else {
                    // If requirements not satisfied, guide with toasts
                    if (openStep === STEP_SELECT_SCHOOL) toast('Select a school to continue', 'error');
                    if (openStep === STEP_UPLOAD_CSV) toast('Upload a CSV to continue', 'error');
                    if (openStep === STEP_REVIEW_CONFIRM) toast('No valid rows to import', 'error');
                  }
                }}
                disabled={
                  importing ||
                  (openStep === STEP_SELECT_SCHOOL && !canProceedFromStep1) ||
                  (openStep === STEP_UPLOAD_CSV && !canProceedFromStep2) ||
                  (openStep === STEP_REVIEW_CONFIRM && hasBlockingIssues) ||
                  (openStep === STEP_IMPORT && (importing || !selectedSchool || rows.length === 0))
                }
                className="bg-primary text-white py-2 rounded hover:bg-primary-dark disabled:opacity-50"
              >
                {openStep === STEP_IMPORT
                  ? importing
                    ? 'Importing…'
                    : 'Import'
                  : 'Continue'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
