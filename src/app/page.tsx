import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AthletcismPercentileCalculator from "@/components/calculators/AthletcismPercentileCalculator";
import NbaProspectPhysicalRater from "@/components/calculators/NbaProspectPhysicalRater";
import PlayerCategoryAveragesCalculator from "@/components/calculators/PlayerCategoryAveragesCalculator";


export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center pt-8 pb-12 md:pb-16 px-4 selection:bg-primary/20 selection:text-primary">
      <header className="mb-8 md:mb-12 text-center">
        <h1 className="text-5xl md:text-6xl font-headline font-extrabold text-primary tracking-tight">
          Zenith
        </h1>
        <p className="text-muted-foreground mt-4 text-lg max-w-md mx-auto">
          Game-ifying draft scouting (sorry)
        </p>
      </header>

      <Tabs defaultValue="athleticism" className="w-full max-w-3xl"> {/* Increased max-width for more space */}
        <TabsList className="grid w-full grid-cols-3 h-auto mb-4">
          <TabsTrigger value="athleticism">Athleticism %</TabsTrigger>
          <TabsTrigger value="nba-prospect">Physical Rater</TabsTrigger>
          <TabsTrigger value="player-averages">Player Averages</TabsTrigger>
        </TabsList>
        <div className="p-0"> {/* Removed padding here, Card will have its own */}
          <TabsContent value="athleticism" className="mt-0">
            <AthletcismPercentileCalculator />
          </TabsContent>
          <TabsContent value="nba-prospect" className="mt-0">
            <NbaProspectPhysicalRater />
          </TabsContent>
          <TabsContent value="player-averages" className="mt-0">
            <PlayerCategoryAveragesCalculator />
          </TabsContent>
        </div>
      </Tabs>

      <footer className="mt-20 md:mt-24 text-center text-sm text-muted-foreground">
        <p>Numbers may or may not mean anything.</p>
        <p>Built from delusion</p>
      </footer>
    </div>
  );
}
