
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

const calculatePercentile = (value: number, min: number, max: number, lowerIsBetter: boolean = false): number => {
  if (min === max) return 50; 
  
  const clampedValue = Math.max(min, Math.min(max, value));

  let score: number;
  if (lowerIsBetter) {
    score = (clampedValue - min) / (max - min);
  } else {
    score = (clampedValue - min) / (max - min);
  }
  // For speed/agility, if using the direct formula (value - min) / (max - min) * 100:
  // A lower raw score (better performance) will result in a lower percentile.
  // Example: Speed 45 (min) -> (45-45)/(95-45)*100 = 0 percentile.
  // Speed 95 (max) -> (95-45)/(95-45)*100 = 100 percentile.
  // This matches the Python logic provided where it doesn't invert for speed/agility.
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
    const speedPercentile = calculatePercentile(data.speed, 45, 95, true); 
    const agilityPercentile = calculatePercentile(data.agility, 45, 95, true);
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
          Input estimated athletic ratings. Calculates overall athleticism percentile.
          For Speed and Agility ratings, a lower value is considered better.
          For Vertical rating, a higher value is better. Ensure inputs are within the specified ranges.
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
                    <Input type="number" step="1" placeholder="45-95" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
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
                    <Input type="number" step="1" placeholder="45-95" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
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
                    <Input type="number" step="1" placeholder="50-99" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
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
