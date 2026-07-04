import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "@/app/page";

/**
 * Component tests for the home page. We mock `fetch` because the API routes
 * hit OpenAI, which is out of scope for a unit test suite (and would need a
 * live API key). The tests cover: rendering, form validation, vibe selection,
 * a successful journey, error surfacing, and card expansion.
 */

const journeyPayload = {
  ok: true,
  data: {
    destination: "Jaipur",
    vibe: "heritage",
    stops: [
      {
        id: "s0",
        name: "Amer Fort",
        hook: "Sandstone ramparts stitched against the Aravalli hills.",
        narrative: "I climb the cobbled ramp at dawn.",
        heritage_note: "Rajput seat of the Kachwaha rulers.",
        hidden_gem_score: 1,
        nearby_experience: "Sound-and-light show at dusk.",
      },
      {
        id: "s1",
        name: "Panna Meena ka Kund",
        hook: "A geometric stepwell most tourists never find.",
        narrative: "I sit on the warm sandstone treads.",
        heritage_note: "16th-century water reservoir.",
        hidden_gem_score: 4,
        nearby_experience: "Morning tea at a nearby haveli.",
      },
    ],
  },
};

const deepenPayload = {
  ok: true,
  data: {
    deep_narrative: "The stepwell keeps time in shadows.",
    deep_heritage: "Stepwells were both civic infrastructure and social space.",
  },
};

function mockFetchSequence(...responses: Response[]) {
  const stub = vi.fn();
  for (const r of responses) stub.mockResolvedValueOnce(r);
  vi.stubGlobal("fetch", stub);
  return stub;
}

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("Home page", () => {
  it("renders the hero, input, and every vibe chip on load", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { level: 1, name: /wander/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/destination/i)).toBeInTheDocument();
    // Vibe chips are exposed as radios inside a radiogroup so screen readers
    // announce mutually-exclusive selection correctly.
    for (const label of ["Heritage", "Food", "Arts", "Spiritual"]) {
      expect(screen.getByRole("radio", { name: label })).toBeInTheDocument();
    }
    expect(screen.getByRole("button", { name: /generate journey/i })).toBeInTheDocument();
  });

  it("marks the selected vibe chip as aria-checked", () => {
    render(<Home />);
    const heritage = screen.getByRole("radio", { name: "Heritage" });
    expect(heritage).toHaveAttribute("aria-checked", "true");
    const food = screen.getByRole("radio", { name: "Food" });
    expect(food).toHaveAttribute("aria-checked", "false");
  });

  it("exposes a skip-to-main-content link for keyboard users", () => {
    render(<Home />);
    const skip = screen.getByRole("link", { name: /skip to main content/i });
    expect(skip).toHaveAttribute("href", "#wander-main");
  });

  it("shows a friendly error and does not fetch when destination is empty", async () => {
    const user = userEvent.setup();
    const fetchStub = vi.fn();
    vi.stubGlobal("fetch", fetchStub);

    render(<Home />);
    await user.click(screen.getByRole("button", { name: /generate journey/i }));

    expect(fetchStub).not.toHaveBeenCalled();
    expect(await screen.findByRole("alert")).toHaveTextContent(/somewhere to wander/i);
  });

  it("renders every stop from a successful journey response", async () => {
    const user = userEvent.setup();
    mockFetchSequence(jsonResponse(journeyPayload));

    render(<Home />);
    await user.type(screen.getByLabelText(/destination/i), "Jaipur");
    await user.click(screen.getByRole("button", { name: /generate journey/i }));

    expect(await screen.findByRole("heading", { level: 2, name: /amer fort/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: /panna meena/i })).toBeInTheDocument();
    expect(screen.getByText(/Rajput seat/i)).toBeInTheDocument();
  });

  it("surfaces server errors in a screen-reader-visible alert", async () => {
    const user = userEvent.setup();
    mockFetchSequence(jsonResponse({ ok: false, error: "The storyteller is asleep." }, { status: 502 }));

    render(<Home />);
    await user.type(screen.getByLabelText(/destination/i), "Jaipur");
    await user.click(screen.getByRole("button", { name: /generate journey/i }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/storyteller is asleep/i);
  });

  it("calls /api/deepen when a card is tapped and shows the deeper narrative", async () => {
    const user = userEvent.setup();
    const fetchStub = mockFetchSequence(
      jsonResponse(journeyPayload),
      jsonResponse(deepenPayload),
    );

    render(<Home />);
    await user.type(screen.getByLabelText(/destination/i), "Jaipur");
    await user.click(screen.getByRole("button", { name: /generate journey/i }));

    const card = await screen.findByRole("button", { name: /amer fort/i });
    await user.click(card);

    await waitFor(() => {
      expect(fetchStub).toHaveBeenCalledWith(
        "/api/deepen",
        expect.objectContaining({ method: "POST" }),
      );
    });
    expect(await screen.findByText(/stepwell keeps time/i)).toBeInTheDocument();
  });
});
