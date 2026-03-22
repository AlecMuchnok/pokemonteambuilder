export interface APIData {
  name: string,
  url: string,
}

export interface Pokemon {
  id: number,
  name: string,
  sprite: string,
  types: Type[]
}

export interface Version {
  name: string;
  pokemon: Set<string>;
}

export interface Type {
  id: number,
  name: string,
  sprite: string,
  pokemon: Set<string>,
  type_effectiveness: {
    offense: Map<string, number>,
    defense: Map<string, number>,
  },
}