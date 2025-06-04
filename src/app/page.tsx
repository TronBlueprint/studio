
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AthletcismPercentileCalculator from "@/components/calculators/AthletcismPercentileCalculator";
import NbaProspectPhysicalRater from "@/components/calculators/NbaProspectPhysicalRater";
import PlayerCategoryAveragesCalculator from "@/components/calculators/PlayerCategoryAveragesCalculator";
// Removed: import { Basketball } from "lucide-react"; 

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center py-8 px-4 selection:bg-primary/20 selection:text-primary">
      <header className="mb-10 text-center">
        <div className="inline-flex items-center justify-center p-3 bg-primary text-primary-foreground rounded-full mb-4 shadow-lg">
          {/* Replaced Basketball icon with inline SVG */}
          <svg
            className="w-10 h-10 text-accent"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            xmlns="http://www.w3.org/2000/svg"
          >
            <title>Basketball Icon</title>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2L12 22" />
            <path d="M2 12L22 12" />
            <path d="M19.0711 4.92893C16.9004 6.50328 14.5344 7.5 12 7.5C9.46563 7.5 7.09961 6.50328 4.92893 4.92893" />
            <path d="M4.92893 19.0711C7.09961 17.4967 9.46563 16.5 12 16.5C14.5344 16.5 16.9004 17.4967 19.0711 19.0711" />
          </svg>
        </div>
        <h1 className="text-5xl font-headline font-extrabold text-primary tracking-tight">
          Zenith
        </h1>
        <p className="text-muted-foreground mt-3 text-lg max-w-md mx-auto">
          Game-ifying draft scouting (sorry)
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
        <p>Numbers may or may not mean anything.</p>
        <p>Built from delusion</p>
      </footer>
    </div>
  );
}
