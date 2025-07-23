export interface UndoAction {
  description: string;
  undoFn: () => void;
  timeoutId?: any;
}
