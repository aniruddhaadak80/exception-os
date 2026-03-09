"use client";

import { startTransition, useEffect, useState } from "react";
import { DashboardSnapshot, DecisionBrief, ExceptionRecord, Signal } from "@/lib/types";

const sourceAccent: Record<string, string> = {
  GitHub: "source-github",
  Support: "source-support",
  Revenue: "source-revenue",
  Calendar: "source-calendar",
  Docs: "source-docs",
};

const metricFormatter = new Intl.NumberFormat("en-US");

async function getSnapshot(path: string, init?: RequestInit): Promise<DashboardSnapshot> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error("Unable to load dashboard data.");
  }

  return response.json() as Promise<DashboardSnapshot>;
}

function findDecision(snapshot: DashboardSnapshot, exceptionId: string): DecisionBrief | undefined {
  return snapshot.decisions.find((item) => item.exceptionId === exceptionId);
}

export function ExceptionOsApp() {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [selectedExceptionId, setSelectedExceptionId] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    getSnapshot("/api/dashboard")
      .then((data) => {
        if (!isMounted) {
          return;
        }

        setSnapshot(data);
        setSelectedExceptionId(data.exceptions[0]?.id ?? null);
      })
      .catch((loadError: unknown) => {
        if (!isMounted) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Unknown error.");
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSimulate = () => {
    setIsPending(true);
    setError(null);

    startTransition(() => {
      getSnapshot("/api/simulate", { method: "POST", body: JSON.stringify({ mode: "incident" }) })
        .then((data) => {
          setSnapshot(data);
          setSelectedExceptionId(data.exceptions[0]?.id ?? null);
        })
        .catch((loadError: unknown) => {
          setError(loadError instanceof Error ? loadError.message : "Unknown error.");
        })
        .finally(() => {
          setIsPending(false);
        });
    });
  };

  if (error) {
    return <div className="state-panel">{error}</div>;
  }

  if (!snapshot) {
    return <div className="state-panel">Loading Exception OS...</div>;
  }

  const selectedException = snapshot.exceptions.find((item) => item.id === selectedExceptionId) ?? snapshot.exceptions[0];
  const selectedDecision = selectedException ? findDecision(snapshot, selectedException.id) : undefined;

  return (
    <main className="shell">
      <section className="hero-card">
        <div>
          <p className="eyebrow">Notion MCP challenge concept</p>
          <h1>Exception OS</h1>
          <p className="hero-copy">
            An operating system for teams that need fewer dashboards and faster decisions. Exception OS watches cross-functional
            signals, escalates only the issues that require judgment, and drafts a decision brief for human approval.
          </p>
        </div>
        <div className="hero-actions">
          <button className="primary-button" onClick={handleSimulate} disabled={isPending}>
            {isPending ? "Simulating..." : "Simulate New Incident"}
          </button>
          <p className="hero-note">Latest snapshot: {new Date(snapshot.generatedAt).toLocaleTimeString()}</p>
        </div>
      </section>

      <section className="metrics-grid">
        <MetricCard label="Active exceptions" value={metricFormatter.format(snapshot.metrics.exceptionCount)} tone="sun" />
        <MetricCard label="Urgent now" value={metricFormatter.format(snapshot.metrics.urgentCount)} tone="rose" />
        <MetricCard label="Approval rate" value={`${snapshot.metrics.approvalRate}%`} tone="teal" />
        <MetricCard label="Avg. decision time" value={`${snapshot.metrics.averageDecisionMinutes} min`} tone="ink" />
      </section>

      <section className="content-grid">
        <div className="panel stack-panel">
          <PanelHeader
            title="Exception queue"
            subtitle="Human attention is reserved for incidents where business impact, urgency, and ambiguity intersect."
          />
          <div className="stack-list">
            {snapshot.exceptions.map((item) => {
              const signal = snapshot.signals.find((candidate) => candidate.id === item.signalId);

              return (
                <button
                  className={`exception-card ${selectedException?.id === item.id ? "selected" : ""}`}
                  key={item.id}
                  onClick={() => setSelectedExceptionId(item.id)}
                >
                  <div className="exception-card-head">
                    <span className={`source-pill ${sourceAccent[signal?.source ?? "Docs"]}`}>{signal?.source ?? "Unknown"}</span>
                    <span className="priority-pill">{item.priority}</span>
                  </div>
                  <h3>{signal?.title}</h3>
                  <p>{item.reason}</p>
                  <div className="exception-card-foot">
                    <span>{item.owner}</span>
                    <span>{item.confidence}% confidence</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="panel detail-panel">
          <PanelHeader
            title="Decision brief"
            subtitle="The draft below represents the artifact that would be pushed into Notion for review and approval."
          />
          {selectedException && selectedDecision ? (
            <DecisionView
              exceptionRecord={selectedException}
              signal={snapshot.signals.find((item) => item.id === selectedException.signalId)}
              decision={selectedDecision}
            />
          ) : (
            <div className="empty-detail">Select an exception to inspect the generated brief.</div>
          )}
        </div>
      </section>

      <section className="lower-grid">
        <div className="panel signal-panel">
          <PanelHeader title="Incoming signals" subtitle="Each signal is normalized into a consistent operating format before classification." />
          <div className="signal-list">
            {snapshot.signals.map((signal) => (
              <article className="signal-row" key={signal.id}>
                <div>
                  <span className={`source-pill ${sourceAccent[signal.source]}`}>{signal.source}</span>
                  <h3>{signal.title}</h3>
                  <p>{signal.summary}</p>
                </div>
                <div className="signal-meta">
                  <span>{signal.severity}</span>
                  <span>{signal.impactArea}</span>
                  <span>{new Date(signal.receivedAt).toLocaleTimeString()}</span>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="panel architecture-panel">
          <PanelHeader title="Architecture at a glance" subtitle="The demo runs locally, but the boundaries mirror a production Notion MCP system." />
          <ul className="architecture-list">
            <li>Signal connectors ingest GitHub, support, revenue, calendar, and docs events.</li>
            <li>A hybrid decision engine scores severity, business impact, and owner ambiguity.</li>
            <li>Decision briefs are stored in Notion as the reviewable system of record.</li>
            <li>Human approval closes the loop and feeds future routing quality.</li>
          </ul>
        </div>
      </section>
    </main>
  );
}

function PanelHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="panel-header">
      <h2>{title}</h2>
      <p>{subtitle}</p>
    </header>
  );
}

function MetricCard({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <article className={`metric-card metric-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function DecisionView({
  exceptionRecord,
  signal,
  decision,
}: {
  exceptionRecord: ExceptionRecord;
  signal?: Signal;
  decision: DecisionBrief;
}) {
  return (
    <div className="decision-view">
      <div className="decision-banner">
        <span className="priority-pill">{exceptionRecord.priority}</span>
        <span>{exceptionRecord.status}</span>
        <span>{exceptionRecord.slaMinutes}-minute SLA</span>
      </div>
      <h3>{decision.headline}</h3>
      <p className="decision-summary">{signal?.summary}</p>
      <div className="decision-grid">
        <section>
          <h4>Why now</h4>
          <p>{decision.whyNow}</p>
        </section>
        <section>
          <h4>Likely cause</h4>
          <p>{decision.likelyCause}</p>
        </section>
        <section>
          <h4>Suggested owner</h4>
          <p>{decision.suggestedOwner}</p>
        </section>
        <section>
          <h4>Outcome status</h4>
          <p>{decision.outcome}</p>
        </section>
      </div>
      <section>
        <h4>Recommended actions</h4>
        <ul className="decision-list">
          {decision.recommendedActions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
      <section>
        <h4>Evidence trace</h4>
        <ul className="decision-list muted-list">
          {decision.evidence.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}