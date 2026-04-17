export interface PredictionResult {
  prediction: number;
  probability: number;
  probability_percent: number;
  risk_level: string;
  risk_color: string;
  advice: string;
}
