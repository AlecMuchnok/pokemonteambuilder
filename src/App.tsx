import { useState, useEffect, useMemo, useCallback } from 'react'
import './App.css'
import { FilterablePokemonTable } from './PokemonTable';
import { PokemonTeam } from './PokemonTeam';
import { DataContext, TeamContext } from './AppContext';
import { flattenDamageRelations } from './utilities';
import type { APIData, Pokemon, Type, Version } from './types';

export default function App() {
  return (
    <DataContextProvider>
      <TeamContextProvider>
        <PokemonTeam />
        <FilterablePokemonTable />
      </TeamContextProvider>
    </DataContextProvider>
  )
}

const DataContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allPokemon, setAllPokemon] = useState<APIData[]>([]);
	const [allTypes, setAllTypes] = useState<Type[]>([]);
  const [allVersions, setAllVersions] = useState<Version[]>([]);

  const TYPE_COUNT = 18;

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=2000');
      const json = await response.json();
      setAllPokemon(json.results);

      const types : Type[] = [];

      for (let i = 1; i <= TYPE_COUNT; i++) {
        const typeResponse = await fetch(`https://pokeapi.co/api/v2/type/${i}`);
        const typeJson = await typeResponse.json();
        types.push({
          id: typeJson.id,
          name: typeJson.name,
          sprite: typeJson.sprites['generation-ix']['scarlet-violet'].name_icon,
          pokemon: new Set<string>(typeJson.pokemon.map((entry: { pokemon: { name: string } }) => entry.pokemon.name)),
          type_effectiveness: flattenDamageRelations(typeJson.damage_relations),
        });
      }

      setAllTypes(types);

      const vgListResponse = await fetch('https://pokeapi.co/api/v2/version-group?limit=100');
      const vgListJson = await vgListResponse.json();

      const versions: Version[] = await Promise.all(
        vgListJson.results.map(async (vg: APIData) => {
          const vgResponse = await fetch(vg.url);
          const vgJson = await vgResponse.json();

          const displayName = vgJson.versions
            .map((v: { name: string }) => v.name.charAt(0).toUpperCase() + v.name.slice(1))
            .join(' / ');

          const pokemonSets: Set<string>[] = await Promise.all(
            vgJson.pokedexes.map(async (pdx: { url: string }) => {
              const pdxResponse = await fetch(pdx.url);
              const pdxJson = await pdxResponse.json();
              return new Set<string>(
                pdxJson.pokemon_entries.map((e: { pokemon_species: { name: string } }) => e.pokemon_species.name)
              );
            })
          );

          const pokemon = new Set<string>();
          for (const s of pokemonSets) {
            for (const name of s) {
              pokemon.add(name);
            }
          }

          return { name: displayName, pokemon };
        })
      );

      setAllVersions(versions);
    }

    fetchData();
  }, []);

  const contextValue = useMemo(() => ({
    allPokemon, allTypes, allVersions
  }), [allPokemon, allTypes, allVersions]);

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  )
}

const TeamContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [team, setTeam] = useState<Pokemon[]>([]);

  const onPokemonClick = useCallback((pokemon: Pokemon) => {
    if (team.some((p) => p.id === pokemon.id)) {
      setTeam(team.filter((p) => p.id !== pokemon.id));
    }
    else if (team.length < 6) {
      setTeam([...team, pokemon]);
    }
  }, [team]);

  const contextValue = useMemo(() => ({
    team, onPokemonClick
  }), [team, onPokemonClick]);

  return (
    <TeamContext.Provider value={contextValue}>
      {children}
    </TeamContext.Provider>
  )
}