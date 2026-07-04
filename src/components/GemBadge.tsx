import clsx from "clsx";

/**
 * A 5-dot visual indicator of a stop's `hidden_gem_score`. The dots are
 * decorative — `aria-hidden` is set on each dot and a single `aria-label`
 * on the container conveys the score to assistive tech.
 */
export function GemBadge({ score }: { score: number }) {
  const s = Math.max(0, Math.min(5, Math.round(score)));
  return (
    <span
      className="inline-flex items-center gap-[3px] align-middle"
      role="img"
      aria-label={`Hidden gem score ${s} out of 5`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          aria-hidden="true"
          className={clsx(
            "block h-2 w-2 rounded-full",
            n <= s ? "bg-accent" : "bg-border"
          )}
        />
      ))}
    </span>
  );
}
