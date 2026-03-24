import { useState, useEffect, useContext } from 'react';
import type { Type } from './types';
import { DataContext, TeamContext } from './AppContext';

export function TeamCoverage() {
  const [teamCoverage, setTeamCoverage] = useState<Map<string, Coverage>>(new Map());
  const [hoveredType, setHoveredType] = useState<Type | null>(null);
  const { team } = useContext(TeamContext);
  const { allTypes } = useContext(DataContext);

  useEffect(() => {
    const calculateCoverage = async () => {
      // Get team types
      const teamTypes: Type[][] = [];

      team.forEach((p) => teamTypes.push(p.types));

      // Calculate coverage
      const coverage: Map<string, Coverage> = new Map();

      allTypes.forEach(async (type) => {
        const teamOffense: number[] = teamTypes.map<number>((types) =>
          types.reduce((acc: number, pType) => Math.max(acc, pType.type_effectiveness.offense.get(type.name) ?? 1), 0)
        )
        const teamDefense: number[] = teamTypes.map<number>((types) =>
          types.reduce((acc: number, pType) => acc * (pType.type_effectiveness.defense.get(type.name) ?? 1), 1)
        )

        coverage.set(type.name, {
          offense: teamOffense.includes(2) ? 2 : Math.min(...teamOffense, 1),
          defense: teamDefense.length ? Math.min(...teamDefense) : 1,
        })
      });

      setTeamCoverage(coverage);
    }

    calculateCoverage();
  }, [team, allTypes]);

  const offenseHighlights: Set<string> = new Set(
    hoveredType
      ? allTypes.filter(t => (hoveredType.type_effectiveness.defense.get(t.name) ?? 1) === 2).map(t => t.name)
      : []
  );
  const defenseHighlights: Set<string> = new Set(
    hoveredType
      ? allTypes.filter(t => (hoveredType.type_effectiveness.offense.get(t.name) ?? 1) <= 0.5).map(t => t.name)
      : []
  );

  return (
    <div className="w-100 mx-auto">
      <label className="block text-sm font-medium text-gray-700 mb-1">Coverage (Offensive/Defensive)</label>
      <div className="grid grid-cols-2 gap-0 w-100 mx-auto">
        {allTypes.map((type) => {
          const offense: number = teamCoverage.get(type.name)?.offense ?? 1;
          const defense: number = teamCoverage.get(type.name)?.defense ?? 1;
          const offenseColor = offenseHighlights.has(type.name) ? 'bg-yellow-400' : offense > 1 ? 'bg-green-500' : offense < 1 ? 'bg-red-500' : '';
          const defenseColor = defenseHighlights.has(type.name) ? 'bg-yellow-400' : defense < 1 ? 'bg-green-500' : defense > 1 ? 'bg-red-500' : '';

          return (
            <div className="flex items-center m-1" key={type.name}>
              <Bubble color={offenseColor} />
              <Bubble color={defenseColor} />
              <img className="h-5 mx-1" src={type.sprite} alt={type.name} onMouseEnter={() => setHoveredType(type)} onMouseLeave={() => setHoveredType(null)} />
            </div>
          );
        })}
      </div>
    </div>
  )
}

function Bubble({ color }: { color: string }) {
  return <div className={`w-5 h-5 border-2 border-gray-300 rounded-lg mx-1 ${color}`} />;
}

interface Coverage {
  offense: number,
  defense: number,
}
