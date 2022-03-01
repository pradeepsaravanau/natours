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
      //setting timeout with 1500ms and assigning the home page with location.assign
      window.setTimeout(() => {
        location.assign(`/${email}`);
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err);
  }
};
