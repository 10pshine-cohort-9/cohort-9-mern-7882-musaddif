import { useState } from "react";
import {
  Activity,
  BatteryCharging,
  Check,
  ChevronDown,
  CircleAlert,
  Gauge,
  Headphones,
  Heart,
  Leaf,
  Lock,
  Menu,
  Minus,
  Package,
  Plug,
  RefreshCw,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Star,
  Thermometer,
  Timer,
  Truck,
  Volume2,
  Waves,
  X,
  Zap,
} from "lucide-react";
import "./calminityLanding.css";

const NAV_LINKS = [
  { href: "#benefits", label: "Benefits" },
  { href: "#specs", label: "Specs" },
  { href: "#reviews", label: "Reviews" },
  { href: "#faq", label: "FAQ" },
];

const BENEFITS = [
  {
    title: "Entrainment Effect: Your Body Knows How to Heal Itself",
    body: "Your body already runs on rhythm. When it is exposed to a matching frequency its cells gently entrain to that beat, the same way a tuning fork settles onto the pitch of another note. Nothing is swallowed, nothing is forced and nothing needs to be believed in for the signal to land. Fifteen quiet minutes is the entire daily practice.",
  },
  {
    title: "Every Cell in Your Body Has Its Own Resonant Frequency",
    body: "From the beat of your heart to the firing of your neurons, living tissue vibrates. The Solfeggio tones and the Schumann resonance of the Earth sit in the ranges where the body does its deepest repair work, so you can support the places that plain silence never reaches.",
  },
  {
    title: "Supporting Research & Biological Effects",
    body: "Frequency therapy sits alongside a growing body of research into how vibration influences the nervous system, circulation and sleep quality. The ladder below maps the emotional regions practitioners associate with each tone, so you can choose the frequency that matches how you feel today.",
    ladder: true,
  },
  {
    title: "Relaxing Sounds vs Real Frequencies: What's the Difference?",
    body: "Most relaxation devices simply play back a recording, which your ears pick apart and your body filters away. A true frequency generator produces a mathematically pure tone at an exact hertz value and holds it steady for the whole session, so you receive the signal instead of the noise.",
  },
  {
    title: "Solfeggio & Schumann: The Most Potent Healing Frequencies",
    body: "Every classical Solfeggio tone and the 7.83 Hz pulse of the Earth is pre-loaded and cycled for you, alongside binaural beats and a custom dial for anything else.",
    solfeggio: true,
  },
];

const LADDER = [
  { label: "Enlightenment", hz: 700 },
  { label: "Joy", hz: 600 },
  { label: "Reason", hz: 540 },
  { label: "Acceptance", hz: 500 },
  { label: "Willingness", hz: 400 },
  { label: "Neutrality", hz: 230 },
  { label: "Courage", hz: 200 },
  { label: "Pride", hz: 175 },
  { label: "Anger", hz: 175 },
  { label: "Desire", hz: 100 },
  { label: "Guilt", hz: 75 },
  { label: "Apathy", hz: 50 },
  { label: "Shame", hz: 30 },
];

const SOLFEGGIO = [
  { hz: "174 Hz", note: "Eases pain and supports natural healing" },
  { hz: "285 Hz", note: "Releases tension and eases guilt" },
  { hz: "396 Hz", note: "Encourages healing and emotional balance" },
  { hz: "417 Hz", note: "Clears guilt and releases heavy situations" },
  { hz: "528 Hz", note: "Supports DNA regeneration" },
  { hz: "639 Hz", note: "Strengthens relationships and immune response" },
  { hz: "741 Hz", note: "Cleanses and elevates the body" },
  { hz: "852 Hz", note: "Restores intuition and natural order" },
  { hz: "963 Hz", note: "Deepens connection to higher awareness" },
  { hz: "7.83 Hz", note: "Schumann resonance — the pulse of the Earth" },
];

const BADGES = [
  {
    icon: RefreshCw,
    title: "30-Day Money-Back",
    text: "Try it for a full month. If you do not feel the difference, send it back for a full refund.",
  },
  {
    icon: Truck,
    title: "Free UK Delivery",
    text: "Dispatched within 24 hours and delivered to your door in 2–3 working days.",
  },
  {
    icon: ShieldCheck,
    title: "2-Year Warranty",
    text: "Every unit is covered for two years, with lifetime access to new programs.",
  },
];

const SPECS = [
  { icon: Waves, label: "Frequency range", value: "1 Hz – 20,000 Hz" },
  { icon: Sparkles, label: "Preset programs", value: "9 Solfeggio tones + 7.83 Hz Schumann" },
  { icon: Volume2, label: "Output power", value: "200 mW at 32 Ω" },
  { icon: Timer, label: "Session length", value: "15, 30 or 60 minutes" },
  { icon: BatteryCharging, label: "Power source", value: "4,000 mAh battery, USB-C charging" },
  { icon: Plug, label: "Charging time", value: "2 hours for a full charge" },
  { icon: Thermometer, label: "Working temperature", value: "0 °C to 40 °C" },
  { icon: Gauge, label: "Device weight", value: "320 g" },
  { icon: Smartphone, label: "Connectivity", value: "Bluetooth 5.3 and 3.5 mm jack" },
  { icon: Headphones, label: "Headphones", value: "Premium wired pair included" },
];

const WHY_CHOOSE = [
  {
    icon: Activity,
    title: "Pure tones, not recordings",
    text: "Every session is generated live at an exact hertz value and held stable for the full duration.",
  },
  {
    icon: Heart,
    title: "15 minutes is enough",
    text: "One short daily session replaces the hours most people spend trying to wind down.",
  },
  {
    icon: Zap,
    title: "Set it and forget it",
    text: "Pick a program, press play and put the device down. It switches off on its own.",
  },
  {
    icon: Leaf,
    title: "Nothing added to your body",
    text: "No supplements, no ingestibles, no chemicals. Just sound and silence.",
  },
];

const COMPARISON = [
  { feature: "Exact Solfeggio hertz values", calminity: true, others: false },
  { feature: "9 pre-loaded programs", calminity: true, others: false },
  { feature: "Pure tone held stable all session", calminity: true, others: false },
  { feature: "Works without a phone", calminity: true, others: false },
  { feature: "USB-C rechargeable battery", calminity: true, others: false },
  { feature: "2-year warranty included", calminity: true, others: false },
];

const REVIEWS = [
  {
    name: "Sarah M.",
    date: "March 2024",
    stars: 5,
    text: "I use it every evening while I wind down. After a fortnight my sleep is the deepest it has been in years, and the build quality is far better than I expected for the price.",
  },
  {
    name: "James R.",
    date: "February 2024",
    stars: 5,
    text: "Sceptical at first, but the difference between this and a normal sound machine is obvious. The tones stay perfectly steady instead of looping the same recording.",
  },
  {
    name: "Priya K.",
    date: "January 2024",
    stars: 4,
    text: "The 528 Hz program has become part of my morning routine and the battery genuinely lasts for days. Delivery was quick and the case is sturdy enough to travel with.",
  },
];

const FAQS = [
  {
    question: "Do I need any experience to use it?",
    answer: "None at all. Choose a program, press play and listen. The device walks you through the frequency, the length and the volume on the screen, and it stops on its own when your session ends.",
  },
  {
    question: "How long does the battery last?",
    answer: "Around 20 hours of playback at moderate volume, which is roughly a week of daily 15-minute sessions. It recharges over USB-C in about two hours.",
  },
  {
    question: "Can I use it while working or commuting?",
    answer: "Yes. Use the 3.5 mm jack with any headphones, or pair it over Bluetooth. It works without a phone, so it is equally at home on your desk or in your bag.",
  },
  {
    question: "What if it is not for me?",
    answer: "You have 30 days to try it. If you do not feel the difference, send it back for a full refund — you only cover the postage.",
  },
];

function Stars({ value = 5, size = 14 }) {
  return (
    <span className="cal-stars" aria-hidden="true">
      {Array.from({ length: value }, (_, index) => (
        <Star key={index} size={size} fill="currentColor" />
      ))}
    </span>
  );
}

function ProductVisual() {
  return (
    <svg
      className="cal-product-art"
      viewBox="0 0 320 220"
      role="img"
      aria-label="Calminity bio-healing frequency generator"
    >
      <defs>
        <linearGradient id="calBody" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0a2b23" />
          <stop offset="55%" stopColor="#00603c" />
          <stop offset="100%" stopColor="#004a2e" />
        </linearGradient>
        <linearGradient id="calScreen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e7f7ec" />
          <stop offset="100%" stopColor="#c9ecda" />
        </linearGradient>
      </defs>
      <ellipse cx="160" cy="196" rx="104" ry="12" fill="#001824" opacity="0.08" />
      <rect x="72" y="24" width="176" height="168" rx="26" fill="url(#calBody)" />
      <rect x="84" y="36" width="152" height="144" rx="18" fill="#ffffff" opacity="0.06" />
      <rect x="96" y="52" width="128" height="72" rx="12" fill="url(#calScreen)" />
      <path
        d="M108 104c8-22 16 22 24 0s16-22 24 0 16 22 24 0 16-22 24 0 12 10 12 10"
        fill="none"
        stroke="#00603c"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="160" cy="152" r="20" fill="#fcc00c" />
      <circle cx="160" cy="152" r="20" fill="none" stroke="#001824" strokeWidth="2" opacity="0.15" />
      <line x1="160" y1="152" x2="160" y2="140" stroke="#001824" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="132" y="182" width="56" height="6" rx="3" fill="#ffffff" opacity="0.35" />
    </svg>
  );
}

function CalminityLanding() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openBenefit, setOpenBenefit] = useState(0);
  const [openFaq, setOpenFaq] = useState(0);
  const [orderState, setOrderState] = useState(null);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  };

  const handleAvailability = () => scrollTo("cal-buy");
  const handleBuy = () => {
    setOrderState("order");
    scrollTo("cal-buy");
  };
  const handleAddToCart = () => setOrderState("cart");

  return (
    <div className="cal-shell" id="top">
      <header className="cal-header">
        <div className="cal-header-inner">
          <a className="cal-brand" href="#top">
            <span className="cal-brand-mark">
              <Waves size={17} />
            </span>
            Calminity
          </a>
          <nav className={`cal-nav${menuOpen ? " is-open" : ""}`} id="cal-nav" aria-label="Sections">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>
                {link.label}
              </a>
            ))}
          </nav>
          <div className="cal-header-actions">
            <button type="button" className="cal-btn cal-btn-buy cal-btn-sm" onClick={handleBuy}>
              Buy Now
            </button>
            <button
              type="button"
              className="cal-menu-toggle"
              aria-expanded={menuOpen}
              aria-controls="cal-nav"
              aria-label="Toggle navigation"
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </header>

      <main className="cal-main">
        <div className="cal-copy">
          <p className="cal-eyebrow">Natural Wellness · Science-Inspired · Loved by 1,200+ People</p>
          <p className="cal-rating" aria-label="Rated 4.6 out of 5 from more than 1,200 reviews">
            <Stars />
            <strong>4.6/5</strong>
            <span>1,200+ reviews</span>
          </p>
          <h1 className="cal-title">
            5 Hidden Benefits of Frequency Healing — Could this be the natural solution your body
            has been waiting for?
          </h1>
          <p className="cal-lead">
            Discover how just 15 minutes a day with revolutionary sound therapy can transform your
            health and wellbeing — no hefty price tag and no complicated setup.
          </p>
          <p className="cal-updated">Last updated: April 2024</p>
          <div className="cal-cta-row">
            <button type="button" className="cal-btn cal-btn-buy" onClick={handleAvailability}>
              Check Availability
              <span className="cal-off">| 42% OFF</span>
            </button>
            <p className="cal-cta-hint">
              <CircleAlert size={15} />
              37 units left at this price
            </p>
          </div>

          <section className="cal-benefits" id="benefits" aria-label="Benefits of frequency healing">
            {BENEFITS.map((benefit, index) => {
              const isOpen = openBenefit === index;
              const panelId = `cal-benefit-panel-${index}`;
              const buttonId = `cal-benefit-button-${index}`;
              return (
                <article className={`cal-accordion${isOpen ? " is-open" : ""}`} key={benefit.title}>
                  <h2 className="cal-accordion-heading">
                    <button
                      type="button"
                      id={buttonId}
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => setOpenBenefit(isOpen ? -1 : index)}
                    >
                      {benefit.title}
                      <ChevronDown size={18} className="cal-chevron" />
                    </button>
                  </h2>
                  {isOpen && (
                    <div className="cal-accordion-panel" id={panelId} role="region" aria-labelledby={buttonId}>
                      <p>{benefit.body}</p>
                      {benefit.ladder && (
                        <div className="cal-ladder">
                          <div className="cal-ladder-head">
                            <span>EMOTION</span>
                            <span>FREQUENCY</span>
                          </div>
                          {LADDER.map((row) => (
                            <div className="cal-ladder-row" key={row.label}>
                              <span className="cal-ladder-label">{row.label}</span>
                              <span className="cal-ladder-bar">
                                <span className="cal-ladder-fill" style={{ width: `${(row.hz / 700) * 100}%` }} />
                              </span>
                              <span className="cal-ladder-hz">{row.hz}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {benefit.solfeggio && (
                        <ul className="cal-solfeggio">
                          {SOLFEGGIO.map((tone) => (
                            <li key={tone.hz}>
                              <span className="cal-tone-hz">{tone.hz}</span>
                              <span className="cal-tone-note">{tone.note}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </section>

          <section className="cal-badges" aria-label="Purchase guarantees">
            {BADGES.map((badge) => {
              const Icon = badge.icon;
              return (
                <div className="cal-badge" key={badge.title}>
                  <span className="cal-badge-icon">
                    <Icon size={18} />
                  </span>
                  <div>
                    <h3>{badge.title}</h3>
                    <p>{badge.text}</p>
                  </div>
                </div>
              );
            })}
          </section>

          <p className="cal-note">
            Calminity is a wellness device and not a medical treatment. If you are pregnant, managing
            a medical condition or taking prescribed medication, speak to your doctor before use.
          </p>
        </div>

        <aside className="cal-aside" aria-label="Order Calminity">
          <section className="cal-card cal-buy-card" id="cal-buy" aria-labelledby="cal-buy-title">
            <div className="cal-product">
              <ProductVisual />
              <span className="cal-badge-off">42% OFF</span>
            </div>
            <h2 id="cal-buy-title" className="cal-buy-title">
              Bio-Healing Frequency Generator — The Natural Solution Your Body Has Been Waiting For
            </h2>
            <p className="cal-rating">
              <Stars />
              <strong>4.6/5</strong>
              <span>1,200+ reviews</span>
            </p>
            <p className="cal-price">
              <strong>£59.95</strong>
              <s>£104.95</s>
              <span className="cal-save">You save £45.00</span>
            </p>
            <p className="cal-stock">
              <CircleAlert size={15} />
              Only 37 units left in stock
            </p>
            <button type="button" className="cal-btn cal-btn-buy cal-btn-block" onClick={handleBuy}>
              Buy Now — £59.95
            </button>
            <button type="button" className="cal-btn cal-btn-cart cal-btn-block" onClick={handleAddToCart}>
              <ShoppingCart size={16} />
              Add to Cart
            </button>
            {orderState && (
              <p className="cal-order-note" role="status">
                {orderState === "cart"
                  ? "Added to cart — 1 × Calminity generator, £59.95."
                  : "Order started — secure checkout opens next."}
              </p>
            )}
            <p className="cal-delivery">
              <Truck size={15} />
              Free delivery
              <Package size={15} />
              30-day returns
              <Lock size={14} />
              Secure checkout
            </p>

            <div className="cal-included">
              <h3>What is included</h3>
              <ul>
                <li>
                  <Check size={15} />
                  1 × Calminity frequency generator
                </li>
                <li>
                  <Check size={15} />
                  1 × premium carrying case
                </li>
                <li>
                  <Check size={15} />
                  1 × USB-C charging cable
                </li>
                <li>
                  <Check size={15} />
                  1 × pair of wired headphones
                </li>
                <li>
                  <Check size={15} />
                  Lifetime access to all 9 Solfeggio programs
                </li>
              </ul>
            </div>
          </section>

          <section className="cal-card" id="specs" aria-labelledby="cal-specs-title">
            <h2 id="cal-specs-title" className="cal-card-title">
              Specifications
            </h2>
            <dl className="cal-specs">
              {SPECS.map((spec) => {
                const Icon = spec.icon;
                return (
                  <div className="cal-spec-row" key={spec.label}>
                    <dt>
                      <Icon size={16} />
                      {spec.label}
                    </dt>
                    <dd>{spec.value}</dd>
                  </div>
                );
              })}
            </dl>
          </section>

          <section className="cal-card" aria-labelledby="cal-why-title">
            <h2 id="cal-why-title" className="cal-card-title">
              Why choose Calminity
            </h2>
            <ul className="cal-why">
              {WHY_CHOOSE.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.title}>
                    <span className="cal-why-icon">
                      <Icon size={16} />
                    </span>
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.text}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="cal-card" aria-labelledby="cal-compare-title">
            <h2 id="cal-compare-title" className="cal-card-title">
              Calminity vs. other devices
            </h2>
            <table className="cal-table">
              <thead>
                <tr>
                  <th scope="col">Feature</th>
                  <th scope="col">Calminity</th>
                  <th scope="col">Others</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row) => (
                  <tr key={row.feature}>
                    <th scope="row">{row.feature}</th>
                    <td className="cal-table-yes">
                      <Check size={15} aria-label="Included" />
                    </td>
                    <td className="cal-table-no">
                      <Minus size={15} aria-label="Not included" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="cal-card" id="reviews" aria-labelledby="cal-reviews-title">
            <h2 id="cal-reviews-title" className="cal-card-title">
              What customers say
            </h2>
            <p className="cal-review-summary">
              <Stars size={16} />
              <strong>4.6/5</strong>
              <span>from 1,200+ verified reviews</span>
            </p>
            {REVIEWS.map((review) => (
              <figure className="cal-review" key={review.name}>
                <Stars value={review.stars} />
                <blockquote>
                  <p>{review.text}</p>
                </blockquote>
                <figcaption>
                  {review.name} · {review.date}
                </figcaption>
              </figure>
            ))}
          </section>

          <section className="cal-card" id="faq" aria-labelledby="cal-faq-title">
            <h2 id="cal-faq-title" className="cal-card-title">
              Frequently asked questions
            </h2>
            {FAQS.map((faq, index) => {
              const isOpen = openFaq === index;
              const panelId = `cal-faq-panel-${index}`;
              const buttonId = `cal-faq-button-${index}`;
              return (
                <div className={`cal-accordion cal-accordion-sm${isOpen ? " is-open" : ""}`} key={faq.question}>
                  <h3 className="cal-accordion-heading">
                    <button
                      type="button"
                      id={buttonId}
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => setOpenFaq(isOpen ? -1 : index)}
                    >
                      {faq.question}
                      <ChevronDown size={16} className="cal-chevron" />
                    </button>
                  </h3>
                  {isOpen && (
                    <div className="cal-accordion-panel" id={panelId} role="region" aria-labelledby={buttonId}>
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        </aside>
      </main>

      <div className="cal-sticky" role="region" aria-label="Quick purchase">
        <div className="cal-sticky-inner">
          <p className="cal-sticky-price">
            <strong>£59.95</strong>
            <s>£104.95</s>
          </p>
          <p className="cal-stock cal-stock-sm">
            <CircleAlert size={14} />
            Only 37 left
          </p>
          <div className="cal-sticky-actions">
            <button type="button" className="cal-btn cal-btn-ghost" onClick={handleAvailability}>
              Check Availability
            </button>
            <button type="button" className="cal-btn cal-btn-buy" onClick={handleBuy}>
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CalminityLanding;
