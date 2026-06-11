import "@testing-library/jest-dom";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// unmount between tests so they don't leak into each other
afterEach(() => {
  cleanup();
});
