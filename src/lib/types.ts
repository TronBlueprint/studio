import { z } from 'zod';

export const AthleticismSchema = z.object({
  speed: z.coerce.number().min(45, "Min 45 (e.g. score, not seconds)").max(95, "Max 95 (e.g. score, not seconds)"),
  agility: z.coerce.number().min(45, "Min 45 (e.g. score, not seconds)").max(95, "Max 95 (e.g. score, not seconds)"),
  vertical: z.coerce.number().min(50, "Min 50 (e.g. score, not inches)").max(99, "Max 99 (e.g. score, not inches)"),
});
export type AthleticismFormData = z.infer<typeof AthleticismSchema>;

export const NbaProspectSchema = z.object({
  age: z.coerce.number().min(17, "Min 17 years").max(30, "Max 30 years"), // Adjusted min age based on Python common draft eligibility
  height: z.coerce.number().min(60, "Min 60 inches (5'0\")").max(90, "Max 90 inches (7'6\")"), // Adjusted min height
  wingspan: z.coerce.number().min(60, "Min 60 inches (5'0\")").max(100, "Max 100 inches (8'4\")"), // Adjusted wingspan
  position: z.enum(['PG', 'SG', 'SF', 'PF', 'C'], { required_error: "Please select a position." }),
});
export type NbaProspectFormData = z.infer<typeof NbaProspectSchema>;

export const POSITIONS: { value: NbaProspectFormData['position']; label: string }[] = [
  { value: "PG", label: "Point Guard (PG)" },
  { value: "SG", label: "Shooting Guard (SG)" },
  { value: "SF", label: "Small Forward (SF)" },
  { value: "PF", label: "Power Forward (PF)" },
  { value: "C", label: "Center (C)" },
];

// Types for Player Category Averages
export interface PlayerAverages {
  playerName: string;
  overallRating: number;
  offense: number | string; // Can be "N/A"
  defense: number | string;
  physicals: number | string;
  summary: number | string;
}

export const CATEGORY_KEYS_PLAYER_AVG = {
  Offense: ["Shooting", "Finishing", "Shot Creation", "Passing", "Dribbling"],
  Defense: ["Perimeter", "Interior", "Playmaking"],
  Physicals: ["Athleticism", "Age", "Height", "Wingspan"],
  Summary: ["NBA Ready", "Potential Min", "Potential Mid", "Potential Max"]
};
