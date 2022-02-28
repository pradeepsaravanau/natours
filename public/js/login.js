/*eslint-disable*/
import axios from 'axios';
import { showAlert } from './alert';
export const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/login',
      data: {
        email: email,
        password: password
      }
    });
    if (res.data.status === 'success') {
      showAlert('success', 'Logged In Successfully!');
      //setting timeout with 1500ms and assigning the home page with location.assign
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
export const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: '/api/v1/users/logout'
    });
    //true coz of reload from server not from the cache
    //without true it will still load the same page from the cache
    if (res.data.status === 'success') location.reload(true);
  } catch (err) {
    showAlert('error', 'Error logging out! try again');
  }
};
