import { Issue } from "./issue.model";

export interface Step {
  id: string;
  title: string;
  user_journey_id: string;
  issues: Issue[];
}