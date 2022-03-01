/*eslint-disable*/
import axios from 'axios';
import { showAlert } from './alert';
export const signup = async (name, email, password, passwordConfirm) => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/signup/',
      data: {
        name,
        email,
        password,
        passwordConfirm
      }
    });

    if (res.data.status === 'success') {
      showAlert('success', 'please verify your email address!');
      console.log(location.hostname);
      window.setTimeout(() => {
        location.assign(`${location.hostname}/${email}`);
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err);
  }
};
