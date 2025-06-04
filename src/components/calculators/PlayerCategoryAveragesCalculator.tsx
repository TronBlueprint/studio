
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ListChecks } from 'lucide-react';
import { PlayerAverages, CATEGORY_KEYS_PLAYER_AVG } from '@/lib/types';


const placeholderText = `#### Player Name: [Enter Player Name Here]

###### Offense:
Shooting: [Numeric Value e.g. 7.5]
Finishing: [Numeric Value]
Shot Creation: [Numeric Value]
Passing: [Numeric Value]
Dribbling: [Numeric Value]

###### Defense:
Perimeter: [Numeric Value]
Interior: [Numeric Value]
Playmaking: [Numeric Value]

###### Physicals:
Athleticism: [Numeric Value]
Age: [Numeric Value (as a rating, not raw age)]
Height: [Numeric Value (as a rating)]
Wingspan: [Numeric Value (as a rating)]

###### Summary:
NBA Ready: [Numeric Value]
Potential Min: [Numeric Value]
Potential Mid: [Numeric Value]
Potential Max: [Numeric Value]
`;

function roundHalfUp(num: number, decimals: number = 1): number {
  if (isNaN(num)) return num;
  const multiplier = Math.pow(10, decimals);
  // Standard Math.round in JS rounds .5 to the nearest even integer for some implementations,
  // but typically rounds to the nearest integer, with .5 rounding up (away from zero for negatives).
  // For positive numbers, this works like ROUND_HALF_UP.
  return Math.round(num * multiplier) / multiplier;
}

function parsePlayerAveragesData(textInput: string): PlayerAverages | null {
  const lines = textInput.split('\n').map(line => line.trim()).filter(line => line);
  if (lines.length < 3) return null; // Basic check for minimal data

  let playerName = "Unknown Player";
  const categoriesData: { [key: string]: number[] } = {
    Offense: [], Defense: [], Physicals: [], Summary: []
  };
  let currentCategoryName: keyof typeof CATEGORY_KEYS_PLAYER_AVG | null = null;

  for (const line of lines) {
    if (line.startsWith("#### ")) {
      playerName = line.substring("#### ".length).replace(":", "").trim();
    } else if (line.startsWith("###### ")) {
      const categoryHeader = line.substring("###### ".length).replace(":", "").trim();
      if (categoryHeader in CATEGORY_KEYS_PLAYER_AVG) {
        currentCategoryName = categoryHeader as keyof typeof CATEGORY_KEYS_PLAYER_AVG;
      } else {
        currentCategoryName = null;
      }
    } else if (currentCategoryName && line.includes(":")) {
      const parts = line.split(":", 2);
      const keyPartRaw = parts[0].trim().replace(/[*_~]/g, "").replace(/:$/, "");
      const valuePartRaw = parts[1].trim();

      if (CATEGORY_KEYS_PLAYER_AVG[currentCategoryName].includes(keyPartRaw)) {
        const numericCandidateStr = valuePartRaw.split("|", 1)[0].trim().replace(/[*_~]/g, "");
        try {
          const numericValue = parseFloat(numericCandidateStr);
          if (!isNaN(numericValue) && numericValue >= 0) { // Assuming ratings are non-negative
            categoriesData[currentCategoryName].push(numericValue);
          }
        } catch (e) {
          // console.warn(`Failed to parse value for ${keyPartRaw}: ${numericCandidateStr}`);
        }
      }
    }
  }

  const categoryAverages: Partial<PlayerAverages> = {};
  const validCategoryAveragesForOverall: number[] = [];

  for (const catName of Object.keys(CATEGORY_KEYS_PLAYER_AVG) as Array<keyof typeof CATEGORY_KEYS_PLAYER_AVG>) {
    const valuesList = categoriesData[catName];
    if (valuesList && valuesList.length > 0) {
      const average = valuesList.reduce((sum, val) => sum + val, 0) / valuesList.length;
      const roundedAverage = roundHalfUp(average, 1);
      categoryAverages[catName.toLowerCase() as keyof PlayerAverages] = roundedAverage;
      if (catName !== "Summary") { // Exclude 'Summary' from overall calculation base
        validCategoryAveragesForOverall.push(roundedAverage);
      }
    } else {
      categoryAverages[catName.toLowerCase() as keyof PlayerAverages] = "N/A";
    }
  }
  
  let overallRating = 0;
  if (validCategoryAveragesForOverall.length > 0) {
    overallRating = roundHalfUp(validCategoryAveragesForOverall.reduce((sum, val) => sum + val, 0) / validCategoryAveragesForOverall.length, 1);
  } else if (Object.values(categoriesData).some(arr => arr.length > 0)) {
     overallRating = 0; // Some data existed but all filtered out for overall
  } else {
    // No valid data at all
    return {
      playerName,
      overallRating: 0,
      offense: categoryAverages.offense ?? "N/A",
      defense: categoryAverages.defense ?? "N/A",
      physicals: categoryAverages.physicals ?? "N/A",
      summary: categoryAverages.summary ?? "N/A",
    };
  }


  return {
    playerName,
    overallRating,
    offense: categoryAverages.offense ?? "N/A",
    defense: categoryAverages.defense ?? "N/A",
    physicals: categoryAverages.physicals ?? "N/A",
    summary: categoryAverages.summary ?? "N/A",
  };
}


export default function PlayerCategoryAveragesCalculator() {
  const [statsInput, setStatsInput] = useState<string>(placeholderText);
  const [averages, setAverages] = useState<PlayerAverages | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = () => {
    setError(null);
    setAverages(null);

    if (!statsInput.trim() || statsInput.trim() === placeholderText.trim() || statsInput.trim().split('\n').length < 3) {
      setError("Please provide sufficient player data in the expected format.");
      return;
    }

    const parsedData = parsePlayerAveragesData(statsInput);

    if (parsedData) {
      // Check if all averages are "N/A" which might mean no valid numeric data was found in any category.
      const allNA = parsedData.offense === "N/A" && parsedData.defense === "N/A" && parsedData.physicals === "N/A" && parsedData.summary === "N/A";
      if (parsedData.overallRating === 0 && allNA && !statsInput.includes("#### Player Name:")) { // Heuristic: if overall is 0 AND all cats are N/A AND no player name line, likely bad parse
         setError("Could not parse data. Ensure format is correct and numeric values are provided for categories.");
         return;
      }
      setAverages(parsedData);
    } else {
      setError("Error parsing data. Please check input format and values. Ensure numeric values are provided for ratings.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Player Category Averages</CardTitle>
        <CardDescription>
          Paste player report data (structured as shown in placeholder) to calculate category averages and overall rating.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="stats-input">Player Report Data</Label>
          <Textarea
            id="stats-input"
            value={statsInput}
            onChange={(e) => setStatsInput(e.target.value)}
            placeholder={placeholderText}
            rows={15}
            className="font-code mt-1 text-xs"
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
              <h3 className="text-lg font-semibold text-accent-foreground mb-2 text-center">
                Averages for: {averages.playerName}
              </h3>
              <p className="text-2xl font-bold text-accent text-center mb-3">
                Overall Rating: {averages.overallRating}
              </p>
              <ul className="space-y-1 list-none pl-0 md:columns-2">
                <li><strong>Offense Avg:</strong> {averages.offense}</li>
                <li><strong>Defense Avg:</strong> {averages.defense}</li>
                <li><strong>Physicals Avg:</strong> {averages.physicals}</li>
                <li><strong>Summary Fields Avg:</strong> {averages.summary}</li>
              </ul>
            </div>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
