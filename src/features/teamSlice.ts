import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Pokemon } from '../types';

const PARTY_SIZE = 6;

export interface TeamState {
	value: Array<Pokemon>
}

const initialState: TeamState = {
	value: [],
}

export const teamSlice = createSlice({
	name: 'team',
	initialState,
	reducers: {
		addToTeam: (state, action: PayloadAction<Pokemon>) => {
			const team = state.value;

			if (!team.some((pokemon) => pokemon.id === action.payload.id) && team.length < PARTY_SIZE) {
				team.push(action.payload)
			}

			state.value = team;
		},
		removeFromTeam: (state, action: PayloadAction<Pokemon>)  => {
			state.value = state.value.filter((pokemon) => {
				return pokemon.id !== action.payload.id
			})
		}
	},
})

export const { addToTeam, removeFromTeam } = teamSlice.actions;
export default teamSlice.reducer;