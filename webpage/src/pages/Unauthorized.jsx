// src/pages/Unauthorized.jsx
import React from 'react';
import { Link } from 'react-router-dom';

export default function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md text-center">
        <h2 className="text-2xl mb-4">Unauthorized</h2>
        <p className="mb-6">You don’t have permission to view that page.</p>
        <Link
          to="/login"
          className="inline-block bg-blue-500 text-white px-4 py-2 rounded"
        >
          Back to Login
        </Link>
      </div>
    </div>
  );
}
