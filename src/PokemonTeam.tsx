import { useContext } from 'react';
import type { Pokemon, Type } from './types';
import { TeamContext } from './AppContext';

export function PokemonTeam() {
  const { team } = useContext(TeamContext)

  return (
    <div className="px-8 flex flex-wrap items-center justify-center self-center">
      <div className="w-110 grid grid-cols-2 mx-auto">
        <PokemonBox key='0' pokemon={team[0] || null} />
        <PokemonBox key='1' pokemon={team[1] || null} />
        <PokemonBox key='2' pokemon={team[2] || null} />
        <PokemonBox key='3' pokemon={team[3] || null} />
        <PokemonBox key='4' pokemon={team[4] || null} />
        <PokemonBox key='5' pokemon={team[5] || null} />
      </div>
    </div>
  )
}

export function PokemonBox({ pokemon }: { pokemon: Pokemon | null }) {
  return (
    <div className="w-50 px-5 mx-4 my-1">
      <PokemonImage pokemon={pokemon} />
      <PokemonTypes pokemon={pokemon} />
    </div>
  )
}

function PokemonImage({ pokemon }: { pokemon: Pokemon | null }) {
  const { onPokemonClick } = useContext(TeamContext);

  return (
    <div className={`h-40 border-2 border-gray-300 rounded-lg p-4 ${pokemon ? "hover:bg-gray-100" : ""}`} onClick={() => pokemon && onPokemonClick(pokemon)}>
      {pokemon && <img className="w-full h-full" src={pokemon.sprite} alt={pokemon.species} />}
    </div>
  )
}

function PokemonTypes({ pokemon }: { pokemon: Pokemon | null }) {
  return (
    <div className={`w-full h-8 flex mx-auto py-2 ${pokemon ? "items-center justify-center" : ""}`}>
      {pokemon && pokemon.types.map((type: Type) => {
        return <img key={type.id} className="h-5 object-contain" src={type.sprite} alt={type.name} />
      })}
    </div>
  )
}
