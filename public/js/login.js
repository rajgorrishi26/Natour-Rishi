/* eslint-disable */ 
import { showAlert } from './alerts';
 

export const login = async (email, password) => {
  try {
    const res = await fetch('/api/v1/users/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password }) 
    });

    const data = await res.json();

    if (data.status === 'success') {
      showAlert('success', 'Logged in successfully!');
      window.setTimeout(() => {
        location.assign('/');
      }, 1000);
    } else {
      showAlert('error', data.message);
    }
  } catch (err) {
    console.log(err.response);
    showAlert('error', 'Error logging in! Try again.');
  }
};

export const logout = async () => {
  try {
    const res = await fetch('/api/v1/users/logout', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await res.json();

    // if (data.status === 'success') {
    //   location.reload(true);
    // } else {
    //   showAlert('error', data.message);
    // }
    if (data.status === 'success') {
      showAlert('success', 'Logged out successfully!');
      window.setTimeout(() => {
        location.assign('/');
      }, 1000);
    } else {
      showAlert('error', data.message);
    }
  } catch (err) {
    console.log(err);
    showAlert('error', 'Error logging out! Try again.');
  }
};

export const signup = async (name, email, password, passwordConfirm) => {
  try {
    const res = await fetch('/api/v1/users/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, email, password, passwordConfirm })
    });

    const data = await res.json();

    if (data.status === 'success') {
      showAlert('success', 'Signed up successfully!');
      window.setTimeout(() => {
        location.assign('/');
      }, 1000);
    } else {
      showAlert('error', data.message);
    }
  } catch (err) {
    console.log(err.response);
    showAlert('error', 'Error signing up! Try again.');
  }
};