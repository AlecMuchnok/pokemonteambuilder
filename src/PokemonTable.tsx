import { useState, useEffect, useContext } from 'react';
import type { APIData, Pokemon, Type } from './types';
import { DataContext, TeamContext } from './AppContext';

function PokemonRow({ pokemon }: { pokemon: Pokemon }) {
  const { team, onPokemonClick } = useContext(TeamContext);

  if (!pokemon) return (
    <tr className="h-20 hover:bg-gray-100"></tr>
  );

  return (
    <tr key={pokemon.id} className={"h-20 hover:bg-gray-100" + (team.some((p) => p.id === pokemon.id) ? " bg-gray-300" : "")} onClick={() => onPokemonClick(pokemon)}>
      <td>{pokemon.id}</td>
      <td className="flex items-center justify-center"><img className="max-w-15 max-h-15 object-contain" src={pokemon.sprite} alt={pokemon.name} /></td>
      <td>{pokemon.name ? pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1) : ''}</td>
      <td><div className="h-full mx-1 flex items-center justify-center">{pokemon.types.map((type) => <img key={type.id} className="max-w-30 max-h-5 object-contain" src={type.sprite} alt={type.name} />)}</div></td>
    </tr>
  )
}

function FilterInput({ filterText, onFilterTextChange, }: {
  filterText?: string,
  onFilterTextChange: (text: string) => void
}) {
  return (
    <form>
      <input
        type="text"
        value={filterText}
        onChange={(e) => onFilterTextChange(e.target.value)}
        placeholder="Search by name"
        className={`w-full px-4 py-2 my-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pokemon-red`}
      />
    </form>
  )
}

function TypeFilterDropdown({ value, onChange, placeholder, id }: {
  value: string,
  onChange: (text: string) => void,
  placeholder: string,
  id: string,
}) {
  const { allTypes } = useContext(DataContext);
  const typeNames = allTypes.map((t) => t.name);

  return (
    <div className="w-full">
      <input
        type="text"
        list={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2 my-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pokemon-red"
      />
      <datalist id={id}>
        {typeNames.map((name) => <option key={name} value={name.charAt(0).toUpperCase() + name.slice(1)} />)}
      </datalist>
    </div>
  )
}

function VersionFilterDropdown({ value, onChange }: {
  value: string,
  onChange: (text: string) => void,
}) {
  const { allVersions } = useContext(DataContext);

  return (
    <div className="w-full">
      <input
        type="text"
        list="version-filter"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Version"
        className="w-full px-4 py-2 my-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pokemon-red"
      />
      <datalist id="version-filter">
        {allVersions.map((v) => <option key={v.name} value={v.name} />)}
      </datalist>
    </div>
  );
}

function Paginate({ page, pageCount, onPageChange }: {
  page: number,
  pageCount: number,
  onPageChange: (page: number) => void,
}) {
  return (
    <div className="my-2">
      <button onClick={() => onPageChange(page - 1)} disabled={page === 0}>Previous</button>
      <span className="px-4 py-2 mx-1">{page + 1} / {pageCount}</span>
      <button onClick={() => onPageChange(page + 1)} disabled={page === pageCount - 1}>Next</button>
    </div>
  );
};

function PokemonTable({ data }: { data: APIData[] }) {
  const [pokemon, setPokemon] = useState<Pokemon[]>([]);
  const { allTypes } = useContext(DataContext);

  useEffect(() => {
    const fetchData = async () => {
      if (allTypes.length === 0) {
        return;
      }

      const pokemonList : Pokemon[] = [];

      for (const p of data) {
        const response = await fetch(p.url);
        const json = await response.json();

        const types : Type[] = [];

        for (const jsonType of json.types) {
          const type = allTypes.find((t) => t.name === jsonType.type.name);

          if (type)
            types.push(type);
        }

        pokemonList.push({
          id: json.id,
          name: json.name,
          sprite: json.sprites.front_default,
          types: types,
        });
      }

      setPokemon(pokemonList);
    }

    fetchData();
  }, [data, allTypes]);

  return (
    <div className="border border-table-line rounded-lg overflow-hidden">
      <table className="divide-y w-full table-auto mx-auto">
        <thead className={`bg-pokemon-red text-gray-100`}>
          <tr>
            <th className="px-1 py-2 w-1/6">Number</th>
            <th className="px-1 py-2 w-1/6">Sprite</th>
            <th className="px-1 py-2 w-1/3">Name</th>
            <th className="px-1 py-2 w-1/3">Type</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {pokemon.map((p) => (
            <PokemonRow key={p.name} pokemon={p} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function FilterablePokemonTable() {
  const [filterText, setFilterText] = useState('');
  const [type1, setType1] = useState('');
  const [type2, setType2] = useState('');
  const [version, setVersion] = useState('');
  const [page, setPage] = useState(0);
  const { allPokemon, allTypes, allVersions } = useContext(DataContext);

  const POKEMON_PER_PAGE = 10;

  function handleFilterTextChange(text: string) {
    setFilterText(text);
    setPage(0);
  }

  function handleType1Change(text: string) {
    setType1(text);
    setPage(0);
  }

  function handleType2Change(text: string) {
    setType2(text);
    setPage(0);
  }

  function handleVersionChange(text: string) {
    setVersion(text);
    setPage(0);
  }

  const matchedType1 = allTypes.find((t) => t.name.toLowerCase() === type1.toLowerCase());
  const matchedType2 = allTypes.find((t) => t.name.toLowerCase() === type2.toLowerCase());
  const matchedVersion = allVersions.find((v) => v.name.toLowerCase() === version.toLowerCase());

  // Filter out special pokemon (id > 10000)
  const filteredPokemon = allPokemon.filter((p) => {
    const parts: string[] = p.url.split('/');
    if (+parts[parts.length - 2] > 10000) return false;
    if (!p.name.toLowerCase().includes(filterText.toLowerCase())) return false;
    if (matchedType1 && !matchedType1.pokemon.has(p.name)) return false;
    if (matchedType2 && !matchedType2.pokemon.has(p.name)) return false;
    if (matchedVersion && !matchedVersion.pokemon.has(p.name)) return false;
    return true;
  });

  const paginatedPokemon = filteredPokemon.slice(page * POKEMON_PER_PAGE, (page + 1) * POKEMON_PER_PAGE);

  return (
    <div className="w-3/4 mx-auto">
      <FilterInput filterText={filterText} onFilterTextChange={handleFilterTextChange} />
      <div className="flex gap-2">
        <TypeFilterDropdown value={type1} onChange={handleType1Change} placeholder="Type 1" id="type1" />
        <TypeFilterDropdown value={type2} onChange={handleType2Change} placeholder="Type 2" id="type2" />
        <VersionFilterDropdown value={version} onChange={handleVersionChange} />
      </div>
      <PokemonTable data={paginatedPokemon} />
      <Paginate page={page} pageCount={Math.ceil(filteredPokemon.length / POKEMON_PER_PAGE)} onPageChange={setPage} />
    </div>
  )
}