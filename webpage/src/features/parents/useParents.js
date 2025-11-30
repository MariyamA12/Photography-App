// src/features/parents/useParents.js
import { useState, useEffect } from 'react';
import { fetchParentStudentLinks } from '../../services/admin/parentStudentService';

export function useParents({
  parentName = '',
  studentName = '',
  schoolId = '',
  page = 1,
  limit = 10,
  reload = false,
} = {}) {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchParentStudentLinks({ parentName, studentName, schoolId, page, limit })
      .then(res => {
        if (!active) return;
        setData(res.data);
        setTotal(res.total);
      })
      .catch(err => {
        if (!active) return;
        setError(err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [parentName, studentName, schoolId, page, limit, reload]);

  return { data, total, loading, error };
}
