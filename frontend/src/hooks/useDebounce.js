import { useEffect, useState } from "react";

// debounced copy of `value` — only updates after `delay` ms of no changes.
// used so the task search doesn't hit the API on every keystroke.
export const useDebounce = (value, delay = 400) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
};
