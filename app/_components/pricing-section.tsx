import Link from "next/link";
import { Check, Sparkles } from "lucide-react";

const PLANS = [
  {
    plan: "Free",
    price: "$0",
    period: "forever",
    highlight: false,
    features: [
      "3 contract analyses",
      "Risk score",
      "Pros & cons",
      "Chat (10 messages)",
    ],
    cta: "Get Started",
    ctaHref: "/dashboard",
  },
  {
    plan: "Pro",
    price: "$19",
    period: "/ month",
    highlight: true,
    features: [
      "Unlimited analyses",
      "Priority processing",
      "Full chat history",
      "Export reports",
      "Email support",
    ],
    cta: "Get Started",
    ctaHref: "/dashboard",
  },
  {
    plan: "Enterprise",
    price: "Custom",
    period: "",
    highlight: false,
    features: [
      "Everything in Pro",
      "Team accounts",
      "API access",
      "Custom integrations",
      "Dedicated support",
    ],
    cta: "Contact Us",
    ctaHref: "/dashboard",
  },
];

export function PricingSection() {
  return (
    <section className="relative overflow-hidden px-6 py-28">

      {/* ── Background legal art (subtle SVG) ── */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.025]"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Gavel head */}
        <rect x="62%" y="8%" width="140" height="36" rx="8" fill="none" stroke="white" strokeWidth="2.5" />
        <rect x="66%" y="8%" width="56" height="36" rx="4" fill="none" stroke="white" strokeWidth="1.5" />
        {/* Gavel handle */}
        <line x1="68%" y1="44%" x2="72%" y2="78%" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        {/* Legal scales */}
        <line x1="15%" y1="20%" x2="15%" y2="70%" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <line x1="8%"  y1="25%" x2="22%" y2="25%" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <line x1="8%"  y1="25%" x2="8%"  y2="45%" stroke="white" strokeWidth="1.5" />
        <line x1="22%" y1="25%" x2="22%" y2="40%" stroke="white" strokeWidth="1.5" />
        <ellipse cx="8%"  cy="47%" rx="4%" ry="2.5%" fill="none" stroke="white" strokeWidth="1.5" />
        <ellipse cx="22%" cy="42%" rx="4%" ry="2.5%" fill="none" stroke="white" strokeWidth="1.5" />
        {/* Document outline */}
        <rect x="42%" y="60%" width="110" height="140" rx="6" fill="none" stroke="white" strokeWidth="2" />
        <line x1="44%" y1="70%" x2="52%" y2="70%" stroke="white" strokeWidth="1.5" />
        <line x1="44%" y1="75%" x2="50%" y2="75%" stroke="white" strokeWidth="1" />
        <line x1="44%" y1="80%" x2="52%" y2="80%" stroke="white" strokeWidth="1" />
        {/* Handshake curves */}
        <path d="M 60 580 Q 180 520 300 580 Q 420 640 540 580" fill="none" stroke="white" strokeWidth="2" />
        <path d="M 60 610 Q 180 550 300 610 Q 420 670 540 610" fill="none" stroke="white" strokeWidth="1.5" />
      </svg>

      {/* Background glow for Pro area */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-700/[0.12] blur-[130px]"
      />

      <div className="relative mx-auto max-w-6xl">

        {/* ── Heading ── */}
        <div className="mb-16 text-center">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-500/8 px-4 py-1 text-xs font-medium text-violet-400">
            <Sparkles className="h-3 w-3" />
            Transparent pricing
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Simple pricing
          </h2>
          <p className="mt-3 text-white/45">Start for free. Scale as you grow.</p>
        </div>

        {/* ── Cards ── */}
        {/* On desktop: sm:grid-cols-3 with the Pro card scaled up via wrapper margin trick */}
        <div className="grid gap-6 sm:grid-cols-3 sm:items-center">
          {PLANS.map((p) => (
            <div
              key={p.plan}
              className={
                p.highlight
                  ? "relative sm:-my-4" // gives the Pro card extra vertical room
                  : "relative"
              }
            >
              {/* "Most Popular" badge */}
              {p.highlight && (
                <div className="absolute -top-4 inset-x-0 flex justify-center z-10">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-4 py-1 text-xs font-semibold text-white shadow-lg shadow-violet-900/50">
                    <Sparkles className="h-3 w-3" />
                    Most Popular
                  </span>
                </div>
              )}

              <div
                className={`relative overflow-hidden rounded-2xl border p-8 transition-all
                  ${p.highlight
                    ? "animate-glow-pulse border-violet-500/60 bg-gradient-to-b from-violet-950/70 via-violet-900/30 to-[#0d0c14] pt-12 shadow-2xl"
                    : "border-white/8 bg-white/[0.025] hover:border-white/15"
                  }`}
              >

                {/* Inner top corner glow for Pro */}
                {p.highlight && (
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -top-10 left-1/2 h-36 w-60 -translate-x-1/2 rounded-full bg-violet-500/30 blur-[50px]"
                  />
                )}

                {/* Plan name */}
                <p className={`text-sm font-semibold ${p.highlight ? "text-violet-300" : "text-white/50"}`}>
                  {p.plan}
                </p>

                {/* Price */}
                <div className="mt-3 flex items-end gap-1">
                  <span
                    className={`font-bold leading-none tracking-tight ${
                      p.highlight ? "text-6xl text-white" : "text-5xl text-white/90"
                    }`}
                  >
                    {p.price}
                  </span>
                  {p.period && (
                    <span className="mb-1.5 text-sm text-white/35">{p.period}</span>
                  )}
                </div>

                {/* Divider */}
                <div
                  className={`mt-7 mb-6 h-px w-full rounded-full ${
                    p.highlight
                      ? "bg-gradient-to-r from-transparent via-violet-500/40 to-transparent"
                      : "bg-white/[0.07]"
                  }`}
                />

                {/* Features */}
                <ul className="space-y-3.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm">
                      {p.highlight ? (
                        /* Glowing checkmark for Pro */
                        <span className="relative flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-violet-500/40 bg-violet-500/15">
                          <Check className="h-3 w-3 text-violet-300" strokeWidth={2.5} />
                          <span
                            aria-hidden
                            className="absolute inset-0 rounded-full"
                            style={{ boxShadow: "0 0 6px 1px rgba(139,92,246,0.45)" }}
                          />
                        </span>
                      ) : (
                        <Check className="h-4 w-4 flex-shrink-0 text-violet-400/60" />
                      )}
                      <span className={p.highlight ? "text-white/80" : "text-white/55"}>
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA button */}
                <Link
                  href={p.ctaHref}
                  className={`mt-8 block w-full rounded-xl py-3.5 text-center text-sm font-semibold transition-all active:scale-95
                    ${p.highlight
                      ? "bg-violet-600 text-white shadow-lg shadow-violet-900/50 hover:bg-violet-500 hover:shadow-violet-700/60"
                      : "border border-white/10 text-white/60 hover:border-white/20 hover:text-white/80"
                    }`}
                >
                  {p.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <p className="mt-10 text-center text-xs text-white/25">
          All plans include end-to-end encryption. No contracts, cancel anytime.
        </p>
      </div>
    </section>
  );
}
