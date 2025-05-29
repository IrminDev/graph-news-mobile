import axios from 'axios';

// Use environment variable or fallback to localhost
const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8080";

const authService = {
  async login(loginRequest) {
    try {
      const response = await axios.post(`${API_URL}/api/user/login`, {
        email: loginRequest.email,
        password: loginRequest.password
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw {
          message: error.response.data.message || "Login failed"
        };
      } else {
        throw {
          message: "Network error occurred"
        };
      }
    }
  },

  async register(signUpRequest) {
    try {
      const response = await axios.post(`${API_URL}/api/user/signup`, {
        email: signUpRequest.email,
        name: signUpRequest.name,
        password: signUpRequest.password
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw {
          message: error.response.data.message || "Registration failed"
        };
      } else {
        throw {
          message: "Network error occurred"
        };
      }
    }
  }
};

export default authService;