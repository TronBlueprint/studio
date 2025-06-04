
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { NbaProspectFormData, NbaProspectSchema, POSITIONS } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

// Helper functions based on Python code
const getAgeRatingPy = (age: number): number => {
  const ageScale = [
    { max_age: 18.59, rating: 10 }, { max_age: 19.39, rating: 9 }, { max_age: 20.10, rating: 8 }, 
    { max_age: 20.59, rating: 7 }, { max_age: 21.10, rating: 6 }, { max_age: 21.89, rating: 5 }, 
    { max_age: 22.50, rating: 4 }, { max_age: 22.99, rating: 3 }, { max_age: 23.50, rating: 2 }, 
    { max_age: Infinity, rating: 1 }
  ];
  for (const item of ageScale) {
    if (age <= item.max_age) return item.rating;
  }
  return 1; // Should be covered by Infinity
};

const getPositionThresholdsPy = (position: NbaProspectFormData['position']): { thresholds: number[], ratings: number[] } => {
  const thresholdsMap: { [key: string]: number } = {'PG': 68, 'SG': 70, 'SF': 72, 'PF': 74, 'C': 76};
  const start = thresholdsMap[position] || 68; // Default to PG if somehow position is invalid
  
  // Python: list(range(start, start + 10)) -> [start, start+1, ..., start+9]
  const thresholds = Array.from({ length: 10 }, (_, i) => start + i);
  // Python: list(range(1, 11)) -> [1, 2, ..., 10]
  const ratings = Array.from({ length: 10 }, (_, i) => i + 1);
  return { thresholds, ratings };
};

const getHeightRatingPy = (heightIn: number, position: NbaProspectFormData['position']): number => {
  const { thresholds, ratings } = getPositionThresholdsPy(position);

  if (heightIn < thresholds[0]) return 1.0;
  if (heightIn >= thresholds[thresholds.length - 1]) return 10.0; // Corresponds to rating 10 for last threshold

  for (let i = 0; i < thresholds.length; i++) {
    if (Math.abs(heightIn - thresholds[i]) < 0.01) { // Exact match
      return ratings[i];
    }
  }

  for (let i = 0; i < thresholds.length - 1; i++) {
    const lowerThresh = thresholds[i];
    const upperThresh = thresholds[i+1];
    const midPoint = (lowerThresh + upperThresh) / 2.0;

    if (lowerThresh <= heightIn && heightIn < upperThresh) {
      if (Math.abs(heightIn - midPoint) < 0.01) { // Halfway
        return (ratings[i] + ratings[i+1]) / 2.0;
      } else if (heightIn < midPoint) {
        return ratings[i];
      } else {
        return ratings[i+1];
      }
    }
  }
  // Fallback, though should be covered. If heightIn is >= last threshold, it's caught at the start.
  // If it's between the second to last and last threshold but not caught by midpoint logic:
  if (heightIn >= thresholds[thresholds.length - 2] && heightIn < thresholds[thresholds.length - 1]) {
     return ratings[ratings.length -2]; // Should be ratings[i] for that segment.
  }

  return 10.0; // Default fallback if other conditions not met (e.g. >= last threshold)
};

const getWingspanRatingPy = (differential: number): number => {
  const wingspanScale = [ // (differential_threshold, rating) - threshold is inclusive lower bound
    { boundary: 8.0, rating: 9 }, { boundary: 7.0, rating: 8 }, { boundary: 6.0, rating: 7 }, 
    { boundary: 5.0, rating: 6 }, { boundary: 4.0, rating: 5 }, { boundary: 3.0, rating: 4 }, 
    { boundary: 2.0, rating: 3 }, { boundary: 1.0, rating: 2 }, { boundary: 0.0, rating: 1 }
  ];

  if (differential < 0) return 1.0; // Smallest rating for negative differential

  // Check exact matches
  for (const scalePoint of wingspanScale) {
    if (Math.abs(differential - scalePoint.boundary) < 0.01) {
      return scalePoint.rating;
    }
  }
  
  // Check midpoints (Iterate from largest boundary to smallest)
  for (let i = 0; i < wingspanScale.length - 1; i++) {
    const upper = wingspanScale[i];     // e.g., (8.0, 9)
    const lower = wingspanScale[i+1]; // e.g., (7.0, 8)
    // Check if differential is between lower.boundary and upper.boundary
    if (differential >= lower.boundary && differential < upper.boundary) {
      const midpoint = (upper.boundary + lower.boundary) / 2.0;
      if (Math.abs(differential - midpoint) < 0.01) {
        return (upper.rating + lower.rating) / 2.0;
      }
    }
  }

  // Step function logic: if not an exact match or midpoint, find where it falls
  for (const scalePoint of wingspanScale) {
    if (differential >= scalePoint.boundary) {
      return scalePoint.rating;
    }
  }
  
  return 1.0; // If differential is positive but less than 0.0 (e.g. 0 to 0.99) -> handled by boundary 0.0, rating 1
};


// Calculate overall 0-100 score
const calculateOverallRating = (data: NbaProspectFormData): number => {
  const agePy = data.age;
  const heightPy = data.height; // Assuming height is already in inches
  const wingspanPy = data.wingspan; // Assuming wingspan is already in inches
  const positionPy = data.position;

  const ageRating = getAgeRatingPy(agePy); // 1-10
  const heightRating = getHeightRatingPy(heightPy, positionPy); // 1-10 (can be x.5)
  const wingspanDifferential = wingspanPy - heightPy;
  const wingspanRating = getWingspanRatingPy(wingspanDifferential); // 1-9 (can be x.5)

  // Normalize and weight. Let's use weights similar to original component: Age (30%), Height (35%), Wingspan (35%)
  // Age score contribution: (rating - min_rating) / (max_rating - min_rating) * weight
  const normAgeScore = (ageRating - 1) / (10 - 1); // Range 0-1
  const normHeightScore = (heightRating - 1) / (10 - 1); // Range 0-1
  const normWingspanScore = (wingspanRating - 1) / (9 - 1); // Range 0-1, max rating for wingspan is 9

  const overallScore = (normAgeScore * 30) + (normHeightScore * 35) + (normWingspanScore * 35);
  
  return Math.max(0, Math.min(100, Math.round(overallScore)));
};


export default function NbaProspectPhysicalRater() {
  const [ratingResult, setRatingResult] = useState<number | null>(null);

  const form = useForm<NbaProspectFormData>({
    resolver: zodResolver(NbaProspectSchema),
    defaultValues: {
      age: undefined,
      height: undefined,
      wingspan: undefined,
      position: undefined,
    },
    mode: "onChange" // for real-time error checking
  });

  function onSubmit(data: NbaProspectFormData) {
    const rating = calculateOverallRating(data);
    setRatingResult(rating);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">NBA Prospect Physical Rater</CardTitle>
        <CardDescription>
          Input age, height (inches), wingspan (inches), and position to get a physical rating score (0-100).
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="age"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Age (years, 17-30)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 19" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="height"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Height (inches, e.g., 60-90)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 77" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="wingspan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Wingspan (inches, e.g., 60-100)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 80" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="position"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Position</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a position" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {POSITIONS.map(pos => (
                        <SelectItem key={pos.value} value={pos.value}>{pos.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex flex-col items-stretch gap-4">
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90">Calculate Rating</Button>
            {ratingResult !== null && (
              <>
                <Separator />
                <div className="text-center p-4 bg-accent/10 rounded-md">
                  <h3 className="text-lg font-semibold text-accent-foreground">Physical Rating Score</h3>
                  <p className="text-3xl font-bold text-accent">{ratingResult}/100</p>
                </div>
              </>
            )}
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
