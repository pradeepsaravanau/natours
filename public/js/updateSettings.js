/*eslint-disable*/
//update data function
import axios from 'axios';
import { showAlert } from './alert';
//type is either 'password' or 'data'
export const updateSettings = async (data, type) => {
  try {
    const url =
      type === 'password'
        ? '/api/v1/users/updateMyPassword'
        : '/api/v1/users/updateMe';
    const res = await axios({
      method: 'PATCH',
      url: url,
      // data: {
      //   name,
      //   email
      // }
      //since we pass values to data as an object we use data:data
      data
    });
    if (res.data.status === 'success')
      showAlert('success', `${type.toUpperCase()} Updated Sucessfully`);
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
