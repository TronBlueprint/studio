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

const calculateRating = (data: NbaProspectFormData): number => {
  let ageScore = 0;
  let heightScore = 0;
  let wingspanScore = 0;

  // Age Score (max 30)
  ageScore = Math.max(0, 30 - (data.age - 18) * 2.5); // Younger is better, scaled more aggressively

  // Height Score (max 35) & Wingspan Score (max 35) - positional
  const apeIndex = data.wingspan - data.height;
  let idealHeight = 76; // PG default
  let idealApeIndex = 4; // PG default

  switch (data.position) {
    case 'PG':
      idealHeight = 76; idealApeIndex = 4; break;
    case 'SG':
      idealHeight = 78; idealApeIndex = 5; break;
    case 'SF':
      idealHeight = 80; idealApeIndex = 6; break;
    case 'PF':
      idealHeight = 82; idealApeIndex = 6; break;
    case 'C':
      idealHeight = 84; idealApeIndex = 7; break;
  }
  
  heightScore = Math.max(0, 35 - Math.abs(data.height - idealHeight) * 3);
  wingspanScore = Math.max(0, 35 - Math.abs(apeIndex - idealApeIndex) * 3);

  return Math.max(0, Math.min(100, Math.round(ageScore + heightScore + wingspanScore)));
};

export default function NbaProspectPhysicalRater() {
  const [ratingResult, setRatingResult] = useState<number | null>(null);

  const form = useForm<NbaProspectFormData>({
    resolver: zodResolver(NbaProspectSchema),
    defaultValues: {
      age: undefined,
      height: undefined,
      wingspan: undefined,
      position: undefined,
    },
  });

  function onSubmit(data: NbaProspectFormData) {
    const rating = calculateRating(data);
    setRatingResult(rating);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">NBA Prospect Physical Rater</CardTitle>
        <CardDescription>
          Input age, height, wingspan, and position to get a physical rating score.
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
                  <FormLabel>Age (years)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 19" {...field} />
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
                  <FormLabel>Height (inches)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 77" {...field} />
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
                  <FormLabel>Wingspan (inches)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 80" {...field} />
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
            {ratingResult !== null && (
              <>
                <Separator />
                <div className="text-center p-4 bg-accent/10 rounded-md">
                  <h3 className="text-lg font-semibold text-accent-foreground">Physical Rating Score</h3>
                  <p className="text-3xl font-bold text-accent">{ratingResult}/100</p>
                </div>
              </>
            )}
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
