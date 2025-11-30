// src/components/ui/Spinner.jsx
import React from 'react';

export default function Spinner() {
  return (
    <div className="flex justify-center items-center py-10">
      <div className="flex space-x-1 text-primary text-4xl">
        <span className="dot">.</span>
        <span className="dot">.</span>
        <span className="dot">.</span>
      </div>
    </div>
  );
}
