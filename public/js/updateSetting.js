import { showAlert } from './alerts'; // Ensure correct import path

// type is either 'password' or 'data'
export const updateSettings = async (data, type) => {
  try {
    const url =
      type === 'password'
        ? '/api/v1/users/updateMyPassword'
        : '/api/v1/users/updateMe';

    const options = {
      method: 'PATCH',
      body: data // Directly use the FormData object
    };

    // Only set headers for JSON data, not for FormData
    if (type === 'password') {
      options.headers = {
        'Content-Type': 'application/json'
      };
      options.body = JSON.stringify(data); // Convert data to JSON string for password updates
    }

    const res = await fetch(url, options);

    const resData = await res.json();

    if (resData.status === 'success') {
      showAlert('success', `${type.toUpperCase()} updated successfully!`);
    } else {
      showAlert('error', resData.message);
    }
  } catch (err) {
    showAlert('error', 'An error occurred while updating settings.');
  }
};
