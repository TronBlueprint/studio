
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AthleticismFormData, AthleticismSchema } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';

// calculatePercentile matches the Python version.
// Python: (value - min_val) / (max_val - min_val) * 100
// For speed/agility, a lower raw score is better, so a raw score of 45 (min) should be 0th percentile.
// For vertical, a higher raw score is better, so a raw score of 99 (max) should be 100th percentile.
const calculatePercentile = (value: number, min: number, max: number, lowerIsBetter: boolean = false): number => {
  if (min === max) return 50; 
  
  const clampedValue = Math.max(min, Math.min(max, value));

  let score: number;
  if (lowerIsBetter) {
    // If lower is better, a min_val input should give 0 percentile.
    // (clampedValue - min_val) / (max_val - min_val) - this would make min_val = 0 percentile.
    // The Python code implies this directly for speed/agility by not inverting.
    score = (clampedValue - min) / (max - min);
  } else {
    // Higher is better (like vertical jump)
    score = (clampedValue - min) / (max - min);
  }
  return Math.max(0, Math.min(100, score * 100));
};

export default function AthletcismPercentileCalculator() {
  const [percentileResult, setPercentileResult] = useState<number | null>(null);
  const [individualPercentiles, setIndividualPercentiles] = useState<{speed: number, agility: number, vertical: number} | null>(null);

  const form = useForm<AthleticismFormData>({
    resolver: zodResolver(AthleticismSchema),
    defaultValues: {
      speed: undefined,
      agility: undefined,
      vertical: undefined,
    },
  });

  function onSubmit(data: AthleticismFormData) {
    // Speed (45-95), Agility (45-95) - Python logic implies direct percentile (lower raw score = lower percentile)
    // Vertical (50-99) - Python logic implies direct percentile (higher raw score = higher percentile)
    const speedPercentile = calculatePercentile(data.speed, 45, 95, true); // True: lower value is better, but percentile calc is direct
    const agilityPercentile = calculatePercentile(data.agility, 45, 95, true); // True: lower value is better, but percentile calc is direct
    const verticalPercentile = calculatePercentile(data.vertical, 50, 99, false); // False: higher value is better

    const overallPercentile = (speedPercentile + agilityPercentile + verticalPercentile) / 3;
    setPercentileResult(overallPercentile);
    setIndividualPercentiles({
      speed: speedPercentile,
      agility: agilityPercentile,
      vertical: verticalPercentile
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Athleticism Percentile</CardTitle>
        <CardDescription>
          Input estimated athletic ratings (not raw test data).
          Calculates overall athleticism percentile. Speed/Agility: lower rating is better. Vertical: higher rating is better.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="speed"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Speed Rating</FormLabel>
                  <FormControl>
                    <Input type="number" step="1" placeholder="45-95 (lower is better)" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="agility"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Agility Rating</FormLabel>
                  <FormControl>
                    <Input type="number" step="1" placeholder="45-95 (lower is better)" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="vertical"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vertical Rating</FormLabel>
                  <FormControl>
                    <Input type="number" step="1" placeholder="50-99 (higher is better)" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex flex-col items-stretch gap-4">
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90">Calculate Percentile</Button>
            {percentileResult !== null && individualPercentiles !== null && (
              <>
                <Separator />
                <div className="text-center p-4 bg-accent/10 rounded-md w-full">
                  <h3 className="text-lg font-semibold text-accent-foreground">Overall Athleticism Percentile</h3>
                  <p className="text-3xl font-bold text-accent">{percentileResult.toFixed(2)}%</p>
                  <div className="mt-2 text-sm text-muted-foreground">
                    <p>Speed: {individualPercentiles.speed.toFixed(2)}%</p>
                    <p>Agility: {individualPercentiles.agility.toFixed(2)}%</p>
                    <p>Vertical: {individualPercentiles.vertical.toFixed(2)}%</p>
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

