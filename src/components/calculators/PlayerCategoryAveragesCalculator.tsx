
"use client";

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { PlayerAverages, CATEGORY_KEYS_PLAYER_AVG } from '@/lib/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, RotateCcw } from "lucide-react";

const placeholderText = `Player Name 

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

  let playerName = "Player"; 
  const categoriesData: { [key: string]: number[] } = {
    Offense: [], Defense: [], Physicals: [], Summary: []
  };
  let currentCategoryName: keyof typeof CATEGORY_KEYS_PLAYER_AVG | null = null;

  for (const rawLine of lines) {
    let line = rawLine; 

    const playerNameMatch = line.match(/^(?:Player Name\s*:?\s*)?(.*)/i);
    if (playerNameMatch && playerNameMatch[1] && !Object.keys(CATEGORY_KEYS_PLAYER_AVG).some(cat => line.toLowerCase().startsWith(cat.toLowerCase()))) {
        let nameCandidate = playerNameMatch[1].trim();
        // Check if the candidate is not one of the default placeholder lines or empty
        const defaultPlayerNamePlaceholder = placeholderText.split('\n')[0].replace("Player Name","").trim().toLowerCase();
        if (nameCandidate && nameCandidate.toLowerCase() !== "sample player" && nameCandidate.toLowerCase() !== defaultPlayerNamePlaceholder) {
            playerName = nameCandidate;
        }
        if (line.toLowerCase().startsWith("player name")) continue;
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
  
  for (const catName of Object.keys(CATEGORY_KEYS_PLAYER_AVG) as Array<keyof typeof CATEGORY_KEYS_PLAYER_AVG>) {
    const valuesList = categoriesData[catName];
    if (valuesList && valuesList.length > 0) {
      const average = valuesList.reduce((sum, val) => sum + val, 0) / valuesList.length;
      const roundedAverage = roundHalfUp(average, 1);
      categoryAverages[catName.toLowerCase() as keyof PlayerAverages] = roundedAverage;
    } else {
      categoryAverages[catName.toLowerCase() as keyof PlayerAverages] = "N/A"; 
    }
  }
  
  const calculatedCategoryAveragesForOverall: number[] = [];
  if (typeof categoryAverages.offense === 'number') {
    calculatedCategoryAveragesForOverall.push(categoryAverages.offense);
  }
  if (typeof categoryAverages.defense === 'number') {
    calculatedCategoryAveragesForOverall.push(categoryAverages.defense);
  }
  if (typeof categoryAverages.physicals === 'number') {
    calculatedCategoryAveragesForOverall.push(categoryAverages.physicals);
  }
  if (typeof categoryAverages.summary === 'number') { 
    calculatedCategoryAveragesForOverall.push(categoryAverages.summary);
  }

  let overallRatingValue: number | string = "N/A";
  if (calculatedCategoryAveragesForOverall.length > 0) {
    const sumOfCatAvgs = calculatedCategoryAveragesForOverall.reduce((sum, val) => sum + val, 0);
    overallRatingValue = roundHalfUp(sumOfCatAvgs / calculatedCategoryAveragesForOverall.length, 1);
  } else {
    const allCategoriesNA = categoryAverages.offense === "N/A" &&
                            categoryAverages.defense === "N/A" &&
                            categoryAverages.physicals === "N/A" &&
                            categoryAverages.summary === "N/A";
    if (allCategoriesNA) {
        overallRatingValue = "N/A";
    }
  }


  return {
    playerName: playerName, 
    overallRating: overallRatingValue,
    offense: categoryAverages.offense ?? "N/A",
    defense: categoryAverages.defense ?? "N/A",
    physicals: categoryAverages.physicals ?? "N/A",
    summary: categoryAverages.summary ?? "N/A",
  };
}


export default function PlayerCategoryAveragesCalculator() {
  const [statsInput, setStatsInput] = useState<string>('');
  const [averages, setAverages] = useState<PlayerAverages | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = useCallback(() => {
    setError(null);
    setAverages(null);

    if (!statsInput.trim() || statsInput.trim().split('\n').length < 3) {
      setError("Please provide sufficient player data in the expected format.");
      return;
    }

    const parsedData = parsePlayerAveragesData(statsInput);

    if (parsedData) {
      if (parsedData.overallRating === "N/A" && 
          parsedData.offense === "N/A" && 
          parsedData.defense === "N/A" && 
          parsedData.physicals === "N/A" && 
          parsedData.summary === "N/A") { 
        setError("No valid numeric data found to calculate averages. Please check input.");
        return;
      }
      setAverages(parsedData);
    } else {
      setError("Error parsing data. Please check input format and values. Ensure numeric values are provided for ratings.");
    }
  }, [statsInput]);
  
  const formatDisplayValue = (value: number | string | undefined) => {
    if (value === undefined) return "N/A";
    if (typeof value === 'number') {
      return value.toFixed(1); 
    }
    return value; 
  };

  const handleReset = useCallback(() => {
    setStatsInput('');
    setAverages(null);
    setError(null);
  }, []);

  return (
    <Card>
      <CardHeader className="pb-2 md:pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle>Player Category Averages</CardTitle>
            <TooltipProvider>
              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" align="start" className="max-w-md">
                  <p className="text-sm">
                    Paste player report data using the format shown in the placeholder. 
                    Category names (Offense, Defense, Physicals, Summary) identify sections. 
                    Numeric ratings (e.g., 8 or 7.5) are averaged for each category.
                    For 'Age', 'Height', and 'Wingspan' under 'Physicals', use the format: ` + "`Key: Raw Value | Numeric Rating`" + ` (e.g., ` + "`Age: 19.51 | 9`" + `). 
                    The value after " | " (space on both sides of the pipe) is used for calculation.
                    The tool calculates category averages and an overall rating (derived from the average of the four main category averages: Offense, Defense, Physicals, and Summary), rounded to one decimal place.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Button variant="ghost" size="icon" onClick={handleReset}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
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
            className="font-code mt-1 text-xs resize-y"
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
        <Button onClick={handleCalculate} variant="primaryGlass" className="w-full">
          Calculate Averages
        </Button>
        {averages && (
          <>
            <Separator />
            <div className="text-center p-6 w-full bg-primary/[.18] dark:bg-primary/[.25] text-primary-foreground backdrop-blur-xl border border-primary/[.25] dark:border-primary/[.35] shadow-primary-glass-shadow ring-1 ring-inset ring-white/30 dark:ring-white/20 rounded-xl">
              <p className="text-base mb-2">
                Overall Rating: {formatDisplayValue(averages.overallRating)}
              </p>
              <div className="text-base space-y-1">
                <p>Offense Avg: {formatDisplayValue(averages.offense)}</p>
                <p>Defense Avg: {formatDisplayValue(averages.defense)}</p>
                <p>Physicals Avg: {formatDisplayValue(averages.physicals)}</p>
                <p>Summary Avg: {formatDisplayValue(averages.summary)}</p>
              </div>
            </div>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
