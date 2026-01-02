
export interface DerivativeResult {
  result: string;
  explanation: string;
  fullSolution: string;
  keyPoints: string[];
}

export interface PracticeFeedback {
  isCorrect: boolean;
  feedback: string;
  fullSolution: string;
  keyPoints: string[];
}

export interface PracticeProblem {
  id: string;
  title: string;
  question: string;
  type: 'PARTIAL' | 'DIRECTIONAL';
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export type CalcType = 'PARTIAL' | 'DIRECTIONAL';
export type VarCount = 2 | 3;
export type DirectionalInputType = 'vector' | 'theta' | 'points';

export interface CalculationState {
  loading: boolean;
  error: string | null;
  data: DerivativeResult | null;
  showFullSolution: boolean;
}

export interface PracticeState {
  loading: boolean;
  error: string | null;
  feedback: PracticeFeedback | null;
  showFullSolution: boolean;
}
