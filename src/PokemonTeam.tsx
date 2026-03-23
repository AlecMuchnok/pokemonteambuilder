import { useState, useEffect, useContext } from 'react';
import type { Pokemon, Type } from './types';
import { DataContext, TeamContext } from './AppContext';

export function PokemonBox({ pokemon }: { pokemon: Pokemon | null }) {
  const { onPokemonClick } = useContext(TeamContext);

  if (!pokemon) return (
    <div className="w-50 px-5 mx-4 my-1">
      <div className="h-40 border-2 border-gray-300 rounded-lg p-4" />
      <div className="w-full h-8 flex mx-auto py-2" />
    </div>
  )  

	return (
    <div className="w-50 px-5 mx-4 my-1">
      <div className={`h-40 border-2 border-gray-300 rounded-lg p-4 ${pokemon ? "hover:bg-gray-100" : ""}`} onClick={() => pokemon && onPokemonClick(pokemon)}>
        <img className="w-full h-full" src={pokemon.sprite} alt={pokemon.species} />
      </div>
      <div className="w-full h-8 flex mx-auto py-2 items-center justify-center">
        {pokemon.types.map((type: Type) => {
          return <img key={type.id} className="h-5 object-contain" src={type.sprite} alt={type.name} />
        })}
      </div>
    </div>
	)
}

function TypeRelations() {
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
    <>
      <label className="block text-sm font-medium text-gray-700 mb-1">Coverage (Offensive/Defensive)</label>
      <div className="grid grid-cols-2 gap-0 w-100 mx-auto">
        {allTypes.map((type) => {
          const offense: number = teamCoverage.get(type.name)?.offense ?? 1;
          const defense: number = teamCoverage.get(type.name)?.defense ?? 1;
          const offenseColor = offenseHighlights.has(type.name) ? 'bg-yellow-400' : offense > 1 ? 'bg-green-500' : offense < 1 ? 'bg-red-500' : '';
          const defenseColor = defenseHighlights.has(type.name) ? 'bg-yellow-400' : defense < 1 ? 'bg-green-500' : defense > 1 ? 'bg-red-500' : '';

          return (
            <div className="flex items-center m-1" key={type.name}>
              <div className={`w-5 h-5 border-2 border-gray-300 rounded-lg mx-1 ${offenseColor}`} />
              <div className={`w-5 h-5 border-2 border-gray-300 rounded-lg mx-1 ${defenseColor}`} />
              <img className="h-5 mx-1" src={type.sprite} alt={type.name} onMouseEnter={() => setHoveredType(type)} onMouseLeave={() => setHoveredType(null)} />
            </div>
          );
        })}
      </div>
    </>
  )
}

export function PokemonTeam() {
  const { team } = useContext(TeamContext)

  return (
    <div className="px-8 flex flex-wrap items-center justify-center self-center">
      <div className="w-120 grid grid-cols-2 mx-auto">
        <PokemonBox key='0' pokemon={team[0] || null} />
        <PokemonBox key='1' pokemon={team[1] || null} />
        <PokemonBox key='2' pokemon={team[2] || null} />
        <PokemonBox key='3' pokemon={team[3] || null} />
        <PokemonBox key='4' pokemon={team[4] || null} />
        <PokemonBox key='5' pokemon={team[5] || null} />
      </div>
      <div className="w-100 mx-auto">
        <TypeRelations />
      </div>
    </div>
  )
}

interface Coverage {
  offense: number,
  defense: number,
}