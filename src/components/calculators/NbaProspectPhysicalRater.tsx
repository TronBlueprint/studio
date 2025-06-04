
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
  return 1; 
};

const getPositionThresholdsPy = (position: NbaProspectFormData['position']): { thresholds: number[], ratings: number[] } => {
  const thresholdsMap: { [key: string]: number } = {'PG': 68, 'SG': 70, 'SF': 72, 'PF': 74, 'C': 76};
  const start = thresholdsMap[position] || 68; 
  
  // Creates an array of 10 thresholds: start, start+1, ..., start+9
  const thresholds = Array.from({ length: 10 }, (_, i) => start + i);
  // Creates an array of 10 ratings: 1, 2, ..., 10
  const ratings = Array.from({ length: 10 }, (_, i) => i + 1);
  return { thresholds, ratings };
};

const getHeightRatingPy = (heightIn: number, position: NbaProspectFormData['position']): number => {
  const { thresholds, ratings } = getPositionThresholdsPy(position);

  if (heightIn < thresholds[0]) return 1.0; // Below the lowest threshold (e.g., <68 for PG)
  if (heightIn >= thresholds[thresholds.length - 1]) return 10.0; // At or above the highest threshold (e.g. >= 68+9 = 77 for PG)

  // Check for exact match or if height falls into a bucket
  for (let i = 0; i < thresholds.length; i++) {
    if (Math.abs(heightIn - thresholds[i]) < 0.01) { // Exact match with a threshold
        return ratings[i];
    }
    // Check for points between thresholds (for .5 ratings)
    if (i < thresholds.length - 1) {
        const lowerThresh = thresholds[i];
        const upperThresh = thresholds[i+1];
        const midPoint = (lowerThresh + upperThresh) / 2.0;

        if (heightIn > lowerThresh && heightIn < upperThresh) { // height is between two thresholds
            if (Math.abs(heightIn - midPoint) < 0.01) { // Exactly at the midpoint
                return (ratings[i] + ratings[i+1]) / 2.0;
            } else if (heightIn < midPoint) { // Closer to lower threshold
                return ratings[i];
            } else { // Closer to upper threshold
                return ratings[i+1];
            }
        }
    }
  }
  // This fallback should ideally not be reached if logic is correct,
  // but as a safeguard, if height is greater than the second to last threshold
  // and less than the last, it implies it's in the range of the last rating before max.
  // This might need adjustment based on how ratings for values between integer thresholds are handled.
  // For now, let's assume the loop correctly assigns based on proximity or exact match.
  // The python version implies if it's not an exact match or midpoint, it takes the rating of the lower bound of its interval.
  // Let's refine to ensure that logic.
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (heightIn >= thresholds[i] - 0.01) { // Check if height is at or above current threshold
        // This handles cases like 68.2 for PG should be rating for 68 (which is 1 if thresholds[0] is 68)
        // This logic needs to be precise. Example: PG: Thresholds [68,69,70...77], Ratings [1,2,3...10]
        // Height 68 -> Rating 1. Height 68.4 -> Rating 1. Height 68.5 -> Rating 1.5. Height 68.7 -> Rating 2.
        // The provided Python version had a complex branching for this. Let's re-verify that.
        // The python code seems to: if exact, take rating. If midpoint, take average. Else if < midpoint, take lower. Else > midpoint, take upper.

        // Re-evaluating based on the python code's structure:
        // It iterates, if exact -> rating[i].
        // Then it checks midpoints.
        // Then a final loop: if height_in < thresholds[i], return ratings[i-1] or 1.0. This implies discrete steps.

        // Let's use the simpler logic from the Python structure:
        // 1. Exact match to a threshold -> ratings[i]
        // 2. Midpoint between thresholds[i] and thresholds[i+1] -> (ratings[i] + ratings[i+1]) / 2.0
        // 3. Between thresholds[i] and midPoint -> ratings[i]
        // 4. Between midPoint and thresholds[i+1] -> ratings[i+1]

        // This was already covered by the loop with midPoint logic.
        // If height is 76.9 for PG (max threshold is 77 for rating 10)
        // It falls between 76 (rating 9) and 77 (rating 10). Midpoint 76.5. 76.9 > 76.5 -> rating 10. Correct.
        // Height 68.2 for PG. Thresholds[0]=68 (rating 1), Thresholds[1]=69 (rating 2). Midpoint 68.5. 68.2 < 68.5 -> rating 1. Correct.
        return ratings[i]; // If it's >= last iterated threshold
    }
  }
  return 1.0; // Should be caught by initial checks.
};


const wingspanPoints = [
  { diff: 7.0, rating: 10.0 }, { diff: 6.5, rating: 9.5 }, { diff: 6.0, rating: 9.0 },
  { diff: 5.5, rating: 8.5 }, { diff: 5.0, rating: 8.0 }, { diff: 4.75, rating: 7.5 },
  { diff: 4.5, rating: 7.0 }, { diff: 4.25, rating: 6.5 }, { diff: 4.0, rating: 6.0 },
  { diff: 3.5, rating: 5.5 }, { diff: 3.0, rating: 5.0 }, { diff: 2.5, rating: 4.5 },
  { diff: 2.0, rating: 4.0 }, { diff: 1.5, rating: 3.5 }, { diff: 1.0, rating: 3.0 },
  { diff: 0.5, rating: 2.5 },
  { diff: 0.25, rating: 0.5 }, 
  { diff: 0.0, rating: 2.0 }, 
  { diff: -0.5, rating: 1.5 },
  { diff: -1.0, rating: 1.0 }
].sort((a, b) => b.diff - a.diff); // Sort by diff in descending order for processing

const getWingspanRatingPy = (differential: number): number => {
  const epsilon = 0.0001; // For floating point comparisons

  if (differential >= wingspanPoints[0].diff - epsilon) { 
    return wingspanPoints[0].rating; 
  }
  if (differential <= wingspanPoints[wingspanPoints.length - 1].diff + epsilon) { 
    return wingspanPoints[wingspanPoints.length - 1].rating; 
  }

  for (let i = 0; i < wingspanPoints.length - 1; i++) {
    const p1 = wingspanPoints[i];     // Current point (higher differential)
    const p2 = wingspanPoints[i+1];   // Next point (lower differential)

    if (Math.abs(differential - p1.diff) < epsilon) return p1.rating;
    if (Math.abs(differential - p2.diff) < epsilon) return p2.rating;

    if (differential < p1.diff && differential > p2.diff) {
      const interpolatedRating = p2.rating + 
        (differential - p2.diff) * (p1.rating - p2.rating) / (p1.diff - p2.diff);
      
      // Rounds to nearest 0.5. If exactly .25 or .75, rounds up to next 0.5.
      // e.g. 2.25 -> round(4.5)/2 = 2.5.  2.1 -> round(4.2)/2 = 2.0. 2.75 -> round(5.5)/2 = 3.0
      return Math.round(interpolatedRating * 2) / 2;
    }
  }
  
  return wingspanPoints[wingspanPoints.length - 1].rating; 
};


// Calculate overall 0-100 score
const calculateOverallRating = (data: NbaProspectFormData): number => {
  const agePy = data.age; // number
  const heightPy = data.height; // number (inches, transformed by Zod)
  const wingspanPy = data.wingspan; // number (inches, transformed by Zod)
  const positionPy = data.position;

  const ageRating = getAgeRatingPy(agePy); // 1-10
  const heightRating = getHeightRatingPy(heightPy, positionPy); // 1-10 (can be x.5)
  const wingspanDifferential = wingspanPy - heightPy;
  const wingspanRating = getWingspanRatingPy(wingspanDifferential); // 1-10 (can be x.5)

  const normAgeScore = (ageRating - 1) / (10 - 1); 
  const normHeightScore = (heightRating - 1) / (10 - 1); 
  const normWingspanScore = (wingspanRating - 1) / (10 - 1); 

  const overallScore = (normAgeScore * 30) + (normHeightScore * 35) + (normWingspanScore * 35);
  
  return Math.max(0, Math.min(100, Math.round(overallScore)));
};


export default function NbaProspectPhysicalRater() {
  const [ratingResult, setRatingResult] = useState<number | null>(null);
  const [individualRatings, setIndividualRatings] = useState<{age: number, height: number, wingspan: number} | null>(null);

  const form = useForm<NbaProspectFormData>({
    resolver: zodResolver(NbaProspectSchema),
    defaultValues: {
      age: undefined,
      height: "", // Changed from undefined to empty string for text input
      wingspan: "", // Changed from undefined to empty string for text input
      position: undefined,
    },
    mode: "onChange" 
  });

  function onSubmit(data: NbaProspectFormData) { // data.height and data.wingspan are numbers here due to Zod transform
    const ageRating = getAgeRatingPy(data.age);
    const heightRating = getHeightRatingPy(data.height, data.position);
    const wingspanDifferential = data.wingspan - data.height;
    const wingspanRating = getWingspanRatingPy(wingspanDifferential);
    
    setIndividualRatings({
        age: ageRating,
        height: heightRating,
        wingspan: wingspanRating
    });

    const overallRating = calculateOverallRating(data);
    setRatingResult(overallRating);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">NBA Prospect Physical Rater</CardTitle>
        <CardDescription>
          Input age, height (e.g., 6'5" or 6'5.5), wingspan (e.g., 6'8" or 6'8.5), and position to get a physical rating score (0-100). Individual ratings (1-10) for age, height, and wingspan differential are also shown.
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
                  <FormLabel>Height (e.g., 6'5" or 6'5.5")</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="e.g., 6'5.5" {...field} />
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
                  <FormLabel>Wingspan (e.g., 6'8" or 6'8.5")</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="e.g., 6'8" {...field} />
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
            {ratingResult !== null && individualRatings !== null && (
              <>
                <Separator />
                <div className="text-center p-4 bg-accent/10 rounded-md w-full">
                  <h3 className="text-lg font-semibold text-accent-foreground">Overall Physical Rating</h3>
                  <p className="text-3xl font-bold text-accent">{ratingResult}/100</p>
                  <div className="mt-3 text-sm text-muted-foreground space-y-1">
                    <p>Age Rating: {individualRatings.age.toFixed(1)}/10</p>
                    <p>Height Rating: {individualRatings.height.toFixed(1)}/10</p>
                    <p>Wingspan Diff. Rating: {individualRatings.wingspan.toFixed(1)}/10</p>
                  </div>
                </div>
              </>
            )}
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
