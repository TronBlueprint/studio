
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AthleticismFormData, AthleticismSchema } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

const calculatePercentile = (value: number, min: number, max: number, lowerIsBetter: boolean = false): number => {
  if (min === max) return 50; 
  
  let clampedValue = Math.max(min, Math.min(max, value));

  let score: number;
  if (lowerIsBetter) {
    // For lower is better, a raw value equal to min_val is 100th percentile, max_val is 0th.
    // This was the original interpretation based on "lower is better = true"
    // score = (max_val - clampedValue) / (max_val - min_val);
    // Based on Python code provided (03/28), it should be direct:
    score = (clampedValue - min) / (max - min);
  } else {
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
    // As per Python code: Speed and Agility (45-95 range) direct percentile. Lower raw score = lower percentile.
    const speedPercentile = calculatePercentile(data.speed, 45, 95, false); 
    const agilityPercentile = calculatePercentile(data.agility, 45, 95, false);
    // Vertical (50-99 range) direct percentile. Higher raw score = higher percentile.
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
        <div className="flex items-center justify-between">
          <CardTitle className="font-headline">Athleticism Percentile</CardTitle>
          <TooltipProvider>
            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild>
                <Info className="h-5 w-5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" align="end" className="max-w-sm">
                <p className="text-sm text-muted-foreground">
                  Input estimated athletic ratings. Calculates overall athleticism percentile.
                  For Speed and Agility ratings (45-95), a lower raw value means better performance but results in a lower percentile.
                  For Vertical rating (50-99), a higher raw value means better performance and results in a higher percentile.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
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
