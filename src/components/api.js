const API_BASE_URL = 'https://serverzoom-mpbv.onrender.com'; // Replace with your server's URL

export const addUser = async (roomId, userName) => {
  console.log('Adding user:', roomId, userName);
  try {
    const response = await fetch(`${API_BASE_URL}/api/addUser`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ roomId, userName }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to add user');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error adding user:', error);
    throw error;
  }
};

export const removeUser = async (roomId, userName) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/removeUser`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ roomId, userName }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to remove user');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error removing user:', error);
    throw error;
  }
};