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
    // Vibe chips are exposed as toggle buttons with aria-pressed. Native
    // <button> semantics + Tab navigation, no custom keyboard handling.
    for (const label of ["Heritage", "Food", "Arts", "Spiritual"]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
    expect(screen.getByRole("button", { name: /generate journey/i })).toBeInTheDocument();
  });

  it("marks the selected vibe chip as aria-pressed", () => {
    render(<Home />);
    const heritage = screen.getByRole("button", { name: "Heritage" });
    expect(heritage).toHaveAttribute("aria-pressed", "true");
    const food = screen.getByRole("button", { name: "Food" });
    expect(food).toHaveAttribute("aria-pressed", "false");
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

    const expandBtn = await screen.findByRole("button", { name: /expand deeper story for amer fort/i });
    await user.click(expandBtn);

    await waitFor(() => {
      expect(fetchStub).toHaveBeenCalledWith(
        "/api/deepen",
        expect.objectContaining({ method: "POST" }),
      );
    });
    expect(await screen.findByText(/stepwell keeps time/i)).toBeInTheDocument();
  });

  it("collapses an expanded card on second click without calling /api/deepen again", async () => {
    const user = userEvent.setup();
    const fetchStub = mockFetchSequence(
      jsonResponse(journeyPayload),
      jsonResponse(deepenPayload),
    );

    render(<Home />);
    await user.type(screen.getByLabelText(/destination/i), "Jaipur");
    await user.click(screen.getByRole("button", { name: /generate journey/i }));

    const expandBtn = await screen.findByRole("button", { name: /expand deeper story for amer fort/i });
    await user.click(expandBtn); // opens
    await screen.findByText(/stepwell keeps time/i);
    const initialCalls = fetchStub.mock.calls.length;

    const collapseBtn = screen.getByRole("button", { name: /collapse deeper story for amer fort/i });
    await user.click(collapseBtn); // closes
    // No extra fetch — deepen response was cached in state.
    expect(fetchStub).toHaveBeenCalledTimes(initialCalls);
  });

  it("surfaces the deepen error via the alert region without breaking the card", async () => {
    const user = userEvent.setup();
    mockFetchSequence(
      jsonResponse(journeyPayload),
      jsonResponse({ ok: false, error: "The storyteller is asleep." }, { status: 502 }),
    );

    render(<Home />);
    await user.type(screen.getByLabelText(/destination/i), "Jaipur");
    await user.click(screen.getByRole("button", { name: /generate journey/i }));

    const expandBtn = await screen.findByRole("button", { name: /expand deeper story for amer fort/i });
    await user.click(expandBtn);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/storyteller is asleep/i);
    // Card is still there — the error didn't unmount the journey view.
    expect(screen.getByRole("heading", { level: 2, name: /amer fort/i })).toBeInTheDocument();
  });

  it("clicking New destination returns to the home form", async () => {
    const user = userEvent.setup();
    mockFetchSequence(jsonResponse(journeyPayload));

    render(<Home />);
    await user.type(screen.getByLabelText(/destination/i), "Jaipur");
    await user.click(screen.getByRole("button", { name: /generate journey/i }));

    // Wait for journey view.
    await screen.findByRole("heading", { level: 1, name: /your journey/i });

    await user.click(screen.getByRole("button", { name: /new destination/i }));

    // Home form is back.
    expect(screen.getByRole("heading", { level: 1, name: /wander through/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/destination/i)).toBeInTheDocument();
  });

  it("falls back to a friendly error when the fetch call throws a non-Error", async () => {
    const user = userEvent.setup();
    // fetch that rejects with a bare string — exercises the non-Error branch.
    const fetchStub = vi.fn().mockRejectedValue("boom");
    vi.stubGlobal("fetch", fetchStub);

    render(<Home />);
    await user.type(screen.getByLabelText(/destination/i), "Jaipur");
    await user.click(screen.getByRole("button", { name: /generate journey/i }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/couldn't reach the storyteller/i);
  });
});
