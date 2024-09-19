import api from '@shared/config/apiConfig';
import {
  fetchDataFailure,
  fetchDataStart,
  fetchDataSuccess,
} from '../reducers/exampleReducer';
import { AppDispatch } from '../store';

export const fetchData = () => async (dispatch: AppDispatch) => {
  try {
    dispatch(fetchDataStart());
    const response = api.get('/example');
    dispatch(fetchDataSuccess(response));
  } catch (error: any) {
    dispatch(fetchDataFailure(error));
  }
};
