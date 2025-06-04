
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

// calculatePercentile matches the Python version when inverted is false.
// Python: (value - min_val) / (max_val - min_val) * 100
// TS (inverted=false): (clampedValue - min) / (max - min) * 100
const calculatePercentile = (value: number, min: number, max: number, inverted: boolean = false): number => {
  if (min === max) return 50; // Avoid division by zero, return mid-percentile
  
  // Clamp value to min/max range before calculation
  const clampedValue = Math.max(min, Math.min(max, value));

  const score = inverted ? (max - clampedValue) / (max - min) : (clampedValue - min) / (max - min);
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
    // Per user's Python code, calculations are not inverted for speed/agility.
    // Speed (45-95), Agility (45-95), Vertical (50-99)
    const speedPercentile = calculatePercentile(data.speed, 45, 95, false); 
    const agilityPercentile = calculatePercentile(data.agility, 45, 95, false);
    const verticalPercentile = calculatePercentile(data.vertical, 50, 99, false);

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
          Input scores for speed, agility, and vertical jump to calculate overall athleticism percentile.
          Lower scores are better for Speed and Agility. Higher scores are better for Vertical.
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
                  <FormLabel>Speed Score (45-95)</FormLabel>
                  <FormControl>
                    <Input type="number" step="1" placeholder="e.g., 80 (lower is better)" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
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
                  <FormLabel>Agility Score (45-95)</FormLabel>
                  <FormControl>
                    <Input type="number" step="1" placeholder="e.g., 75 (lower is better)" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
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
                  <FormLabel>Vertical Score (50-99)</FormLabel>
                  <FormControl>
                    <Input type="number" step="1" placeholder="e.g., 85 (higher is better)" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
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
