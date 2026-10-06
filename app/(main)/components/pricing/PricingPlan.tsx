import type { CSSProperties } from "react";
import Image from "next/image";
import { Outfit } from "next/font/google";
import styles from "./PricingPlan.module.css";

const outfit = Outfit({ subsets: ["latin"], display: "swap" });

type Plan = {
  id: string;
  name: string;
  price: number;
  image: string;
  features: string[];
};

const features = [
  "Bandwidth Shared (1:8 Ratio)",
  "Optical Fiber Connection",
  "Connection Charge Free",
  "24/7 Customer Support",
];

const plans: Plan[] = [
  { id: "a1chob1", name: "Bijoy-25 Mbps (Monthly Pac)", price: 500, image: "/img/slide-02.jpg", features },
  { id: "a1cnhob2", name: "Duronto-40 Mbps (Monthly Pac)", price: 600, image: "/img/slide-03.jpg", features },
  { id: "a1chob3", name: "Shadhin-40 Mbps (Monthly Pac)", price: 800, image: "/img/slide-01.jpg", features },
];

const step = (i: number) => ({ "--i": i }) as CSSProperties;

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="size-3"
    >
      <path d="m9 5 7 7-7 7" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-3.5 shrink-0 text-[#ff6600]">
      <path d="m4 12.5 5.5 5.5L20 6.5" />
    </svg>
  );
}

function PlanCard({ plan }: { plan: Plan }) {
  return (
    <article className={styles.card}>
      <div className="flex flex-col items-center gap-6 px-8 py-8 md:flex-row md:justify-between md:px-12">
        <div className="flex flex-col gap-3">
          <div className="relative h-20 w-48 overflow-hidden rounded-2xl">
            <Image src={plan.image} alt={plan.name} fill sizes="192px" className="object-cover" />
          </div>
          <h3 className={`${styles.title} text-lg font-semibold text-[#1c3a1f]`} style={step(4)}>
            {plan.name}
          </h3>
        </div>

        <ul className="space-y-2 text-sm">
          {plan.features.map((f, i) => (
            <li key={f} className={`${styles.feature} flex items-center gap-2 text-neutral-600`} style={step(i)}>
              <CheckIcon />
              {f}
            </li>
          ))}
        </ul>

        <div className="flex size-32 shrink-0 flex-col items-center justify-center rounded-full bg-white">
          <span className="text-4xl font-semibold text-[#ff6600]">৳{plan.price}</span>
          <span className="text-xs font-medium text-neutral-600">/ Month</span>
        </div>

        <button
          type="button"
          className={`${styles.cta} inline-flex items-center gap-2 rounded-md border border-[#ff6600] px-5 py-2 text-sm font-semibold text-[#ff6600]`}
          style={step(2)}
        >
          Choose Plan
          <ArrowIcon />
        </button>
      </div>
    </article>
  );
}

export default function PricingPlans() {
  return (
    <section className={`${styles.section} ${outfit.className} mx-auto w-full max-w-5xl px-4 py-16`}>
      <header className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#ff6600]">
            <span aria-hidden="true" className={styles.badge} />
            Our Best Plan
          </p>
          <h2 className="text-4xl font-bold text-[#1c3a1f] md:text-5xl">
            Find Your{" "}
            <span className="relative inline-block text-[#ff6600]">
              Perfect Plan
              <svg
                viewBox="0 0 200 8"
                preserveAspectRatio="none"
                aria-hidden="true"
                className={styles.underline}
              >
                <path
                  fill="currentColor"
                  d="M0 4.6C0 3 6 2.2 12 1.8 45 .4 90 0 125 0c25 0 55 .6 75 2.2 0 .4-1 .7-2 .8-33 .4-63 1-90 1.7C70 6 40 7.4 12 8 5 8 0 6.8 0 4.6Z"
                />
              </svg>
            </span>
          </h2>
        </div>

        <a href="/services" className={styles.viewAll}>
          View All Service
          <ArrowIcon />
        </a>
      </header>

      <div className="space-y-5">
        {plans.map((plan) => (
          <PlanCard key={plan.id} plan={plan} />
        ))}
      </div>
    </section>
  );
}