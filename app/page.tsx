"use client";

import {
  AlertTriangle,
  BarChart3,
  Check,
  Clipboard,
  LinkIcon,
  Loader2,
  MessageSquareReply,
  Phone,
  Save,
  Send,
  Trophy,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { defaultProofLinks } from "@/lib/proof-links";
import type { OutreachResponse } from "@/lib/schemas";
import { goals, tones } from "@/lib/schemas";

const goalLabels: Record<(typeof goals)[number], string> = {
  job: "Get job interview",
  freelance: "Get freelance call",
  founder_networking: "Founder networking",
  partnership: "Partnership",
  cold_dm: "Cold DM",
};

const toneLabels: Record<(typeof tones)[number], string> = {
  direct: "Direct",
  friendly: "Friendly",
  confident: "Confident",
  technical: "Technical",
};

const sampleOpportunity = `We're hiring an AI engineer to build internal automation workflows for our revenue team. The role needs Next.js, LLM APIs, workflow design, and someone who can turn messy manual processes into reliable tools.`;
const outreachLogKey = "proofping:outreach-log";
const sprintMessageGoal = 100;

type OutreachLogEntry = {
  id: string;
  sentAt: string;
  variantLabel: string;
  companyOrRole: string;
  goal: (typeof goals)[number];
  message: string;
  proofTitle: string;
  specificityScore: number;
  replied: boolean;
  positive: boolean;
  callBooked: boolean;
};

type OutcomeField = "replied" | "positive" | "callBooked";

export default function Home() {
  const [targetText, setTargetText] = useState("");
  const [goal, setGoal] = useState<(typeof goals)[number]>("job");
  const [tone, setTone] = useState<(typeof tones)[number]>("direct");
  const [selectedProof, setSelectedProof] = useState(
    () => new Set(defaultProofLinks.map((link) => link.url)),
  );
  const [result, setResult] = useState<OutreachResponse | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState("");
  const [saved, setSaved] = useState(false);
  const [outreachLog, setOutreachLog] = useState<OutreachLogEntry[]>([]);

  useEffect(() => {
    const storedLog = window.localStorage.getItem(outreachLogKey);
    if (storedLog) {
      setOutreachLog(JSON.parse(storedLog));
    }
  }, []);

  const activeProofLinks = useMemo(
    () => defaultProofLinks.filter((link) => selectedProof.has(link.url)),
    [selectedProof],
  );

  async function generateOutreach() {
    setError("");
    setSaved(false);
    setIsLoading(true);

    try {
      const response = await fetch("/api/generate-outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetText,
          goal,
          tone,
          proofLinks: activeProofLinks,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Could not generate outreach.");
      }

      setResult(data);
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : "Could not generate outreach.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function copyText(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(""), 1400);
  }

  function saveResult() {
    if (!result) return;

    const savedMessages = JSON.parse(
      window.localStorage.getItem("proofping:saved") ?? "[]",
    );

    window.localStorage.setItem(
      "proofping:saved",
      JSON.stringify([
        {
          id: crypto.randomUUID(),
          savedAt: new Date().toISOString(),
          targetText,
          goal,
          tone,
          result,
        },
        ...savedMessages,
      ]),
    );
    setSaved(true);
  }

  function persistOutreachLog(nextLog: OutreachLogEntry[]) {
    setOutreachLog(nextLog);
    window.localStorage.setItem(outreachLogKey, JSON.stringify(nextLog));
  }

  function markVariantSent(messageIndex: number) {
    if (!result) return;

    const message = result.messages[messageIndex];
    const nextLog = [
      {
        id: crypto.randomUUID(),
        sentAt: new Date().toISOString(),
        variantLabel: message.label || `Variant ${messageIndex + 1}`,
        companyOrRole: result.analysis.company_or_role,
        goal,
        message: message.message,
        proofTitle: result.selected_proof.title,
        specificityScore: result.quality_score.specificity_score,
        replied: false,
        positive: false,
        callBooked: false,
      },
      ...outreachLog,
    ];

    persistOutreachLog(nextLog);
  }

  function toggleOutcome(id: string, field: OutcomeField) {
    const nextLog = outreachLog.map((entry) => {
      if (entry.id !== id) {
        return entry;
      }

      const nextEntry = { ...entry, [field]: !entry[field] };
      if (field === "positive" && nextEntry.positive) {
        nextEntry.replied = true;
      }
      if (field === "callBooked" && nextEntry.callBooked) {
        nextEntry.replied = true;
        nextEntry.positive = true;
      }
      if (field === "replied" && !nextEntry.replied) {
        nextEntry.positive = false;
        nextEntry.callBooked = false;
      }

      return nextEntry;
    });

    persistOutreachLog(nextLog);
  }

  function toggleProof(url: string) {
    setSelectedProof((current) => {
      const next = new Set(current);
      if (next.has(url)) {
        next.delete(url);
      } else {
        next.add(url);
      }
      return next;
    });
  }

  const genericRisk = result?.quality_score.generic_risk.toLowerCase() ?? "";
  const shouldWarn =
    genericRisk.includes("medium") ||
    genericRisk.includes("high") ||
    (result?.quality_score.specificity_score ?? 10) < 7;
  const trackerStats = useMemo(() => getTrackerStats(outreachLog), [outreachLog]);

  return (
    <main className="app-shell">
      <section className="brand-panel">
        <div>
          <p className="eyebrow">ProofPing</p>
          <h1>Send specific outreach with proof, not generic AI spam.</h1>
        </div>
        <p className="brand-copy">
          Paste an opportunity, pick your goal, and ProofPing finds the right
          angle, proof link, short message, follow-up, and specificity score.
        </p>
      </section>

      <div className="workspace">
        <section className="input-panel" aria-label="Outreach inputs">
          <div className="field-group">
            <div className="field-header">
              <label htmlFor="targetText">Opportunity</label>
              <button
                className="text-button"
                type="button"
                onClick={() => setTargetText(sampleOpportunity)}
              >
                Use sample
              </button>
            </div>
            <textarea
              id="targetText"
              value={targetText}
              onChange={(event) => setTargetText(event.target.value)}
              placeholder="Paste a job post, company description, founder bio, Upwork gig, startup page, or LinkedIn profile..."
            />
          </div>

          <div className="control-grid">
            <label className="field-group" htmlFor="goal">
              <span>Goal</span>
              <select
                id="goal"
                value={goal}
                onChange={(event) =>
                  setGoal(event.target.value as (typeof goals)[number])
                }
              >
                {goals.map((goalOption) => (
                  <option key={goalOption} value={goalOption}>
                    {goalLabels[goalOption]}
                  </option>
                ))}
              </select>
            </label>

            <label className="field-group" htmlFor="tone">
              <span>Tone</span>
              <select
                id="tone"
                value={tone}
                onChange={(event) =>
                  setTone(event.target.value as (typeof tones)[number])
                }
              >
                {tones.map((toneOption) => (
                  <option key={toneOption} value={toneOption}>
                    {toneLabels[toneOption]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="proof-bank">
            <div className="section-heading">
              <span>Proof links</span>
              <small>{activeProofLinks.length} selected</small>
            </div>
            <div className="proof-list">
              {defaultProofLinks.map((link) => (
                <label className="proof-option" key={link.url}>
                  <input
                    type="checkbox"
                    checked={selectedProof.has(link.url)}
                    onChange={() => toggleProof(link.url)}
                  />
                  <span>
                    <strong>{link.title}</strong>
                    <small>{link.description}</small>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {error ? <p className="error-message">{error}</p> : null}

          <button
            className="primary-button"
            type="button"
            onClick={generateOutreach}
            disabled={isLoading || activeProofLinks.length === 0}
          >
            {isLoading ? <Loader2 className="spin" size={18} /> : <Send size={18} />}
            {isLoading ? "Generating" : "Generate Outreach"}
          </button>
        </section>

        <section className="output-panel" aria-label="Generated outreach">
          {!result ? (
            <div className="empty-state">
              <p className="eyebrow">Output</p>
              <h2>Analysis, proof selection, messages, and quality check land here.</h2>
            </div>
          ) : (
            <>
              {shouldWarn ? (
                <div className="warning">
                  <AlertTriangle size={18} />
                  <p>
                    This may sound generic because the input does not include
                    enough company-specific detail. Add the company mission,
                    current hiring need, founder post, or product page.
                  </p>
                </div>
              ) : null}

              <div className="output-toolbar">
                <div>
                  <p className="eyebrow">Specificity</p>
                  <strong>{result.quality_score.specificity_score}/10</strong>
                </div>
                <button className="icon-button" type="button" onClick={saveResult}>
                  {saved ? <Check size={18} /> : <Save size={18} />}
                  <span>{saved ? "Saved" : "Save"}</span>
                </button>
              </div>

              <ResultSection title="Opportunity Analysis">
                <dl className="analysis-grid">
                  <div>
                    <dt>Company or role</dt>
                    <dd>{result.analysis.company_or_role}</dd>
                  </div>
                  <div>
                    <dt>Likely pain</dt>
                    <dd>{result.analysis.likely_pain}</dd>
                  </div>
                  <div>
                    <dt>Best angle</dt>
                    <dd>{result.analysis.best_angle}</dd>
                  </div>
                  <div>
                    <dt>Needed skills</dt>
                    <dd>{result.analysis.needed_skills.join(", ")}</dd>
                  </div>
                </dl>
              </ResultSection>

              <ResultSection title="Selected Proof Link">
                <a className="proof-link" href={result.selected_proof.url}>
                  <LinkIcon size={16} />
                  <span>{result.selected_proof.title}</span>
                </a>
                <p>{result.selected_proof.reason}</p>
              </ResultSection>

              <ResultSection title="Subject / Opener">
                <CopyBlock
                  text={result.subject_line}
                  copyKey="subject"
                  copiedKey={copiedKey}
                  onCopy={copyText}
                />
              </ResultSection>

              <ResultSection title="Message Variants">
                <div className="message-list">
                  {result.messages.map((message, index) => (
                    <article className="message-card" key={message.label}>
                      <div className="message-header">
                        <div>
                          <strong>{message.label}</strong>
                          <small>{message.best_for}</small>
                        </div>
                        <button
                          className="icon-button"
                          type="button"
                          onClick={() => copyText(message.message, `message-${index}`)}
                        >
                          {copiedKey === `message-${index}` ? (
                            <Check size={16} />
                          ) : (
                            <Clipboard size={16} />
                          )}
                          <span>
                            {copiedKey === `message-${index}` ? "Copied" : "Copy"}
                          </span>
                        </button>
                        <button
                          className="icon-button"
                          type="button"
                          onClick={() => markVariantSent(index)}
                        >
                          <Send size={16} />
                          <span>Sent</span>
                        </button>
                      </div>
                      <p>{message.message}</p>
                    </article>
                  ))}
                </div>
              </ResultSection>

              <ResultSection title="Follow-Up">
                <CopyBlock
                  text={result.follow_up}
                  copyKey="follow-up"
                  copiedKey={copiedKey}
                  onCopy={copyText}
                />
              </ResultSection>

              <ResultSection title="Quality Check">
                <div className="quality-grid">
                  <div>
                    <span>Generic risk</span>
                    <strong>{result.quality_score.generic_risk}</strong>
                  </div>
                  <div>
                    <span>Personalization used</span>
                    <strong>
                      {result.quality_score.personalization_used.join(", ")}
                    </strong>
                  </div>
                  <div>
                    <span>Why this works</span>
                    <strong>{result.quality_score.why_it_works}</strong>
                  </div>
                  <div>
                    <span>Weak points</span>
                    <strong>{result.quality_score.weak_points.join(", ")}</strong>
                  </div>
                </div>
              </ResultSection>
            </>
          )}
        </section>
      </div>

      <section className="tracker-panel" aria-label="Outreach tracker">
        <div className="tracker-header">
          <div>
            <p className="eyebrow">Phase 1</p>
            <h2>Send 100 messages in 14 days.</h2>
          </div>
          <div className="tracker-progress">
            <strong>{trackerStats.messagesSent}/{sprintMessageGoal}</strong>
            <span>messages sent</span>
          </div>
        </div>

        <div className="progress-track" aria-hidden="true">
          <span
            style={{
              width: `${Math.min(
                (trackerStats.messagesSent / sprintMessageGoal) * 100,
                100,
              )}%`,
            }}
          />
        </div>

        <div className="metric-grid">
          <Metric icon={<Send size={18} />} label="Messages sent" value={trackerStats.messagesSent} />
          <Metric icon={<MessageSquareReply size={18} />} label="Replies" value={trackerStats.replies} />
          <Metric icon={<Trophy size={18} />} label="Positive replies" value={trackerStats.positiveReplies} />
          <Metric icon={<Phone size={18} />} label="Calls booked" value={trackerStats.callsBooked} />
          <Metric icon={<BarChart3 size={18} />} label="Reply rate" value={`${trackerStats.replyRate}%`} />
          <Metric icon={<BarChart3 size={18} />} label="Meeting rate" value={`${trackerStats.meetingRate}%`} />
        </div>

        <div className="tracker-grid">
          <section className="tracker-card">
            <div className="section-heading">
              <span>Variant performance</span>
              <small>Best and worst signal</small>
            </div>
            {trackerStats.variantRows.length === 0 ? (
              <p className="muted-copy">Mark a generated message as sent to start tracking.</p>
            ) : (
              <div className="variant-list">
                {trackerStats.variantRows.map((variant) => (
                  <div className="variant-row" key={variant.label}>
                    <strong>{variant.label}</strong>
                    <span>
                      {variant.sent} sent, {variant.replies} replies, {variant.callsBooked} calls
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div className="best-worst">
              <p>
                <span>Best performing variant</span>
                <strong>{trackerStats.bestVariant}</strong>
              </p>
              <p>
                <span>Worst performing variant</span>
                <strong>{trackerStats.worstVariant}</strong>
              </p>
            </div>
          </section>

          <section className="tracker-card">
            <div className="section-heading">
              <span>Recent sends</span>
              <small>Update outcomes manually</small>
            </div>
            {outreachLog.length === 0 ? (
              <p className="muted-copy">No messages sent yet.</p>
            ) : (
              <div className="send-list">
                {outreachLog.slice(0, 8).map((entry) => (
                  <article className="send-row" key={entry.id}>
                    <div>
                      <strong>{entry.companyOrRole}</strong>
                      <span>
                        {entry.variantLabel} · {goalLabels[entry.goal]} ·{" "}
                        {new Date(entry.sentAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="outcome-controls">
                      <label>
                        <input
                          type="checkbox"
                          checked={entry.replied}
                          onChange={() => toggleOutcome(entry.id, "replied")}
                        />
                        Reply
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          checked={entry.positive}
                          onChange={() => toggleOutcome(entry.id, "positive")}
                        />
                        Positive
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          checked={entry.callBooked}
                          onChange={() => toggleOutcome(entry.id, "callBooked")}
                        />
                        Call
                      </label>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

function getTrackerStats(outreachLog: OutreachLogEntry[]) {
  const messagesSent = outreachLog.length;
  const replies = outreachLog.filter((entry) => entry.replied).length;
  const positiveReplies = outreachLog.filter((entry) => entry.positive).length;
  const callsBooked = outreachLog.filter((entry) => entry.callBooked).length;
  const replyRate = messagesSent ? Math.round((replies / messagesSent) * 100) : 0;
  const meetingRate = messagesSent
    ? Math.round((callsBooked / messagesSent) * 100)
    : 0;
  const variantMap = new Map<
    string,
    { label: string; sent: number; replies: number; positiveReplies: number; callsBooked: number }
  >();

  for (const entry of outreachLog) {
    const current = variantMap.get(entry.variantLabel) ?? {
      label: entry.variantLabel,
      sent: 0,
      replies: 0,
      positiveReplies: 0,
      callsBooked: 0,
    };

    current.sent += 1;
    current.replies += entry.replied ? 1 : 0;
    current.positiveReplies += entry.positive ? 1 : 0;
    current.callsBooked += entry.callBooked ? 1 : 0;
    variantMap.set(entry.variantLabel, current);
  }

  const variantRows = Array.from(variantMap.values()).sort((a, b) => {
    const scoreA = a.callsBooked * 3 + a.positiveReplies * 2 + a.replies;
    const scoreB = b.callsBooked * 3 + b.positiveReplies * 2 + b.replies;
    return scoreB - scoreA || b.sent - a.sent;
  });
  const bestVariant = variantRows[0]?.label ?? "Not enough data yet";
  const worstVariant = variantRows.at(-1)?.label ?? "Not enough data yet";

  return {
    messagesSent,
    replies,
    positiveReplies,
    callsBooked,
    replyRate,
    meetingRate,
    variantRows,
    bestVariant,
    worstVariant,
  };
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="metric-card">
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ResultSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="result-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function CopyBlock({
  text,
  copyKey,
  copiedKey,
  onCopy,
}: {
  text: string;
  copyKey: string;
  copiedKey: string;
  onCopy: (text: string, key: string) => void;
}) {
  const copied = copiedKey === copyKey;

  return (
    <div className="copy-block">
      <p>{text}</p>
      <button className="icon-button" type="button" onClick={() => onCopy(text, copyKey)}>
        {copied ? <Check size={16} /> : <Clipboard size={16} />}
        <span>{copied ? "Copied" : "Copy"}</span>
      </button>
    </div>
  );
}
