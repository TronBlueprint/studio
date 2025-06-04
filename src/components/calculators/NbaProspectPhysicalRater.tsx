
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
  }

  for (let i = 0; i < thresholds.length - 1; i++) {
    const lowerThresh = thresholds[i];
    const upperThresh = thresholds[i+1];
    const midPoint = (lowerThresh + upperThresh) / 2.0;

    if (lowerThresh <= heightIn && heightIn < upperThresh) {
      if (Math.abs(heightIn - midPoint) < 0.01) { 
        return (ratings[i] + ratings[i+1]) / 2.0;
      } else if (heightIn < midPoint) {
        return ratings[i];
      } else {
        return ratings[i+1];
      }
    }
  }
  
  if (heightIn >= thresholds[thresholds.length - 2] && heightIn < thresholds[thresholds.length - 1]) {
     return ratings[ratings.length -2];
  }

  return 10.0; 
};

const wingspanPoints = [
  { diff: 7.0, rating: 10.0 }, { diff: 6.5, rating: 9.5 }, { diff: 6.0, rating: 9.0 },
  { diff: 5.5, rating: 8.5 }, { diff: 5.0, rating: 8.0 }, { diff: 4.75, rating: 7.5 },
  { diff: 4.5, rating: 7.0 }, { diff: 4.25, rating: 6.5 }, { diff: 4.0, rating: 6.0 },
  { diff: 3.5, rating: 5.5 }, { diff: 3.0, rating: 5.0 }, { diff: 2.5, rating: 4.5 },
  { diff: 2.0, rating: 4.0 }, { diff: 1.5, rating: 3.5 }, { diff: 1.0, rating: 3.0 },
  { diff: 0.5, rating: 2.5 },
  { diff: 0.25, rating: 0.5 }, // User's example point
  { diff: 0.0, rating: 2.0 },
  { diff: -0.5, rating: 1.5 },
  { diff: -1.0, rating: 1.0 }
].sort((a, b) => b.diff - a.diff); // Sort by diff in descending order for processing

const getWingspanRatingPy = (differential: number): number => {
  const epsilon = 0.0001; // For floating point comparisons

  if (differential >= wingspanPoints[0].diff - epsilon) { // Max diff (7.0) or more
    return wingspanPoints[0].rating; // 10.0
  }
  if (differential <= wingspanPoints[wingspanPoints.length - 1].diff + epsilon) { // Min diff (-1.0) or less
    return wingspanPoints[wingspanPoints.length - 1].rating; // 1.0
  }

  for (let i = 0; i < wingspanPoints.length - 1; i++) {
    const p1 = wingspanPoints[i];     // Current point (higher differential)
    const p2 = wingspanPoints[i+1];   // Next point (lower differential)

    // Check for exact match with p1.diff 
    if (Math.abs(differential - p1.diff) < epsilon) return p1.rating;
    // Check for exact match with p2.diff
    if (Math.abs(differential - p2.diff) < epsilon) return p2.rating;

    // If differential is between p2.diff and p1.diff (exclusive)
    if (differential < p1.diff && differential > p2.diff) {
      // Linear interpolation: rating = r2 + (d - d2) * (r1 - r2) / (d1 - d2)
      const interpolatedRating = p2.rating + 
        (differential - p2.diff) * (p1.rating - p2.rating) / (p1.diff - p2.diff);
      
      // Round to nearest 0.5, with halves (.25, .75) rounding up to the next 0.5 increment.
      // Math.round(value * 2) / 2 achieves this:
      // e.g., 2.1 -> Math.round(4.2)/2 = 4/2 = 2.0
      // e.g., 2.25 -> Math.round(4.5)/2 = 5/2 = 2.5
      // e.g., 2.4 -> Math.round(4.8)/2 = 5/2 = 2.5
      // e.g., 2.5 -> Math.round(5.0)/2 = 5/2 = 2.5
      // e.g., 2.75 -> Math.round(5.5)/2 = 6/2 = 3.0
      return Math.round(interpolatedRating * 2) / 2;
    }
  }
  
  // Fallback for any case not caught (e.g. if differential is exactly the lowest point after checks)
  // This should ideally be covered by the direct check against wingspanPoints[wingspanPoints.length - 1].diff
  return wingspanPoints[wingspanPoints.length - 1].rating; 
};


// Calculate overall 0-100 score
const calculateOverallRating = (data: NbaProspectFormData): number => {
  const agePy = data.age;
  const heightPy = data.height; 
  const wingspanPy = data.wingspan; 
  const positionPy = data.position;

  const ageRating = getAgeRatingPy(agePy); // 1-10
  const heightRating = getHeightRatingPy(heightPy, positionPy); // 1-10 (can be x.5)
  const wingspanDifferential = wingspanPy - heightPy;
  const wingspanRating = getWingspanRatingPy(wingspanDifferential); // 1-10 (can be x.5)

  // Normalize and weight. Age (30%), Height (35%), Wingspan (35%)
  // Min rating for all is 1, max is 10.
  const normAgeScore = (ageRating - 1) / (10 - 1); 
  const normHeightScore = (heightRating - 1) / (10 - 1); 
  const normWingspanScore = (wingspanRating - 1) / (10 - 1); // Max rating for wingspan is now 10

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
      height: undefined,
      wingspan: undefined,
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

    const overallRating = calculateOverallRating(data);
    setRatingResult(overallRating);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">NBA Prospect Physical Rater</CardTitle>
        <CardDescription>
          Input age, height (inches), wingspan (inches), and position to get a physical rating score (0-100). Individual ratings (1-10) for age, height, and wingspan differential are also shown.
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

