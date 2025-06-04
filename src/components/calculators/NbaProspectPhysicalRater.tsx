
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
  
  const thresholds = Array.from({ length: 10 }, (_, i) => start + i);
  const ratings = Array.from({ length: 10 }, (_, i) => i + 1);
  return { thresholds, ratings };
};

const getHeightRatingPy = (heightIn: number, position: NbaProspectFormData['position']): number => {
  const { thresholds, ratings } = getPositionThresholdsPy(position);

  if (heightIn < thresholds[0]) return 1.0; 
  if (heightIn >= thresholds[thresholds.length - 1]) return 10.0; 

  for (let i = 0; i < thresholds.length; i++) {
    if (Math.abs(heightIn - thresholds[i]) < 0.01) { 
        return ratings[i];
    }
    if (i < thresholds.length - 1) {
        const lowerThresh = thresholds[i];
        const upperThresh = thresholds[i+1];
        const midPoint = (lowerThresh + upperThresh) / 2.0;

        if (heightIn > lowerThresh && heightIn < upperThresh) { 
            if (Math.abs(heightIn - midPoint) < 0.01) { 
                return (ratings[i] + ratings[i+1]) / 2.0;
            } else if (heightIn < midPoint) { 
                return ratings[i];
            } else { 
                return ratings[i+1];
            }
        }
    }
  }
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (heightIn >= thresholds[i] - 0.01) { 
        return ratings[i]; 
    }
  }
  return 1.0; 
};


const wingspanPoints = [
  { diff: 7.0, rating: 10.0 }, { diff: 6.5, rating: 9.5 }, { diff: 6.0, rating: 9.0 },
  { diff: 5.5, rating: 8.5 }, { diff: 5.0, rating: 8.0 }, { diff: 4.75, rating: 7.5 },
  { diff: 4.5, rating: 7.0 }, { diff: 4.25, rating: 6.5 }, { diff: 4.0, rating: 6.0 },
  { diff: 3.5, rating: 5.5 }, { diff: 3.0, rating: 5.0 }, { diff: 2.5, rating: 4.5 },
  { diff: 2.0, rating: 4.0 }, { diff: 1.5, rating: 3.5 }, { diff: 1.0, rating: 3.0 },
  { diff: 0.5, rating: 2.5 }, { diff: 0.25, rating: 2.25}, // Interpolation point, will round to 2.5
  { diff: 0.0, rating: 2.0 }, 
  { diff: -0.5, rating: 1.5 },
  { diff: -1.0, rating: 1.0 } // -1.0 or worse
].sort((a, b) => b.diff - a.diff); // Sort by diff in descending order for processing

const getWingspanRatingPy = (differential: number): number => {
  const epsilon = 0.0001; // For floating point comparisons

  if (differential >= wingspanPoints[0].diff - epsilon) { // At or above highest diff (e.g. >= 7.0)
    return wingspanPoints[0].rating; // 10.0
  }
  // Check if differential is at or below the lowest defined positive point that's not the absolute minimum
  // The last point in the sorted array is {-1.0, 1.0}
  if (differential <= wingspanPoints[wingspanPoints.length - 1].diff + epsilon) { // At or below -1.0
    return wingspanPoints[wingspanPoints.length - 1].rating; // 1.0
  }

  // Find the two points the differential falls between for interpolation
  for (let i = 0; i < wingspanPoints.length - 1; i++) {
    const p1 = wingspanPoints[i];     // Current point (higher differential, e.g. {diff: 0.5, rating: 2.5})
    const p2 = wingspanPoints[i+1];   // Next point (lower differential, e.g. {diff: 0.25, rating: 2.25})

    // Exact match to a defined point in the scale
    if (Math.abs(differential - p1.diff) < epsilon) return p1.rating;
    // This check is covered by the loop's nature or the initial boundary checks for p2.diff being the min.

    if (differential < p1.diff && differential > p2.diff) {
      // Interpolate: y = y1 + (x - x1) * (y2 - y1) / (x2 - x1)
      // Here: rating = p2.rating + (differential - p2.diff) * (p1.rating - p2.rating) / (p1.diff - p2.diff)
      const interpolatedRating = p2.rating + 
        (differential - p2.diff) * (p1.rating - p2.rating) / (p1.diff - p2.diff);
      
      // Round to nearest 0.5. If exactly .25 or .75, it rounds up to the next 0.5.
      // e.g., 2.1 -> 2.0; 2.25 -> 2.5; 2.6 -> 2.5; 2.75 -> 3.0
      return Math.round(interpolatedRating * 2) / 2;
    }
  }
  
  // Fallback for anything not caught, though logic should cover ranges.
  // If differential is very close to the lowest point p2.diff (e.g., -0.99 for p2.diff = -1.0)
  if (Math.abs(differential - wingspanPoints[wingspanPoints.length-1].diff) < epsilon) {
    return wingspanPoints[wingspanPoints.length-1].rating;
  }
  
  // Default to 1.0 if it's some edge case not perfectly fitting (e.g., slightly above -1.0 but not matching other rule)
  // This should ideally not be hit if the scale and logic are comprehensive.
  return 1.0; 
};


// Calculate overall 0-10 score
const calculateOverallRating = (data: NbaProspectFormData): number => {
  const agePy = data.age; 
  const heightPy = data.height; 
  const wingspanPy = data.wingspan; 
  const positionPy = data.position;

  const ageRating = getAgeRatingPy(agePy); // 1-10
  const heightRating = getHeightRatingPy(heightPy, positionPy); // 1-10 (can be x.5)
  const wingspanDifferential = wingspanPy - heightPy;
  const wingspanRating = getWingspanRatingPy(wingspanDifferential); // 1-10 (can be x.5)

  // Normalize 1-10 ratings to 0-1 scores. Handles cases where rating might be 0 or less if source data changes.
  const normAgeScore = Math.max(0, (ageRating - 1) / (10 - 1)); 
  const normHeightScore = Math.max(0, (heightRating - 1) / (10 - 1)); 
  const normWingspanScore = Math.max(0, (wingspanRating - 1) / (10 - 1)); 

  // Weighted sum for overall score, targeting a 0-10 scale.
  // Weights: Age (30% -> 3.0), Height (35% -> 3.5), Wingspan (35% -> 3.5)
  const overallScoreOutOf10 = (normAgeScore * 3.0) + (normHeightScore * 3.5) + (normWingspanScore * 3.5);
  
  return Math.max(0, Math.min(10, overallScoreOutOf10)); // Ensure score is within 0-10 range.
};


export default function NbaProspectPhysicalRater() {
  const [ratingResult, setRatingResult] = useState<number | null>(null);
  const [individualRatings, setIndividualRatings] = useState<{age: number, height: number, wingspan: number} | null>(null);

  const form = useForm<NbaProspectFormData>({
    resolver: zodResolver(NbaProspectSchema),
    defaultValues: {
      age: undefined,
      height: "", 
      wingspan: "", 
      position: undefined,
    },
    mode: "onChange" 
  });

  function onSubmit(data: NbaProspectFormData) { 
    const ageRating = getAgeRatingPy(data.age);
    const heightRating = getHeightRatingPy(data.height, data.position);
    const wingspanDifferential = data.wingspan - data.height;
    const wingspanRating = getWingspanRatingPy(wingspanDifferential);
    
    setIndividualRatings({
        age: ageRating,
        height: heightRating,
        wingspan: wingspanRating
    });

    const overallRating = calculateOverallRating(data); // This will be 0-10
    setRatingResult(overallRating);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">NBA Prospect Physical Rater</CardTitle>
        <CardDescription>
          Input age, height (e.g., 6'5" or 6'5.5), wingspan (e.g., 6'8" or 6'8.5), and position to get a physical rating score (0-10). Individual ratings (1-10) for age, height, and wingspan differential are also shown.
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
                  <p className="text-3xl font-bold text-accent">{ratingResult.toFixed(2)}/10</p>
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
