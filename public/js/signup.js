/*eslint-disable*/
import axios from 'axios';
import { showAlert } from './alert';
export const signup = async (name, email, password, passwordConfirm) => {
  try {
    console.log('location name is', location.hostname);

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
      // window.setTimeout(() => {
      //   location.reload(true);
      //   location.assign(`/`);
      // }, 1500);
    }
  } catch (err) {
    showAlert('error', err);
  }
};
