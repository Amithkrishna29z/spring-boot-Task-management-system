import React from "react";

const Spinner = ({ label = "Loading…" }) => (
  <div
    className="min-h-[50vh] flex flex-col items-center justify-center gap-3"
    role="status"
    aria-live="polite"
  >
    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    <span className="text-text-secondary text-sm">{label}</span>
  </div>
);

export default Spinner;
