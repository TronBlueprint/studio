
import { z } from 'zod';

export const AthleticismSchema = z.object({
  speed: z.coerce.number().min(45, "Min 45 (e.g. score, not seconds)").max(95, "Max 95 (e.g. score, not seconds)"),
  agility: z.coerce.number().min(45, "Min 45 (e.g. score, not seconds)").max(95, "Max 95 (e.g. score, not seconds)"),
  vertical: z.coerce.number().min(50, "Min 50 (e.g. score, not inches)").max(99, "Max 99 (e.g. score, not inches)"),
});
export type AthleticismFormData = z.infer<typeof AthleticismSchema>;

const measurementRegex = /^(\d+)'(\d*(\.\d+)?)(?:("|"))?$/; // Matches X'Y, X'Y.Z, X'Y", X'Y.Z"

const parseMeasurementToInches = (val: string): number | null => {
  const match = val.match(measurementRegex);
  if (!match) return null;

  try {
    const feet = parseFloat(match[1]);
    const inches = parseFloat(match[2]);

    if (isNaN(feet) || isNaN(inches) || inches < 0 || inches >= 12) {
      return null;
    }
    return feet * 12 + inches;
  } catch {
    return null;
  }
};

const measurementSchema = (fieldLabel: string, minInches: number, maxInches: number, minFeetInches: string, maxFeetInches: string) =>
  z.string()
    .min(1, `${fieldLabel} is required.`)
    .refine(val => measurementRegex.test(val.trim()), {
      message: `Invalid ${fieldLabel.toLowerCase()} format. Use F'I or F'I.I (e.g., 6'5 or 6'5.5). Quotes are optional.`,
    })
    .transform((val, ctx) => {
      const inches = parseMeasurementToInches(val.trim());
      if (inches === null) {
        // This case should ideally be caught by the regex refine, but as a fallback:
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Invalid ${fieldLabel.toLowerCase()} value.`,
        });
        return z.NEVER;
      }
      return inches;
    })
    .refine(inches => inches >= minInches && inches <= maxInches, {
      message: `${fieldLabel} must be between ${minFeetInches} (${minInches} inches) and ${maxFeetInches} (${maxInches} inches).`,
    });


export const NbaProspectSchema = z.object({
  age: z.coerce.number().min(17, "Min 17 years").max(30, "Max 30 years"),
  height: measurementSchema("Height", 60, 90, "5'0\"", "7'6\""),
  wingspan: measurementSchema("Wingspan", 60, 100, "5'0\"", "8'4\""),
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
