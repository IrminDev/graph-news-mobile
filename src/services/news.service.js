import axios from 'axios';

// Use environment variable or fallback to localhost
const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://192.168.0.182:8080";

const newsService = {
  async uploadNewsFile(token, formData) {
    try {
      const response = await axios.post(`${API_URL}/api/news/upload/file`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        }
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw {
          message: error.response.data.message || "File upload failed"
        };
      }
      throw {
        message: "Network error occurred during file upload"
      };
    }
  },

  async uploadNewsContent(token, data) {
    try {
      const response = await axios.post(`${API_URL}/api/news/upload/content`, data, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw {
          message: error.response.data.message || "Content upload failed"
        };
      }
      throw {
        message: "Network error occurred during content upload"
      };
    }
  },

  async uploadNewsURL(token, data) {
    try {
      const response = await axios.post(`${API_URL}/api/news/upload/url`, data, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw {
          message: error.response.data.message || "URL upload failed"
        };
      }
      throw {
        message: "Network error occurred during URL upload"
      };
    }
  },

  async getNewsById(id) {
    try {
      console.log('Fetching news by ID:', id);
      const response = await axios.get(`${API_URL}/api/news/${id}`);
      return response.data;
    } catch (error) {
      console.log('Get news by ID error:', error);
      if (axios.isAxiosError(error) && error.response) {
        throw {
          message: error.response.data.message || "Failed to fetch news article"
        };
      }
      throw {
        message: "Network error occurred while fetching the news article"
      };
    }
  },

  async getUserNews(token, userId) {
    try {
      const response = await axios.get(`${API_URL}/api/news/user/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw {
          message: error.response.data.message || "Failed to fetch user news"
        };
      }
      throw {
        message: "Network error occurred while fetching user news"
      };
    }
  },

  async getUserNewsPaged(token, userId, page = 0, size = 10) {
    try {
      const response = await axios.get(`${API_URL}/api/news/user/${userId}/paged`, {
        params: { page, size },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw {
          message: error.response.data.message || "Failed to fetch user news"
        };
      }
      throw {
        message: "Network error occurred while fetching user news"
      };
    }
  },

  async deleteNews(token, id) {
    try {
      const response = await axios.delete(`${API_URL}/api/news/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw {
          message: error.response.data.message || "Failed to delete news article"
        };
      }
      throw {
        message: "Network error occurred while deleting the news article"
      };
    }
  },

  async getLatestNews(token, limit = 5) {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(`${API_URL}/api/news/latest`, {
        params: { limit },
        headers
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw {
          message: error.response.data.message || "Failed to fetch latest news"
        };
      }
      throw {
        message: "Network error occurred while fetching the latest news"
      };
    }
  },

  async getNewsByDateRange(token, startDate, endDate, page = 0, size = 10) {
    try {
      const response = await axios.get(`${API_URL}/api/news/date-range`, {
        params: { startDate, endDate, page, size },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw {
          message: error.response.data.message || "Failed to fetch news by date range"
        };
      }
      throw {
        message: "Network error occurred while fetching news by date range"
      };
    }
  },

  async getUserNewsByDateRange(token, userId, startDate, endDate, page = 0, size = 10) {
    try {
      // First get all user news with pagination
      const response = await this.getUserNewsPaged(token, userId, page, size);
      
      if (!response || !response.newsList) {
        return { newsList: [], totalCount: 0 };
      }
      
      // Then filter on client-side by date range if dates provided
      if (startDate && endDate) {
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
        
        const filteredNews = response.newsList.filter((news) => {
          if (!news.createdAt) return false;
          const newsDate = new Date(news.createdAt);
          return newsDate >= startDateObj && newsDate <= endDateObj;
        });
        
        return { 
          newsList: filteredNews,
          totalCount: filteredNews.length
        };
      }
      
      // Return original response if no date filtering
      return response;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw {
          message: error.response.data.message || "Failed to fetch user news by date range"
        };
      }
      throw {
        message: "Network error occurred while fetching user news by date range"
      };
    }
  },

  /**
   * Search for news articles based on a query string
   */
  async searchNews(token, query, page = 0, size = 10) {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await axios.get(`${API_URL}/api/news/search`, {
        params: { query, page, size },
        headers
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw {
          message: error.response.data.message || "Search failed"
        };
      }
      throw {
        message: "Network error occurred while searching for news"
      };
    }
  },

  async getRelatedNews(newsId, limit = 5) {
    try {
      const response = await axios.get(`${API_URL}/api/news/${newsId}/related`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw {
          message: error.response.data.message || "Failed to fetch related news"
        };
      }
      throw {
        message: "Network error occurred while fetching related news"
      };
    }
  },

  /**
   * Get knowledge graph data for a specific news article
   */
  async getNewsGraph(newsId) {
    try {
      console.log('Fetching graph for news ID:', newsId);
      const response = await axios.get(`${API_URL}/api/graph/news/${newsId}`);
      return response.data;
    } catch (error) {
      console.log('Get news graph error:', error);
      if (axios.isAxiosError(error) && error.response) {
        throw {
          message: error.response.data.message || "Failed to fetch graph data"
        };
      }
      throw {
        message: "Network error occurred while fetching graph data"
      };
    }
  }
};

export default newsService;