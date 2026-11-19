import { Button } from "@ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/tabs";
import { useEffect, useRef, type EventHandler } from "react";
import type React from "react";

export interface Episode {
  localizationStudio: string,
  localizationType: "dub"|"sub",
  episodeName: string,
  sourceUrl: string
}

type EpisodesTree = {
  dub: Record<string, {
    episodeName: string,
    sourceUrl: string
  }[]>,
  sub: Record<string, {
    episodeName: string,
    sourceUrl: string
  }[]>
};

function buildEpisodesTree(episodes: Episode[]): EpisodesTree {
  let tree: EpisodesTree = { dub: {}, sub: {} };

  for (const episode of episodes) {
    const entry = {
      episodeName: episode.episodeName,
      sourceUrl: episode.sourceUrl
    };

    if (episode.localizationType === "dub") {
      tree.dub[episode.localizationStudio]?.push(entry) ?? (
        tree.dub[episode.localizationStudio] = [entry]
      );
    } else if (episode.localizationType === "sub") {
      tree.sub[episode.localizationStudio]?.push(entry) ?? (
        tree.sub[episode.localizationStudio] = [entry]
      );
    }
  }

  return tree;
}

export default function EpisodesList({ episodes, children }: {
  episodes: Episode[],
  children: React.ReactElement
}) {
  const tree = buildEpisodesTree(episodes);

  const defaultTab = [ 
    Object.keys(tree.dub).length === 0 ? null : "dub",
    Object.keys(tree.sub).length === 0 ? null : "sub",
  ].filter(e => e)[0] ?? "dub";

  return (
    <Tabs defaultValue={ defaultTab }>
      <div className="px-container">
        <TabsList variant="line">
          <TabsTrigger value="dub" disabled={ Object.keys(tree.dub).length === 0 }>Дубляж</TabsTrigger>
          <TabsTrigger value="sub" disabled={ Object.keys(tree.sub).length === 0 }>Субтитри</TabsTrigger>
        </TabsList>
      </div>
      { children }
      <TabsContent value="dub">
        <TeamsList teams={ tree.dub } />
      </TabsContent>
      <TabsContent value="sub">
        <TeamsList teams={ tree.sub } />
      </TabsContent>
    </Tabs>
  );
}

function TeamsList({ teams }: {
  teams: Record<string, { episodeName: string, sourceUrl: string }[]>,
}) {
  let tabsListRef = useRef<null|HTMLDivElement>(null);
  const tabs = Object.keys(teams);
  const wheelHandler = (e: WheelEvent) => {
    if (!tabsListRef.current) return;

    e.preventDefault();
    if (e.deltaY !== 0) tabsListRef.current.scrollLeft += e.deltaY;
  };

  useEffect(() => {
    if (!tabsListRef.current) return;
    tabsListRef.current.addEventListener("wheel", wheelHandler);
  }, []);

  return (
    <Tabs defaultValue={ tabs[0] } className="px-2">
      <TabsList
        variant="line"
        className="bg-transparent m-0 p-0 w-full justify-start overflow-x-auto overflow-y-hidden"
        style={{
          scrollbarWidth: "none",
        }}
        ref={ tabsListRef }>
        { tabs.map(team => (
          <TabsTrigger key={ team } value={ "team-" + team } className="text-xs">{ team }</TabsTrigger>
        )) }
      </TabsList>
      { tabs.map(team => (
        <TabsContent key={ team } value={ "team-" + team } className="pt-3">
          <TeamEpisodesList episodes={ teams[team] } />
        </TabsContent>
      )) }
    </Tabs>
  );
}

function TeamEpisodesList({ episodes }: {
  episodes: { episodeName: string, sourceUrl: string }[]
}) {
  return (
    <div className="flex flex-col lg:flex-row flex-wrap gap-1 px-container">
    { episodes.map(ep => (
      <Button 
        key={ `${ep.episodeName} ${ep.sourceUrl}` }
        variant="secondary" 
        className="rounded-lg"
        title={ ep.episodeName }>
        { ep.episodeName.split(":")[0] }
      </Button>
    )) }
    </div>
  );
}
