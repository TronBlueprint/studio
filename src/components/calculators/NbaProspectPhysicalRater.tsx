
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { NbaProspectFormData, NbaProspectSchema, POSITIONS } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, RotateCcw } from "lucide-react";

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
  const ratings = Array.from({ length: 10 }, (_, i) => i + 1); // Ratings 1-10
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
  { diff: 0.5, rating: 2.5 }, { diff: 0.25, rating: 2.25 }, { diff: 0.0, rating: 2.0 }, 
  { diff: -0.5, rating: 1.5 }, { diff: -1.0, rating: 1.0 } 
].sort((a, b) => b.diff - a.diff); // Ensure descending order by diff for correct iteration

const getWingspanRatingPy = (differential: number): number => {
  const epsilon = 0.0001; 

  if (differential >= wingspanPoints[0].diff - epsilon) {
    return wingspanPoints[0].rating; 
  }
  if (differential <= wingspanPoints[wingspanPoints.length - 1].diff + epsilon) {
    return wingspanPoints[wingspanPoints.length - 1].rating; 
  }

  for (let i = 0; i < wingspanPoints.length - 1; i++) {
    const p1 = wingspanPoints[i]; // Current point (higher differential)
    const p2 = wingspanPoints[i+1]; // Next point (lower differential)

    // Exact match for the higher point of the current segment
    if (Math.abs(differential - p1.diff) < epsilon) return p1.rating;
    
    // If differential is between p1.diff and p2.diff (exclusive of p1.diff, inclusive of p2.diff for this loop pass)
    if (differential < p1.diff && differential >= p2.diff - epsilon) {
      // Check for exact match with p2.diff
      if (Math.abs(differential - p2.diff) < epsilon) return p2.rating;

      // Interpolate
      const interpolatedRating = p2.rating + 
        (differential - p2.diff) * (p1.rating - p2.rating) / (p1.diff - p2.diff);
      // Round to nearest 0.5, with .25 rounding up to .5, and .75 rounding up to .0 of next number
      return Math.round(interpolatedRating * 2) / 2;
    }
  }
  
   if (Math.abs(differential - wingspanPoints[wingspanPoints.length-1].diff) < epsilon) {
    return wingspanPoints[wingspanPoints.length-1].rating;
  }
  
  return 1.0; 
};


export default function NbaProspectPhysicalRater() {
  const [individualRatings, setIndividualRatings] = useState<{age: number, height: number, wingspan: number} | null>(null);

  const form = useForm<NbaProspectFormData>({
    resolver: zodResolver(NbaProspectSchema),
    defaultValues: {
      age: '', 
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
  }

  const handleReset = () => {
    form.reset();
    setIndividualRatings(null);
  };

  return (
    <Card>
      <CardHeader className="pb-2 md:pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="font-headline">Physical Rater</CardTitle>
            <TooltipProvider>
              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" align="start" className="max-w-sm">
                  <p className="text-sm">
                    Enter prospect's age (e.g., 19.75 for 19 years and 9 months; range 17-30), 
                    height (e.g., 6'5" or 6'5.5"), wingspan (e.g., 6'8" or 6'8.25"), and position.
                    Height/wingspan can include .25, .5, .75 fractions (e.g., 6'5.25").
                    Calculates individual 1-10 ratings for age, height, and wingspan differential.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Button variant="ghost" size="icon" onClick={handleReset} className="text-muted-foreground hover:text-foreground">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="focus:outline-none">
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
                            "focus:bg-primary/30 dark:focus:bg-primary/40 focus:text-primary-foreground data-[highlighted]:bg-primary/30 dark:data-[highlighted]:bg-primary/40 data-[highlighted]:text-primary-foreground"
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
            <Button type="submit" variant="primaryGlass" className="w-full">Calculate Individual Ratings</Button>
            {individualRatings !== null && (
              <>
                <Separator />
                <div className="text-center p-6 w-full bg-primary/[.18] dark:bg-primary/[.25] text-primary-foreground backdrop-blur-xl border border-primary/[.25] dark:border-primary/[.35] shadow-primary-glass-shadow ring-1 ring-inset ring-white/30 dark:ring-white/20 rounded-xl">
                  <div className="text-base text-primary-foreground space-y-1 mb-2">
                    <p>Age Rating: {individualRatings.age.toFixed(1)}/10</p>
                    <p>Height Rating: {individualRatings.height.toFixed(1)}/10</p>
                    <p>Wingspan Rating: {individualRatings.wingspan.toFixed(1)}/10</p>
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

    