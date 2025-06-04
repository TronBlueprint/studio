import { z } from 'zod';

export const AthleticismSchema = z.object({
  speed: z.coerce.number().min(4.2, "Min 4.2s").max(6.0, "Max 6.0s"),
  agility: z.coerce.number().min(3.8, "Min 3.8s").max(5.0, "Max 5.0s"),
  vertical: z.coerce.number().min(20, "Min 20in").max(45, "Max 45in"),
});
export type AthleticismFormData = z.infer<typeof AthleticismSchema>;

export const NbaProspectSchema = z.object({
  age: z.coerce.number().min(18, "Min 18 years").max(25, "Max 25 years"),
  height: z.coerce.number().min(72, "Min 72 inches").max(90, "Max 90 inches"),
  wingspan: z.coerce.number().min(72, "Min 72 inches").max(96, "Max 96 inches"),
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
