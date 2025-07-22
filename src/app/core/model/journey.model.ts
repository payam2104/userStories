import { Step } from './step.model';

export interface Journey {
  id: string;  // UUID
  name: string;
  steps: Step[];
  order?: number;
}
