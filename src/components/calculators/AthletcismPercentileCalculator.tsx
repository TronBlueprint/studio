
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

const calculatePercentile = (value: number, min: number, max: number): number => {
  let clampedValue = Math.max(min, Math.min(max, value));
  const percentile = ((clampedValue - min) / (max - min)) * 100;
  return Math.max(0, Math.min(100, percentile));
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
    const speedPercentile = calculatePercentile(data.speed, 45, 95);
    const agilityPercentile = calculatePercentile(data.agility, 45, 95);
    const verticalPercentile = calculatePercentile(data.vertical, 50, 99);

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
                  Input estimated athletic ratings to calculate overall and individual athleticism percentiles.
                  Speed and Agility are rated 45-95 (a raw score of 45 is 0th percentile, 95 is 100th).
                  Vertical is rated 50-99 (a raw score of 50 is 0th percentile, 99 is 100th).
                  Ensure values are within the specified ranges.
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
            <Button type="submit" variant="primaryGlass" className="w-full">Calculate Percentile</Button>
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
