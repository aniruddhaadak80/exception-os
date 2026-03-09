import {
  DashboardSnapshot,
  DecisionBrief,
  ExceptionRecord,
  ImpactArea,
  Priority,
  Signal,
  SignalSource,
  Severity,
} from "@/lib/types";

type SimulationTemplate = {
  source: SignalSource;
  severity: Severity;
  impactArea: ImpactArea;
  title: string;
  summary: string;
  affectedEntity: string;
  owner: string;
  reason: string;
  likelyCause: string;
  actions: string[];
  evidence: string[];
};

type StoreState = {
  signals: Signal[];
  exceptions: ExceptionRecord[];
  decisions: DecisionBrief[];
};

const ownersByImpact: Record<ImpactArea, string> = {
  Engineering: "Platform Lead",
  Customer: "Support Director",
  Revenue: "Revenue Ops",
  Operations: "Chief of Staff",
};

const templates: SimulationTemplate[] = [
  {
    source: "GitHub",
    severity: "Critical",
    impactArea: "Engineering",
    title: "Deployment failed on checkout pipeline",
    summary: "The production checkout deployment failed twice after merge and the rollback did not restore webhook processing.",
    affectedEntity: "Checkout service",
    owner: "Platform Lead",
    reason: "Critical engineering incident blocking production revenue flow.",
    likelyCause: "A schema mismatch between the checkout worker and webhook consumer is likely breaking the release path.",
    actions: [
      "Freeze further deploys to checkout services for 45 minutes.",
      "Assign platform lead to restore webhook processing via last known good migration set.",
      "Create a customer-impact note for revenue and support teams."
    ],
    evidence: [
      "Two failed deployments within 14 minutes.",
      "Webhook retries increased 340 percent after release.",
      "Revenue sync jobs are now delayed beyond SLA."
    ]
  },
  {
    source: "Support",
    severity: "High",
    impactArea: "Customer",
    title: "Enterprise customer escalation is waiting without owner",
    summary: "A tier-one customer reported blocked onboarding and no response owner has been assigned in the last 90 minutes.",
    affectedEntity: "Northstar Health",
    owner: "Support Director",
    reason: "High-value customer escalation with undefined ownership.",
    likelyCause: "Routing rules likely failed because the issue spans support, product, and onboarding operations.",
    actions: [
      "Assign an incident owner and customer communicator immediately.",
      "Open an internal resolution thread with product and onboarding.",
      "Promise next update to the customer within 30 minutes."
    ],
    evidence: [
      "Account ARR tier is marked strategic.",
      "No owner present on the escalation record.",
      "Customer has sent three follow-ups in under one hour."
    ]
  },
  {
    source: "Revenue",
    severity: "High",
    impactArea: "Revenue",
    title: "Renewal conversion dropped below weekly threshold",
    summary: "Weekly renewal conversion is down 18 percent and no corresponding pricing or campaign change has been logged.",
    affectedEntity: "Renewal pipeline",
    owner: "Revenue Ops",
    reason: "Unexplained revenue anomaly without a linked change record.",
    likelyCause: "Payment retry logic or CRM handoff gaps may be reducing conversions before account management can intervene.",
    actions: [
      "Compare failed payment retries against prior week baseline.",
      "Audit CRM ownership gaps for renewals closing this week.",
      "Draft recovery outreach for at-risk accounts."
    ],
    evidence: [
      "Renewal rate moved from 71 percent to 53 percent week over week.",
      "No approved pricing experiment exists in planning notes.",
      "Failure concentration is highest in accounts without named owner."
    ]
  },
  {
    source: "Calendar",
    severity: "Medium",
    impactArea: "Operations",
    title: "Launch review conflict detected across leadership",
    summary: "The launch readiness review overlaps with two dependency meetings for leadership and the release checklist still has unresolved items.",
    affectedEntity: "April launch",
    owner: "Chief of Staff",
    reason: "Launch governance conflict with unresolved readiness blockers.",
    likelyCause: "Calendar planning and release checklist workflows are disconnected.",
    actions: [
      "Reschedule the readiness review with all required approvers.",
      "Escalate unresolved checklist items into a launch blocker list.",
      "Publish a final owner matrix before end of day."
    ],
    evidence: [
      "Two mandatory approvers are double-booked.",
      "Three launch checklist items remain unowned.",
      "Marketing timeline depends on approval outcome."
    ]
  },
  {
    source: "Docs",
    severity: "Medium",
    impactArea: "Engineering",
    title: "Merged feature has no launch document",
    summary: "A user-facing feature was merged to main but no rollout doc, support brief, or analytics plan exists.",
    affectedEntity: "Workflow automations",
    owner: "Platform Lead",
    reason: "Release readiness gap between engineering and operational docs.",
    likelyCause: "Definition of done does not enforce operational documentation requirements.",
    actions: [
      "Open a launch brief before feature release.",
      "Assign support and analytics signoff.",
      "Add a documentation gate to the release process."
    ],
    evidence: [
      "Feature branch merged within last 6 hours.",
      "No linked launch note in project workspace.",
      "Support team has not received a change summary."
    ]
  }
];

const scoreBySeverity: Record<Severity, number> = {
  Low: 20,
  Medium: 45,
  High: 72,
  Critical: 92,
};

const priorityFromSeverity = (severity: Severity): Priority => {
  if (severity === "Critical") {
    return "Urgent";
  }

  if (severity === "High") {
    return "Elevated";
  }

  return "Watch";
};

const createId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;

const toSignal = (template: SimulationTemplate): Signal => ({
  id: createId("sig"),
  source: template.source,
  title: template.title,
  summary: template.summary,
  severity: template.severity,
  impactArea: template.impactArea,
  affectedEntity: template.affectedEntity,
  receivedAt: new Date().toISOString(),
});

const toException = (signal: Signal, template: SimulationTemplate): ExceptionRecord => ({
  id: createId("exc"),
  signalId: signal.id,
  priority: priorityFromSeverity(signal.severity),
  status: signal.severity === "Critical" ? "Investigating" : "Ready for Approval",
  confidence: Math.min(99, scoreBySeverity[signal.severity] + (signal.source === "Revenue" ? 4 : 0)),
  reason: template.reason,
  owner: template.owner || ownersByImpact[signal.impactArea],
  slaMinutes: signal.severity === "Critical" ? 15 : signal.severity === "High" ? 30 : 90,
});

const toDecision = (exceptionRecord: ExceptionRecord, template: SimulationTemplate): DecisionBrief => ({
  id: createId("dec"),
  exceptionId: exceptionRecord.id,
  headline: `${template.impactArea} exception: ${template.title}`,
  whyNow: template.reason,
  likelyCause: template.likelyCause,
  recommendedActions: template.actions,
  evidence: template.evidence,
  suggestedOwner: exceptionRecord.owner,
  outcome: exceptionRecord.status === "Investigating" ? "Needs Revision" : "Drafted",
});

const buildSeedState = (): StoreState => {
  const chosenTemplates = templates.slice(0, 3);

  const signals: Signal[] = [];
  const exceptions: ExceptionRecord[] = [];
  const decisions: DecisionBrief[] = [];

  for (const template of chosenTemplates) {
    const signal = toSignal(template);
    const exceptionRecord = toException(signal, template);
    const decision = toDecision(exceptionRecord, template);

    signals.push(signal);
    exceptions.push(exceptionRecord);
    decisions.push(decision);
  }

  return { signals, exceptions, decisions };
};

const globalStore = globalThis as typeof globalThis & {
  __exceptionOsStore?: StoreState;
};

const getStore = (): StoreState => {
  if (!globalStore.__exceptionOsStore) {
    globalStore.__exceptionOsStore = buildSeedState();
  }

  return globalStore.__exceptionOsStore;
};

const computeMetrics = (state: StoreState) => ({
  exceptionCount: state.exceptions.length,
  urgentCount: state.exceptions.filter((item) => item.priority === "Urgent").length,
  approvalRate: 86,
  averageDecisionMinutes: 17,
});

export const getDashboardSnapshot = (): DashboardSnapshot => {
  const state = getStore();

  return {
    generatedAt: new Date().toISOString(),
    metrics: computeMetrics(state),
    signals: [...state.signals].sort((a, b) => b.receivedAt.localeCompare(a.receivedAt)),
    exceptions: [...state.exceptions],
    decisions: [...state.decisions],
  };
};

export const simulateSignal = (): DashboardSnapshot => {
  const state = getStore();
  const template = templates[Math.floor(Math.random() * templates.length)];
  const signal = toSignal(template);
  const exceptionRecord = toException(signal, template);
  const decision = toDecision(exceptionRecord, template);

  state.signals.unshift(signal);
  state.exceptions.unshift(exceptionRecord);
  state.decisions.unshift(decision);

  state.signals = state.signals.slice(0, 8);
  state.exceptions = state.exceptions.slice(0, 6);
  state.decisions = state.decisions.slice(0, 6);

  return getDashboardSnapshot();
};

export const getDecisionPayload = (exceptionId: string) => {
  const snapshot = getDashboardSnapshot();
  const exceptionRecord = snapshot.exceptions.find((item) => item.id === exceptionId);

  if (!exceptionRecord) {
    return null;
  }

  const signal = snapshot.signals.find((item) => item.id === exceptionRecord.signalId);
  const decision = snapshot.decisions.find((item) => item.exceptionId === exceptionRecord.id);

  if (!signal || !decision) {
    return null;
  }

  return {
    exceptionRecord,
    signal,
    decision,
  };
};