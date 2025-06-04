
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { PlayerAverages, CATEGORY_KEYS_PLAYER_AVG } from '@/lib/types';

const placeholderText = `Player Name Sample Player

Offense
Shooting: 8
Finishing: 7.5
Shot Creation: 7
Passing: 6.5
Dribbling: 7

Defense
Perimeter: 8
Interior: 6
Playmaking: 5.5

Physicals
Athleticism: 7.5
Age: 19.25 | 9
Height: 6'8 | 8.5
Wingspan: 7'1 | 7

Summary
NBA Ready: 7
Potential Min: 6
Potential Mid: 8
Potential Max: 9.5
`;

function roundHalfUp(num: number, decimals: number = 1): number {
  if (isNaN(num) || typeof num !== 'number') return num;
  const multiplier = Math.pow(10, decimals);
  return Math.round(num * multiplier) / multiplier;
}

function parsePlayerAveragesData(textInput: string): PlayerAverages | null {
  const lines = textInput.split('\n').map(line => line.trim().replace(/^#+\s*/, '')).filter(line => line);
  if (lines.length < 3) return null; 

  let playerName = "Player"; // Default if not found or is placeholder
  const categoriesData: { [key: string]: number[] } = {
    Offense: [], Defense: [], Physicals: [], Summary: []
  };
  let currentCategoryName: keyof typeof CATEGORY_KEYS_PLAYER_AVG | null = null;

  for (const rawLine of lines) {
    const line = rawLine; 

    if (line.toLowerCase().startsWith("player name")) {
      let nameCandidate = line.substring("player name".length).trim().replace(/^[:\s]+/, '');
      if (nameCandidate && nameCandidate.toLowerCase() !== "sample player") {
        playerName = nameCandidate;
      }
      continue;
    }
    
    const categoryMatch = line.match(/^(Offense|Defense|Physicals|Summary)/i);
    if (categoryMatch && categoryMatch[0]) {
        const matchedCategory = categoryMatch[0];
        const foundCategoryKey = Object.keys(CATEGORY_KEYS_PLAYER_AVG).find(key => key.toLowerCase() === matchedCategory.toLowerCase());
        if (foundCategoryKey) {
            currentCategoryName = foundCategoryKey as keyof typeof CATEGORY_KEYS_PLAYER_AVG;
        } else {
            currentCategoryName = null;
        }
        continue;
    }


    if (currentCategoryName && line.includes(":")) {
      const parts = line.split(":", 2); 
      const keyPartRaw = parts[0].trim().replace(/[*_~]/g, "").replace(/:$/, "");
      let valuePartRaw = parts.length > 1 ? parts[1].trim() : "";


      if (CATEGORY_KEYS_PLAYER_AVG[currentCategoryName].includes(keyPartRaw)) {
        let stringToParseForNumber: string;

        if (currentCategoryName === "Physicals" && (keyPartRaw === "Age" || keyPartRaw === "Height" || keyPartRaw === "Wingspan")) {
            const valueSegments = valuePartRaw.split(/\s*\|\s*/); 
            if (valueSegments.length > 1) {
                stringToParseForNumber = valueSegments[valueSegments.length - 1].trim();
            } else {
                stringToParseForNumber = valueSegments[0].trim(); 
            }
        } else {
            stringToParseForNumber = valuePartRaw.split("|", 1)[0].trim();
        }
        
        stringToParseForNumber = stringToParseForNumber.replace(/[*_~]/g, "");
        stringToParseForNumber = stringToParseForNumber.replace(/\s*\(.*?\)\s*$/, "").trim(); 

        try {
          const numericValue = parseFloat(stringToParseForNumber);
          if (!isNaN(numericValue) && numericValue >= 0) { 
            categoriesData[currentCategoryName].push(numericValue);
          }
        } catch (e) {
          // console.warn(`Failed to parse value for ${keyPartRaw}: ${stringToParseForNumber}`);
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
      if (catName !== "Summary") { 
        validCategoryAveragesForOverall.push(roundedAverage);
      }
    } else {
      categoryAverages[catName.toLowerCase() as keyof PlayerAverages] = "N/A";
    }
  }
  
  let overallRatingValue: number | string = 0;
  if (validCategoryAveragesForOverall.length > 0) {
    overallRatingValue = roundHalfUp(validCategoryAveragesForOverall.reduce((sum, val) => sum + val, 0) / validCategoryAveragesForOverall.length, 1);
  } else if (Object.values(categoriesData).some(arr => arr.length > 0)) {
     overallRatingValue = 0; 
  } else {
     overallRatingValue = "N/A"; 
  }
  
  const finalOverallRating = typeof overallRatingValue === 'number' ? overallRatingValue : (Object.values(categoriesData).some(arr => arr.length > 0) ? 0 : "N/A");

  return {
    playerName: playerName, // Still return it, but won't display it in results header
    overallRating: finalOverallRating,
    offense: categoryAverages.offense ?? "N/A",
    defense: categoryAverages.defense ?? "N/A",
    physicals: categoryAverages.physicals ?? "N/A",
    summary: categoryAverages.summary ?? "N/A",
  };
}


export default function PlayerCategoryAveragesCalculator() {
  const [statsInput, setStatsInput] = useState<string>(`Player Name

Offense
Shooting: 8
Finishing: 7.5
Shot Creation: 7
Passing: 6.5
Dribbling: 7

Defense
Perimeter: 8
Interior: 6
Playmaking: 5.5

Physicals
Athleticism: 7.5
Age: 19.25 | 9
Height: 6'8 | 8.5
Wingspan: 7'1 | 7

Summary
NBA Ready: 7
Potential Min: 6
Potential Mid: 8
Potential Max: 9.5
`);
  const [averages, setAverages] = useState<PlayerAverages | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = () => {
    setError(null);
    setAverages(null);

    const cleanPlaceholder = `Player Name

Offense
Shooting: 8
Finishing: 7.5
Shot Creation: 7
Passing: 6.5
Dribbling: 7

Defense
Perimeter: 8
Interior: 6
Playmaking: 5.5

Physicals
Athleticism: 7.5
Age: 19.25 | 9
Height: 6'8 | 8.5
Wingspan: 7'1 | 7

Summary
NBA Ready: 7
Potential Min: 6
Potential Mid: 8
Potential Max: 9.5
`;

    if (!statsInput.trim() || statsInput.trim() === cleanPlaceholder.trim() || statsInput.trim().split('\n').length < 3) {
      setError("Please provide sufficient player data in the expected format.");
      return;
    }

    const parsedData = parsePlayerAveragesData(statsInput);

    if (parsedData) {
      const allNA = parsedData.offense === "N/A" && parsedData.defense === "N/A" && parsedData.physicals === "N/A" && parsedData.summary === "N/A";
      
      if (parsedData.overallRating === 0 && allNA && (parsedData.playerName === "Player" || !statsInput.toLowerCase().includes("player name"))) {
         setError("Could not parse data. Ensure format is correct and numeric values are provided for categories.");
         return;
      }
       if (parsedData.overallRating === "N/A" && allNA) {
        setError("No valid numeric data found to calculate averages. Please check input.");
        return;
      }
      setAverages(parsedData);
    } else {
      setError("Error parsing data. Please check input format and values. Ensure numeric values are provided for ratings.");
    }
  };
  
  const formatDisplayValue = (value: number | string) => {
    if (typeof value === 'number') {
      return value.toFixed(1);
    }
    return value; 
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Player Category Averages</CardTitle>
        <CardDescription>
          Paste player report data using the format shown in the placeholder. Lines starting with 'Player Name',
          'Offense', 'Defense', 'Physicals', or 'Summary' identify sections. Numeric ratings can be whole numbers (e.g., 8) or decimals (e.g., 7.5).
          For 'Offense', 'Defense', 'Summary', and 'Athleticism' (under Physicals), provide a direct numeric rating (e.g., `Shooting: 8.5`).
          For 'Age', 'Height', and 'Wingspan' under 'Physicals', use the format: `Key: Raw Value | Numeric Rating` (e.g., `Age: 19.51 | 9`).
          The numeric rating after the ` | ` (space-pipe-space) is used for calculation. The tool calculates category averages and an overall rating, rounded to one decimal place.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="stats-input">Player Report Data</Label>
          <Textarea
            id="stats-input"
            value={statsInput}
            onChange={(e) => setStatsInput(e.target.value)}
            placeholder={`Player Name 

Offense
Shooting: 8
Finishing: 7.5
Shot Creation: 7
Passing: 6.5
Dribbling: 7

Defense
Perimeter: 8
Interior: 6
Playmaking: 5.5

Physicals
Athleticism: 7.5
Age: 18.51 | 10
Height: 6’9 | 10
Wingspan: 7’0 | 5

Summary
NBA Ready: 7
Potential Min: 6
Potential Mid: 8
Potential Max: 9.5
`}
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
          Calculate Averages
        </Button>
        {averages && (
          <>
            <Separator />
            <div className="text-left p-4 bg-accent/10 rounded-md w-full">
              <h3 className="text-lg font-semibold text-accent-foreground mb-2 text-center">
                Calculated Averages
              </h3>
              <p className="text-2xl font-bold text-accent text-center mb-3">
                Overall Rating: {formatDisplayValue(averages.overallRating)}
              </p>
              <ul className="space-y-1 list-none pl-0 md:columns-2">
                <li><strong>Offense Avg:</strong> {formatDisplayValue(averages.offense)}</li>
                <li><strong>Defense Avg:</strong> {formatDisplayValue(averages.defense)}</li>
                <li><strong>Physicals Avg:</strong> {formatDisplayValue(averages.physicals)}</li>
                <li><strong>Summary Avg:</strong> {formatDisplayValue(averages.summary)}</li>
              </ul>
            </div>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
