export interface Issue {
  id: string;
  title: string;
  description: string;
  stepId?: string | null | undefined;
  labels?: string[];
  releaseId?: string | null;
}
