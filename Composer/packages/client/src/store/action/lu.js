import axios from 'axios';

import { BASEURL, ActionTypes } from './../../constants/index';

export async function updateLuFile(dispatch, { id, content }) {
  try {
    const response = await axios.put(`${BASEURL}/projects/opened/luFiles/${id}`, { id, content });
    dispatch({
      type: ActionTypes.UPDATE_LU_SUCCESS,
      payload: { response },
    });
  } catch (err) {
    dispatch({
      type: ActionTypes.UPDATE_LU_FAILURE,
      payload: null,
      error: err,
    });
  }
}

export async function createLuFile(dispatch, { id, content }) {
  try {
    const response = await axios.post(`${BASEURL}/projects/opened/luFiles`, { id, content });
    dispatch({
      type: ActionTypes.CREATE_LU_SUCCCESS,
      payload: { response },
    });
  } catch (err) {
    dispatch({
      type: ActionTypes.CREATE_LU_FAILURE,
      payload: null,
      error: err,
    });
  }
}

export async function removeLuFile(dispatch, { id }) {
  try {
    const response = await axios.delete(`${BASEURL}/projects/opened/luFiles/${id}`);
    dispatch({
      type: ActionTypes.REMOVE_LU_SUCCCESS,
      payload: { response },
    });
  } catch (err) {
    dispatch({
      type: ActionTypes.REMOVE_LU_FAILURE,
      payload: null,
      error: err,
    });
  }
}

export async function publishLuis(dispatch, config) {
  try {
    const response = await axios.post(`${BASEURL}/projects/opened/luFiles/publish`, config);
    dispatch({
      type: ActionTypes.PUBLISH_LU_SUCCCESS,
      payload: { response },
    });
    return { status: response.data.status, error: '' };
  } catch (err) {
    dispatch({
      type: ActionTypes.PUBLISH_LU_FAILURE,
      payload: null,
      error: err,
    });
    return { error: err.response.data.error };
  }
}