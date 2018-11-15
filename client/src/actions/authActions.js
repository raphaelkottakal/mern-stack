import axios from 'axios';
import setAuthToken from '../utils/setAuthToken';
import jwt_decode from 'jwt-decode';

import {
  GET_ERRORS,
  SET_CURRENT_USER
} from './types';

export const registerUser = (userData, history) => dispatch => {

  axios
    .post('/api/users/register', userData)
    .then(result =>  history.push('/login') )
    .catch(err => 
      dispatch({
        type: GET_ERRORS,
        paylode: err.response.data
      })
    );
};

export const loginUser = (userData) => dispatch => {
  axios
    .post('/api/users/login', userData)
    .then(result => {
      const { token } = result.data;
      localStorage.setItem('jwtToken', token);
      setAuthToken(token);
      const decoded = jwt_decode(token);
      console.log(decoded);
      dispatch(setCurrentUser(decoded));
    })
    .catch(err => 
      dispatch({
        type: GET_ERRORS,
        paylode: err.response.data
      })
    );
}

export const setCurrentUser = decode => {
  return {
    type: SET_CURRENT_USER,
    payload: decode
  }
}

export const logoutUser = () => dispatch => {
  localStorage.removeItem('jwtToken');
  setAuthToken(false);
  dispatch(setCurrentUser({}));
}