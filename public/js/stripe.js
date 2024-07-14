
import { showAlert } from './alerts';
const stripe = Stripe('pk_test_51Pc5foRwYs7KwOQkOJVvZacaU6Wl3cXQqajSBWLUzcgC9uOIUT3nKkQpjxm0JzjtdXs6O6lgH0YXLAJE7C7Q2XIf00Yr96iHAE');

export const bookTour = async tourId => {
  try {
    // 1) Get checkout session from API
    const response = await fetch(`/api/v1/bookings/checkout-session/${tourId}`);
    const sessionData = await response.json();

    // console.log('Session Data:', sessionData);
    
    // Ensure sessionData contains the expected structure
    if (!sessionData.session || !sessionData.session.url) {
      throw new Error('Invalid session data received from server');
    }

    // 2) Redirect to checkout using window.location
    window.location.href = sessionData.session.url;

  } catch (err) {
    console.error('Error:', err);
    showAlert('Error', err.message || 'Something went wrong.');
  }
};
