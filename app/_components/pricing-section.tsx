import Link from "next/link";
import { Check } from "lucide-react";

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
  },
];

export function PricingSection() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-28">
      <div className="mb-14 text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Simple pricing
        </h2>
        <p className="mt-3 text-white/50">
          Start for free. Scale as you grow.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        {PLANS.map((p) => (
          <div
            key={p.plan}
            className={`relative rounded-2xl border p-8 ${
              p.highlight
                ? "border-violet-500/50 bg-gradient-to-b from-violet-950/60 to-violet-900/20 shadow-xl shadow-violet-900/30"
                : "border-white/8 bg-white/3"
            }`}
          >
            {p.highlight && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-violet-600 px-3 py-0.5 text-xs font-semibold text-white">
                Most Popular
              </span>
            )}
            <p className="text-sm font-medium text-white/60">{p.plan}</p>
            <p className="mt-2 text-4xl font-bold">
              {p.price}
              <span className="text-base font-normal text-white/40">
                {p.period}
              </span>
            </p>
            <ul className="mt-7 space-y-3">
              {p.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 flex-shrink-0 text-violet-400" />
                  <span className="text-white/70">{f}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/dashboard"
              className={`mt-8 block w-full rounded-xl py-3 text-center text-sm font-semibold transition-all ${
                p.highlight
                  ? "bg-violet-600 text-white hover:bg-violet-500"
                  : "border border-white/10 text-white/70 hover:border-white/20 hover:text-white"
              }`}
            >
              {p.plan === "Enterprise" ? "Contact Us" : "Get Started"}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

