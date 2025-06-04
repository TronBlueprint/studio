"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ListChecks } from 'lucide-react';

interface Averages {
  points: number;
  rebounds: number;
  assists: number;
  games: number;
}

export default function PlayerCategoryAveragesCalculator() {
  const [statsInput, setStatsInput] = useState<string>('');
  const [averages, setAverages] = useState<Averages | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = () => {
    setError(null);
    setAverages(null);

    const lines = statsInput.trim().split('\n');
    if (lines.length === 0 || (lines.length === 1 && lines[0].trim() === '')) {
      setError("Please enter player statistics.");
      return;
    }

    let totalPoints = 0;
    let totalRebounds = 0;
    let totalAssists = 0;
    let gameCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line === '') continue; // Skip empty lines

      const parts = line.split(/\s+/); // Split by one or more spaces
      if (parts.length !== 3) {
        setError(`Error on line ${i + 1}: Each line must contain 3 numbers (Points Rebounds Assists). Found ${parts.length} part(s).`);
        return;
      }

      const points = parseFloat(parts[0]);
      const rebounds = parseFloat(parts[1]);
      const assists = parseFloat(parts[2]);

      if (isNaN(points) || isNaN(rebounds) || isNaN(assists)) {
        setError(`Error on line ${i + 1}: All values must be numbers.`);
        return;
      }
      if (points < 0 || rebounds < 0 || assists < 0) {
        setError(`Error on line ${i+1}: Stats cannot be negative.`)
        return;
      }


      totalPoints += points;
      totalRebounds += rebounds;
      totalAssists += assists;
      gameCount++;
    }

    if (gameCount === 0) {
      setError("No valid game data found.");
      return;
    }

    setAverages({
      points: totalPoints / gameCount,
      rebounds: totalRebounds / gameCount,
      assists: totalAssists / gameCount,
      games: gameCount,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Player Category Averages</CardTitle>
        <CardDescription>
          Enter player game statistics (Points Rebounds Assists per line) to calculate averages.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="stats-input">Player Statistics (PTS REB AST per line)</Label>
          <Textarea
            id="stats-input"
            value={statsInput}
            onChange={(e) => setStatsInput(e.target.value)}
            placeholder="e.g.,\n20 10 5\n15 8 7\n25 12 3"
            rows={6}
            className="font-code mt-1"
          />
        </div>
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex flex-col items-stretch gap-4">
        <Button onClick={handleCalculate} className="w-full bg-primary hover:bg-primary/90">
            <ListChecks className="mr-2 h-4 w-4" /> Calculate Averages
        </Button>
        {averages && (
          <>
            <Separator />
            <div className="text-left p-4 bg-accent/10 rounded-md w-full">
              <h3 className="text-lg font-semibold text-accent-foreground mb-2 text-center">Averages over {averages.games} games:</h3>
              <ul className="space-y-1 list-disc list-inside">
                <li><strong>Points:</strong> {averages.points.toFixed(1)} PPG</li>
                <li><strong>Rebounds:</strong> {averages.rebounds.toFixed(1)} RPG</li>
                <li><strong>Assists:</strong> {averages.assists.toFixed(1)} APG</li>
              </ul>
            </div>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
