import { combineReducers } from '@reduxjs/toolkit';
import exampleReducer, { ExampleState } from './exampleReducer';

export type RootState = {
  example: ExampleState;
}

const rootReducer = combineReducers({
  example: exampleReducer,
});

export default rootReducer;
