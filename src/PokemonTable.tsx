import { useState, useEffect, useContext } from 'react';
import type { APIData, Pokemon, Pokedex, Type } from './types';
import { DataContext, TeamContext } from './AppContext';
import { formatPokemonName } from './utilities';

export function FilterablePokemonTable() {
  const [filterText, setFilterText] = useState('');
  const [type1, setType1] = useState('');
  const [type2, setType2] = useState('');
  const [pokedex, setPokedex] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(calcRowsPerPage);
  const { allPokemon, allTypes, allPokedexes, idToSpecies } = useContext(DataContext);

  useEffect(() => {
    function handleResize() {
      const newRows = calcRowsPerPage();
      setRowsPerPage((prevRows) => {
        if (newRows === prevRows) return prevRows;
        // Set the page to the one that has the previous first row's pokemon
        setPage((prevPage) => {
          const firstIndex = prevPage * prevRows;
          return Math.floor(firstIndex / newRows);
        });
        return newRows;
      });
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  function handlePokedexChange(text: string) {
    setPokedex(text);
    setPage(0);
  }

  const matchedType1 = allTypes.find((t) => t.name.toLowerCase() === type1.toLowerCase());
  const matchedType2 = allTypes.find((t) => t.name.toLowerCase() === type2.toLowerCase());
  const matchedPokedex = allPokedexes.find((d) => d.name.toLowerCase() === (pokedex || 'national').toLowerCase()) ?? null;

  // Filter out special pokemon (id > 10000)
  const filteredPokemon = allPokemon.filter((p) => {
    const parts: string[] = p.url.split('/');
    const id = +parts[parts.length - 2];
    if (id > 10000) return false;
    const species = idToSpecies.get(id) ?? p.name;
    if (!species.toLowerCase().includes(filterText.toLowerCase())) return false;
    if (matchedType1 && !matchedType1.pokemon.has(p.name)) return false;
    if (matchedType2 && !matchedType2.pokemon.has(p.name)) return false;
    if (matchedPokedex && !matchedPokedex.pokemon.has(species)) return false;
    return true;
  });

  const sortedPokemon = matchedPokedex
    ? [...filteredPokemon].sort((a, b) => {
        const idA = +a.url.split('/').at(-2)!;
        const idB = +b.url.split('/').at(-2)!;
        const speciesA = idToSpecies.get(idA) ?? a.name;
        const speciesB = idToSpecies.get(idB) ?? b.name;
        return (matchedPokedex.pokemon.get(speciesA) ?? 0) - (matchedPokedex.pokemon.get(speciesB) ?? 0);
      })
    : filteredPokemon;

  const paginatedPokemon = sortedPokemon.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  return (
    <div className="flex-1 min-w-[532px] px-4">
      <FilterInput filterText={filterText} onFilterTextChange={handleFilterTextChange} />
      <div className="flex gap-2">
        <PokedexFilterDropdown value={pokedex} onChange={handlePokedexChange} />
        <TypeFilterDropdown value={type1} onChange={handleType1Change} placeholder="Type 1" id="type1" />
        <TypeFilterDropdown value={type2} onChange={handleType2Change} placeholder="Type 2" id="type2" />
      </div>
      <PokemonTable data={paginatedPokemon} pokedex={matchedPokedex} />
      <Paginate page={page} pageCount={Math.ceil(sortedPokemon.length / rowsPerPage)} onPageChange={setPage} />
    </div>
  )
}

function calcRowsPerPage() {
  // Each row is h-20 (80px). ~260px overhead for header, filters, pagination, and root padding.
  return Math.max(5, Math.floor((window.innerHeight - 260) / 80));
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
        onFocus={(e) => e.target.select()}
        placeholder="Search by name"
        className={`w-full px-4 py-2 my-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pokemon-red`}
      />
    </form>
  )
}

function PokedexFilterDropdown({ value, onChange }: {
  value: string,
  onChange: (text: string) => void,
}) {
  const { allPokedexes } = useContext(DataContext);

  return (
    <div className="w-full">
      <input
        type="text"
        list="pokedex-filter"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={(e) => e.target.select()}
        placeholder="Pokedex"
        className="w-full px-4 py-2 my-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pokemon-red"
      />
      <datalist id="pokedex-filter">
        {allPokedexes.map((p: Pokedex) => <option key={p.name} value={p.name} />)}
      </datalist>
    </div>
  );
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
        onFocus={(e) => e.target.select()}
        placeholder={placeholder}
        className="w-full px-4 py-2 my-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pokemon-red"
      />
      <datalist id={id}>
        {typeNames.map((name) => <option key={name} value={name.charAt(0).toUpperCase() + name.slice(1)} />)}
      </datalist>
    </div>
  )
}

function PokemonTable({ data, pokedex }: { data: APIData[], pokedex: Pokedex | null }) {
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
          species: json.species.name,
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
      <table className="divide-y w-full table-fixed mx-auto">
        <thead className={`bg-pokemon-red text-gray-100`}>
          <tr>
            <th className="px-1 py-2 w-[15%]">Number</th>
            <th className="px-1 py-2 w-[15%]">Sprite</th>
            <th className="px-1 py-2 w-[25%]">Name</th>
            <th className="px-1 py-2 w-[45%]">Type</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {pokemon.map((p) => (
            <PokemonRow key={p.species} pokemon={p} displayNumber={pokedex?.pokemon.get(p.species) ?? p.id} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PokemonRow({ pokemon, displayNumber }: { pokemon: Pokemon, displayNumber: number }) {
  const { team, onPokemonClick } = useContext(TeamContext);

  if (!pokemon) return (
    <tr className="h-20 hover:bg-gray-100"></tr>
  );

  return (
    <tr key={pokemon.id} className={(team.some((p) => p.id === pokemon.id) ? "h-20 bg-gray-300 hover:bg-gray-400 cursor-pointer" : "h-20 hover:bg-gray-100 cursor-pointer")} onClick={() => onPokemonClick(pokemon)}>
      <td>{displayNumber}</td>
      <td className="align-middle"><img className="max-w-15 max-h-15 mx-auto object-contain" src={pokemon.sprite} alt={pokemon.species} /></td>
      <td>{formatPokemonName(pokemon.species)}</td>
      <td><div className="h-full min-w-60 mx-1 flex items-center justify-center">{pokemon.types.map((type) => <img key={type.id} className="max-w-30 max-h-5 object-contain" src={type.sprite} alt={type.name} />)}</div></td>
    </tr>
  )
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