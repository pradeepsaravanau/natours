/*eslint-disable*/
import axios from 'axios';
import { showAlert } from './alert';
export const confirmEmail = async (token, email) => {
  try {
    const res = await axios({
      method: 'POST',
      url: 'api/v1/users/verifyEmail/',
      data: {
        confirmEmailToken: token,
        email
      }
    });
    if (res.data.status === 'success') {
      showAlert('success', 'Email Id verified');
      //setting timeout with 1500ms and assigning the home page with location.assign
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
