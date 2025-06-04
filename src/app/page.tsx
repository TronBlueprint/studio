
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AthletcismPercentileCalculator from "@/components/calculators/AthletcismPercentileCalculator";
import NbaProspectPhysicalRater from "@/components/calculators/NbaProspectPhysicalRater";
import PlayerCategoryAveragesCalculator from "@/components/calculators/PlayerCategoryAveragesCalculator";


export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center pt-8 pb-12 md:pb-16 px-4 selection:bg-primary/20 selection:text-primary">
      

      <Tabs defaultValue="athleticism" className="w-full max-w-3xl mt-8 md:mt-12">
        <TabsList className="grid w-full grid-cols-3 h-auto mb-4">
          <TabsTrigger value="athleticism">Athleticism %</TabsTrigger>
          <TabsTrigger value="nba-prospect">Physical Rater</TabsTrigger>
          <TabsTrigger value="player-averages">Player Averages</TabsTrigger>
        </TabsList>
        
        <TabsContent value="athleticism" forceMount>
          <AthletcismPercentileCalculator />
        </TabsContent>
        <TabsContent value="nba-prospect" forceMount>
          <NbaProspectPhysicalRater />
        </TabsContent>
        <TabsContent value="player-averages" forceMount>
          <PlayerCategoryAveragesCalculator />
        </TabsContent>
      </Tabs>

      <footer className="mt-20 md:mt-24 text-center text-sm text-muted-foreground">
        <p>Numbers may or may not mean anything.</p>
        <p>Built from delusion</p>
      </footer>
    </div>
  );
}
