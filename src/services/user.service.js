import axios from 'axios';

// Use environment variable or fallback to localhost
const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://192.168.0.182:8000";

const userService = {
  async getMe(token) {
    try {
      const response = await axios.get(`${API_URL}/api/user/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log('User profile:', response.data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw {
          message: error.response.data.message || "Failed to get user profile"
        };
      }
      throw {
        message: "Network error occurred while fetching profile"
      };
    }
  },

  async getAllUsers(token) {
    try {
      const response = await axios.get(`${API_URL}/api/user/all`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log('All users:', response.data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw {
          message: error.response.data.message || "Failed to get users"
        };
      }
      throw {
        message: "Network error occurred while fetching users"
      };
    }
  },

  async getUserById(token, id) {
    try {
      const response = await axios.get(`${API_URL}/api/user/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.log('Get user by ID error:', error);
      if (axios.isAxiosError(error) && error.response) {
        throw {
          message: error.response.data.message || "Failed to get user"
        };
      }
      throw {
        message: "Network error occurred while fetching user"
      };
    }
  },

  async updateUser(request, id, token) {
    try {
      const response = await axios.put(`${API_URL}/api/user/${id}`, request, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw {
          message: error.response.data.message || "Failed to update user"
        };
      }
      throw {
        message: "Network error occurred while updating user"
      };
    }
  },

  async deleteUser(token, id) {
    try {
      const response = await axios.delete(`${API_URL}/api/user/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw {
          message: error.response.data.message || "Failed to delete user"
        };
      }
      throw {
        message: "Network error occurred while deleting user"
      };
    }
  },

  // New method: Update user info only (no image)
  async updateMeInfo(token, request) {
    try {
      const response = await axios.put(`${API_URL}/api/user/update/me/info`, request, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw {
          message: error.response.data.message || "Failed to update profile"
        };
      }
      throw {
        message: "Network error occurred while updating profile"
      };
    }
  },

  // New method: Update profile image only
  async updateMeWithImage(token, image) {
    try {
      const formData = new FormData();
      if (image) {
        formData.append('image', {
          uri: image,
          type: 'image/jpeg',
          name: 'profile.jpg'
        });
      } else {
        formData.append('image', null); // Handle case where no image is provided
      }
      
      const response = await axios.put(`${API_URL}/api/user/update/me/image`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
      }})
      
      return response.data;
    } catch (error) {
      console.error('Update profile error:', JSON.stringify(error));
      throw {
        message: error.message || "Failed to update profile"
      };
    }
  },

  async updatePassword(token, request) {
    try {
      const response = await axios.put(`${API_URL}/api/user/update/me/password`, request, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw {
          message: error.response.data.message || "Failed to update password"
        };
      }
      throw {
        message: "Network error occurred while updating password"
      };
    }
  },

  async createUserByAdmin(token, request) {
    try {
      const response = await axios.post(`${API_URL}/api/user/create/user`, request, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw {
          message: error.response.data.message || "Failed to create user"
        };
      }
      throw {
        message: "Network error occurred while creating user"
      };
    }
  },

  async deleteMe(token) {
    try {
      const response = await axios.delete(`${API_URL}/api/user/delete/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw {
          message: error.response.data.message || "Failed to delete account"
        };
      }
      throw {
        message: "Network error occurred while deleting account"
      };
    }
  }
};

export default userService;