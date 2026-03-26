export type AlertSeverity = "info" | "warning" | "critical";
export type AlertCategory = "fuel" | "threat" | "shell" | "tutorial" | "system";

export interface GhostAlert {
  id: string;
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;
  message: string;
  timestamp: number;
  dismissed: boolean;
}
