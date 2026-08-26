import { useEffect, useRef, useState } from "react";

/* Demo policyholders matching scripts/seed.js */
const CUSTOMERS = [
  {
    id: "CUS001",
    name: "A. Sharma",
    policies: ["POL1001 · Motor", "POL1002 · Travel"],
    prompts: [
      "Is POL1001 still active?",
      "How many days until POL1002 expires?",
      "What's the premium on POL1001?",
    ],
  },
  {
    id: "CUS002",
    name: "R. Gurung",
    policies: ["POL1003 · Health"],
    prompts: [
      "Is my health policy POL1003 valid?",
      "When did POL1003 expire?",
      "What was the coverage on POL1003?",
    ],
  },
  {
    id: "CUS003",
    name: "M. Tamang",
    policies: ["POL1004 · Pet"],
    prompts: [
      "When does POL1004 end?",
      "What's the coverage amount of POL1004?",
      "Show me POL1004's details",
    ],
  },
];

const timeNow = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

/* Engraved guilloché band — the certificate signature of the page */
function Guilloche() {
  const waves = Array.from({ length: 6 }, (_, i) => {
    const phase = i * 10;
    const amp = 5 + (i % 3) * 2;
    let d = `M -10 14`;
    for (let x = -10; x <= 1210; x += 20) {
      const y = 14 + amp * Math.sin((x + phase * 8) / 34);
      d += ` L ${x} ${y.toFixed(2)}`;
    }
    return <path key={i} d={d} />;
  });
  return (
    <svg
      className="guilloche"
      viewBox="0 0 1200 28"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {waves}
    </svg>
  );
}

function Seal() {
  return (
    <svg className="seal" viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="29" fill="none" strokeWidth="2" />
      <circle cx="32" cy="32" r="22" fill="none" strokeWidth="1" />
      <path id="none" d="M32 14 l5 10 11 2 -8 8 2 11 -10 -5 -10 5 2 -11 -8 -8 11 -2 z" strokeWidth="1.4" fill="none" />
    </svg>
  );
}

function Message({ msg }) {
  if (msg.role === "user") {
    return (
      <div className="row row-user">
        <div className="bubble bubble-user">
          <p>{msg.text}</p>
        </div>
      </div>
    );
  }
  return (
    <div className={`row row-desk ${msg.error ? "is-error" : ""}`}>
      <div className="entry">
        <div className="entry-head">
          <span className="entry-label">
            {msg.error ? "Desk notice" : "Desk reply"}
          </span>
          <span className="entry-time">{msg.time}</span>
        </div>
        <p className="entry-body">{msg.text}</p>
      </div>
    </div>
  );
}

function Typing() {
  return (
    <div className="row row-desk">
      <div className="entry entry-typing" aria-label="The desk is checking records">
        <div className="entry-head">
          <span className="entry-label">Checking records</span>
        </div>
        <div className="dots">
          <i /><i /><i />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [customer, setCustomer] = useState(CUSTOMERS[0]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [online, setOnline] = useState(null);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    fetch("/health")
      .then((r) => setOnline(r.ok))
      .catch(() => setOnline(false));
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  const switchCustomer = (c) => {
    if (c.id === customer.id) return;
    setCustomer(c);
    setMessages([]);
    inputRef.current?.focus();
  };

  async function send(text) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;

    setMessages((m) => [...m, { role: "user", text: trimmed }]);
    setInput("");
    setBusy(true);

    try {
      const res = await fetch("https://insurance.bonto.run/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-customer-id": customer.id },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || `Request failed (${res.status})`);
      }
      setMessages((m) => [...m, { role: "desk", text: data.response, time: timeNow() }]);
    } catch (err) {
      const offline = err instanceof TypeError; // network-level failure
      setMessages((m) => [
        ...m,
        {
          role: "desk",
          error: true,
          time: timeNow(),
          text: offline
            ? "The records office isn't reachable. Start the API (npm run dev in the backend) and try again."
            : `That request couldn't be processed: ${err.message}`,
        },
      ]);
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  return (
    <div className="page">
      <header className="masthead">
        <div className="masthead-inner">
          <div className="masthead-left">
            <Seal />
            <div>
              <p className="eyebrow">Certificate of assistance</p>
              <h1>Policy Desk</h1>
            </div>
          </div>
          <div className={`status ${online === null ? "" : online ? "is-up" : "is-down"}`}>
            <i className="status-dot" />
            {online === null ? "Checking desk…" : online ? "Desk open" : "Desk closed"}
          </div>
        </div>
        <Guilloche />
      </header>

      <main className="sheet">
        <section className="holders" aria-label="Demo policyholders">
          <p className="holders-label">Signed in as</p>
          <div className="holders-tabs" role="tablist">
            {CUSTOMERS.map((c) => (
              <button
                key={c.id}
                role="tab"
                aria-selected={c.id === customer.id}
                className={`holder ${c.id === customer.id ? "is-active" : ""}`}
                onClick={() => switchCustomer(c)}
              >
                <span className="holder-name">{c.name}</span>
                <span className="holder-id">{c.id}</span>
              </button>
            ))}
          </div>
          <p className="holders-policies">
            On record: {customer.policies.join("  ·  ")}
          </p>
        </section>

        <section className="ledger" ref={scrollRef} aria-live="polite">
          {messages.length === 0 && !busy && (
            <div className="empty">
              <p className="empty-title">Ask about a policy on record.</p>
              <p className="empty-sub">
                Each question is answered independently against live records —
                nothing is remembered between questions.
              </p>
              <div className="chips">
                {customer.prompts.map((p) => (
                  <button key={p} className="chip" onClick={() => send(p)}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <Message key={i} msg={m} />
          ))}
          {busy && <Typing />}
        </section>

        <form
          className="composer"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            placeholder={`Ask about ${customer.name.split(" ")[1] ?? customer.id}'s policies…`}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            aria-label="Your question"
          />
          <button type="submit" disabled={busy || !input.trim()}>
            Ask the desk
          </button>
        </form>
      </main>

      <footer className="colophon">
        <span>Answers are verified against policy records — never invented.</span>
        <span className="mono">POST /api/agent · x-customer-id: {customer.id}</span>
      </footer>
    </div>
  );
}
