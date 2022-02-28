/*eslint-disable*/
import axios from 'axios';
import { showAlert } from './alert';
const stripe = Stripe(
  'pk_test_51KW161JGVNWlhaVOdV4ZcqMz2sTZJrVHKEtxLZbLzdZhCdwILaIzmBZhomMSDzBzKVNtkf6cReo8T0YCQ0cH9NDK003Vs7MJU0'
);
export const bookTour = async (tourId, dateId) => {
  try {
    //1)get the checkout session from the api
    //for get we can do like this
    const session = await axios(
      `/api/v1/bookings/checkout-session/${tourId}/${dateId}`
    );
    // 2)create checkout form + charge credit card
    if (session.data.status === 'error') {
      throw new Error(session.data.message);
    } else {
      await stripe.redirectToCheckout({
        sessionId: session.data.session.id
      });
    }
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
