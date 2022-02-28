/*eslint-disable*/
import axios from 'axios';
import { showAlert } from './alert';
export const createReview = async function(data) {
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://127.0.0.1:3000/api/v1/reviews',
      data: data
    });
    console.log(res);
    if (res.data.status === 'success') {
      showAlert('success', 'Created Review Successfully');
      //setting timeout with 1500ms and assigning the home page with location.assign
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
