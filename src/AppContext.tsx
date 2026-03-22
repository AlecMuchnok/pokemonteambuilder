import { createContext } from "react";
import type { APIData, Pokemon, Type, Version } from "./types";

export const DataContext = createContext<{ allPokemon: APIData[], allTypes: Type[], allVersions: Version[] }>({
  allPokemon: [],
  allTypes: [],
  allVersions: [],
});

export const TeamContext = createContext<{
  team: Pokemon[],
  onPokemonClick: (pokemon: Pokemon) => void
}>({
  team: [],
  onPokemonClick: () => {},
});