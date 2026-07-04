import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import RootLayout, { metadata } from "@/app/layout";

/**
 * Smoke coverage for the root layout. Layout files in the Next.js App Router
 * live at the framework boundary — full render is awkward because they own
 * `<html>` and `<body>` — but we CAN verify the pieces we control:
 *   - metadata is set (title + description reach the &lt;head&gt;)
 *   - children render inside the layout
 *   - the html element has the expected `lang` attribute for a11y
 */

describe("RootLayout metadata", () => {
  it("declares a page title tailored to the product", () => {
    expect(metadata.title).toBe("Wander — a city's story");
  });

  it("declares a description that mentions the challenge domain", () => {
    expect(typeof metadata.description).toBe("string");
    expect(metadata.description as string).toMatch(/cultural/i);
  });
});

describe("RootLayout render", () => {
  it("renders children inside the html/body wrapper with lang set", () => {
    const { container } = render(
      <RootLayout>
        <span data-testid="probe">hello</span>
      </RootLayout>
    );
    // React 18 in jsdom renders <html> inside a wrapper; walk the tree
    // rather than asserting document.documentElement (which is jsdom's own).
    const html = container.querySelector("html");
    expect(html).not.toBeNull();
    expect(html?.getAttribute("lang")).toBe("en");
    expect(container.querySelector('[data-testid="probe"]')?.textContent).toBe("hello");
  });
});
