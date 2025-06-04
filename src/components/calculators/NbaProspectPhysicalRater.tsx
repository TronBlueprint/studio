
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
  
  const thresholds = Array.from({ length: 10 }, (_, i) => start + i); // For ratings 1-10, this covers start to start+9
  const ratings = Array.from({ length: 10 }, (_, i) => i + 1);
  return { thresholds, ratings };
};

const getHeightRatingPy = (heightIn: number, position: NbaProspectFormData['position']): number => {
  const { thresholds, ratings } = getPositionThresholdsPy(position);

  if (heightIn < thresholds[0]) return 1.0; 
  // The last threshold (thresholds[9]) corresponds to rating 10. 
  // If height is >= thresholds[9] (e.g. start+9 for C is 76+9=85), it gets rating 10.
  if (heightIn >= thresholds[thresholds.length - 1]) return 10.0; 

  for (let i = 0; i < thresholds.length -1; i++) { // Iterate up to the second to last threshold
    const lowerThresh = thresholds[i];
    const upperThresh = thresholds[i+1]; // Next threshold
    
    if (Math.abs(heightIn - lowerThresh) < 0.01) { // Exact match with lowerThresh
        return ratings[i];
    }

    if (heightIn > lowerThresh && heightIn < upperThresh) { // Between two thresholds
        const midPoint = (lowerThresh + upperThresh) / 2.0;
        if (Math.abs(heightIn - midPoint) < 0.01) { // Exactly halfway
            return (ratings[i] + ratings[i+1]) / 2.0;
        } else if (heightIn < midPoint) { // Closer to lower threshold
            return ratings[i];
        } else { // Closer to upper threshold
            return ratings[i+1];
        }
    }
  }
   // Should be caught by initial checks or loop, but as a final fallback for >= last threshold
  if (Math.abs(heightIn - thresholds[thresholds.length - 1]) < 0.01) {
      return ratings[thresholds.length - 1];
  }
  return 1.0; // Default fallback, though logic should cover cases.
};


const wingspanPoints = [
  { diff: 7.0, rating: 10.0 }, { diff: 6.5, rating: 9.5 }, { diff: 6.0, rating: 9.0 },
  { diff: 5.5, rating: 8.5 }, { diff: 5.0, rating: 8.0 }, { diff: 4.75, rating: 7.5 },
  { diff: 4.5, rating: 7.0 }, { diff: 4.25, rating: 6.5 }, { diff: 4.0, rating: 6.0 },
  { diff: 3.5, rating: 5.5 }, { diff: 3.0, rating: 5.0 }, { diff: 2.5, rating: 4.5 },
  { diff: 2.0, rating: 4.0 }, { diff: 1.5, rating: 3.5 }, { diff: 1.0, rating: 3.0 },
  { diff: 0.5, rating: 2.5 }, { diff: 0.25, rating: 2.25}, // Special case from user: 0.25 diff should result in rating 2.25 BEFORE rounding.
  { diff: 0.0, rating: 2.0 }, 
  { diff: -0.5, rating: 1.5 },
  { diff: -1.0, rating: 1.0 } 
].sort((a, b) => b.diff - a.diff);

const getWingspanRatingPy = (differential: number): number => {
  const epsilon = 0.0001;

  if (differential >= wingspanPoints[0].diff - epsilon) {
    return wingspanPoints[0].rating;
  }
  if (differential <= wingspanPoints[wingspanPoints.length - 1].diff + epsilon) {
    return wingspanPoints[wingspanPoints.length - 1].rating;
  }

  for (let i = 0; i < wingspanPoints.length - 1; i++) {
    const p1 = wingspanPoints[i];    
    const p2 = wingspanPoints[i+1];  

    if (Math.abs(differential - p1.diff) < epsilon) return p1.rating;
    
    if (differential < p1.diff && differential > p2.diff) {
      // Linear interpolation: y = y1 + (x - x1) * (y2 - y1) / (x2 - x1)
      // Where x is differential, y is rating.
      // (x1,y1) = (p2.diff, p2.rating) and (x2,y2) = (p1.diff, p1.rating) for calculation
      const interpolatedRating = p2.rating + 
        (differential - p2.diff) * (p1.rating - p2.rating) / (p1.diff - p2.diff);
      
      // Round to nearest 0.5. If exactly .25 or .75, it rounds up to the next 0.5.
      // Example: 2.1 -> 2.0; 2.25 -> 2.5; 2.6 -> 2.5; 2.75 -> 3.0
      return Math.round(interpolatedRating * 2) / 2;
    }
  }
  
  // Fallback for exact match on the last point if not caught by the initial <= check due to epsilon logic
  if (Math.abs(differential - wingspanPoints[wingspanPoints.length-1].diff) < epsilon) {
    return wingspanPoints[wingspanPoints.length-1].rating;
  }
  
  return 1.0; // Default fallback
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

  // Normalize 1-10 ratings to 0-1 scores.
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
      age: undefined, // Allow for XX.XX input
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
          Enter prospect's age (e.g., 19 or 19.75), height (e.g., 6'5" or 6'5.5"), wingspan (e.g., 6'8" or 6'8.25"), and position.
          Calculates an overall physical rating (0.0-10.0) and individual 1-10 ratings for age, height, and wingspan differential.
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
                  <FormLabel>Age (e.g., 19 or 19.5, range: 17-30)</FormLabel>
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
                  <FormLabel>Wingspan (e.g., 6'8" or 6'8.25")</FormLabel>
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

