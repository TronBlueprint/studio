
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AthletcismPercentileCalculator from "@/components/calculators/AthletcismPercentileCalculator";
import NbaProspectPhysicalRater from "@/components/calculators/NbaProspectPhysicalRater";
import PlayerCategoryAveragesCalculator from "@/components/calculators/PlayerCategoryAveragesCalculator";
import { Flame } from "lucide-react"; // Example icon, can be changed

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center py-8 px-4 selection:bg-primary/20 selection:text-primary">
      <header className="mb-10 text-center">
        <div className="inline-flex items-center justify-center p-3 bg-primary text-primary-foreground rounded-full mb-4 shadow-lg">
          {/* Using a simple SVG as placeholder for a more specific logo icon if Flame is not suitable */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10">
            <path d="M12.378 1.602a.75.75 0 00-.756 0L3.366 6.186A.75.75 0 003 6.82V21a.75.75 0 00.75.75h16.5A.75.75 0 0021 21V6.82a.75.75 0 00-.366-.634L12.378 1.602zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" />
          </svg>
        </div>
        <h1 className="text-5xl font-headline font-extrabold text-primary tracking-tight">
          Zenith
        </h1>
        <p className="text-muted-foreground mt-3 text-lg max-w-md mx-auto">
          Your intuitive platform for basketball analytics and player evaluation.
        </p>
      </header>

      <Tabs defaultValue="athleticism" className="w-full max-w-2xl shadow-xl rounded-lg overflow-hidden border border-border">
        <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 h-auto">
          <TabsTrigger value="athleticism" className="py-2.5 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md">Athleticism %</TabsTrigger>
          <TabsTrigger value="nba-prospect" className="py-2.5 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md">Physical Rater</TabsTrigger>
          <TabsTrigger value="player-averages" className="py-2.5 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md">Player Averages</TabsTrigger>
        </TabsList>
        <div className="p-1 sm:p-2 md:p-0"> {/* Added padding for smaller screens as Card has its own padding*/}
          <TabsContent value="athleticism" className="mt-0"> {/* Removed default TabsContent margin-top */}
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

      <footer className="mt-16 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Zenith. All calculations are for illustrative purposes.</p>
        <p>Built with passion for the game.</p>
      </footer>
    </div>
  );
}
