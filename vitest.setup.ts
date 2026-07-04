import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});

/*
 * next/font/google is a Next.js compile-time transform — in tests it needs a
 * stub. Each font loader returns an object with a `.variable` class name and
 * a `.className`. We give both a deterministic value so tests can assert on
 * them if needed.
 */
vi.mock("next/font/google", () => ({
  Fraunces: () => ({
    className: "test-font-fraunces",
    variable: "test-font-fraunces-var",
    style: { fontFamily: "Fraunces" },
  }),
  Inter: () => ({
    className: "test-font-inter",
    variable: "test-font-inter-var",
    style: { fontFamily: "Inter" },
  }),
}));
