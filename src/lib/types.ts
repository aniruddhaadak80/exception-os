export type SignalSource = "GitHub" | "Support" | "Revenue" | "Calendar" | "Docs";

export type ImpactArea = "Engineering" | "Customer" | "Revenue" | "Operations";

export type Severity = "Low" | "Medium" | "High" | "Critical";

export type Priority = "Watch" | "Elevated" | "Urgent";

export type ExceptionStatus = "Open" | "Investigating" | "Ready for Approval";

export type Signal = {
  id: string;
  source: SignalSource;
  title: string;
  summary: string;
  severity: Severity;
  impactArea: ImpactArea;
  affectedEntity: string;
  receivedAt: string;
};

export type ExceptionRecord = {
  id: string;
  signalId: string;
  priority: Priority;
  status: ExceptionStatus;
  confidence: number;
  reason: string;
  owner: string;
  slaMinutes: number;
};

export type DecisionBrief = {
  id: string;
  exceptionId: string;
  headline: string;
  whyNow: string;
  likelyCause: string;
  recommendedActions: string[];
  evidence: string[];
  suggestedOwner: string;
  outcome: "Drafted" | "Approved" | "Needs Revision";
};

export type DashboardMetrics = {
  exceptionCount: number;
  urgentCount: number;
  approvalRate: number;
  averageDecisionMinutes: number;
};

export type DashboardSnapshot = {
  generatedAt: string;
  metrics: DashboardMetrics;
  signals: Signal[];
  exceptions: ExceptionRecord[];
  decisions: DecisionBrief[];
};