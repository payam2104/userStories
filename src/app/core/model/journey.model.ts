import { Step } from './step.model';

export interface Journey {
  id: string;
  title: string;
  steps: Step[];
}
