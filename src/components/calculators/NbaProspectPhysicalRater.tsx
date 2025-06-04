
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
import { cn } from '@/lib/utils';

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

  for (let i = 0; i < thresholds.length -1; i++) { 
    const lowerThresh = thresholds[i];
    const upperThresh = thresholds[i+1]; 
    
    if (Math.abs(heightIn - lowerThresh) < 0.01) { 
        return ratings[i];
    }

    if (heightIn > lowerThresh && heightIn < upperThresh) { 
        const midPoint = (lowerThresh + upperThresh) / 2.0;
        if (Math.abs(heightIn - midPoint) < 0.01) { 
            return (ratings[i] + ratings[i+1]) / 2.0;
        } else if (heightIn < midPoint) { 
            return ratings[i];
        } else { 
            return ratings[i+1];
        }
    }
  }
  if (Math.abs(heightIn - thresholds[thresholds.length - 1]) < 0.01) {
      return ratings[thresholds.length - 1];
  }
  return 1.0; 
};


const wingspanPoints = [
  { diff: 7.0, rating: 10.0 }, { diff: 6.5, rating: 9.5 }, { diff: 6.0, rating: 9.0 },
  { diff: 5.5, rating: 8.5 }, { diff: 5.0, rating: 8.0 }, { diff: 4.75, rating: 7.5 },
  { diff: 4.5, rating: 7.0 }, { diff: 4.25, rating: 6.5 }, { diff: 4.0, rating: 6.0 },
  { diff: 3.5, rating: 5.5 }, { diff: 3.0, rating: 5.0 }, { diff: 2.5, rating: 4.5 },
  { diff: 2.0, rating: 4.0 }, { diff: 1.5, rating: 3.5 }, { diff: 1.0, rating: 3.0 },
  { diff: 0.5, rating: 2.5 }, 
  { diff: 0.25, rating: 2.25}, // Special case for interpolation: 0.25 diff should result in an interpolated value of 2.25 before final rounding to nearest 0.5
  { diff: 0.0, rating: 2.0 }, 
  { diff: -0.5, rating: 1.5 },
  { diff: -1.0, rating: 1.0 } 
].sort((a, b) => b.diff - a.diff); // Ensure sorted by diff descending for correct interpolation

const getWingspanRatingPy = (differential: number): number => {
  const epsilon = 0.0001; // For floating point comparisons

  // Handle exact top and bottom of scale
  if (differential >= wingspanPoints[0].diff - epsilon) {
    return wingspanPoints[0].rating; // 10.0 for diff >= 7.0
  }
  if (differential <= wingspanPoints[wingspanPoints.length - 1].diff + epsilon) {
    return wingspanPoints[wingspanPoints.length - 1].rating; // 1.0 for diff <= -1.0
  }

  // Find the two points the differential falls between for interpolation
  for (let i = 0; i < wingspanPoints.length - 1; i++) {
    const p1 = wingspanPoints[i];    // Upper point (larger diff, higher rating)
    const p2 = wingspanPoints[i+1];  // Lower point (smaller diff, lower rating)

    // Exact match for p1.diff (already handled by initial check if p1 is the first point)
    if (Math.abs(differential - p1.diff) < epsilon) return p1.rating;
    
    // If differential is between p1.diff and p2.diff
    if (differential < p1.diff && differential > p2.diff) {
      // Linear interpolation: y = y1 + (x - x1) * (y2 - y1) / (x2 - x1)
      // (x1,y1) = (p2.diff, p2.rating) and (x2,y2) = (p1.diff, p1.rating) for calculation
      const interpolatedRating = p2.rating + 
        (differential - p2.diff) * (p1.rating - p2.rating) / (p1.diff - p2.diff);
      
      // Round to nearest 0.5. If exactly .25 or .75, it rounds up to the next 0.5.
      // Math.round(x * 2) / 2 achieves rounding to nearest 0.5 (e.g., 2.25 -> 2.5, 2.1 -> 2.0, 2.75 -> 3.0)
      return Math.round(interpolatedRating * 2) / 2;
    }
  }
  
  // Fallback for exact match on the last point if not caught (e.g., p2.diff)
   if (Math.abs(differential - wingspanPoints[wingspanPoints.length-1].diff) < epsilon) {
    return wingspanPoints[wingspanPoints.length-1].rating;
  }
  
  return 1.0; // Default fallback if something unexpected happens
};


const calculateOverallRating = (data: NbaProspectFormData): number => {
  const agePy = data.age; 
  const heightPy = data.height; 
  const wingspanPy = data.wingspan; 
  const positionPy = data.position;

  const ageRating = getAgeRatingPy(agePy); 
  const heightRating = getHeightRatingPy(heightPy, positionPy); 
  const wingspanDifferential = wingspanPy - heightPy;
  const wingspanRating = getWingspanRatingPy(wingspanDifferential); 

  const normAgeScore = Math.max(0, (ageRating - 1) / (10 - 1)); 
  const normHeightScore = Math.max(0, (heightRating - 1) / (10 - 1)); 
  const normWingspanScore = Math.max(0, (wingspanRating - 1) / (10 - 1)); 

  const overallScoreOutOf10 = (normAgeScore * 3.0) + (normHeightScore * 3.5) + (normWingspanScore * 3.5);
  
  // Round to one decimal place: e.g. 4.22 -> 4.2, 4.55 -> 4.6
  const roundedOverallScore = Math.round(overallScoreOutOf10 * 10) / 10;

  return Math.max(0, Math.min(10, roundedOverallScore));
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

    const overallRating = calculateOverallRating(data);
    setRatingResult(overallRating);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Physical Rater</CardTitle>
        <CardDescription>
          Enter prospect's age (e.g., 19.75 for 19 years and 9 months), 
          height (e.g., 6'5" or 6'5.5"), wingspan (e.g., 6'8" or 6'8.25"), and position.
          Age input can be a decimal. Height and wingspan can include fractions like .25, .5, .75.
          Calculates an overall physical rating (0.0-10.0) and individual 1-10 ratings.
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
                  <FormLabel>Age</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="e.g., 19.5" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
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
                  <FormLabel>Height</FormLabel>
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
                  <FormLabel>Wingspan</FormLabel>
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
                        <SelectItem 
                          key={pos.value} 
                          value={pos.value}
                          className={cn(
                            "hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground"
                          )}
                        >
                          {pos.label}
                        </SelectItem>
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
                  <p className="text-3xl font-bold text-accent">{ratingResult.toFixed(1)}/10</p>
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
