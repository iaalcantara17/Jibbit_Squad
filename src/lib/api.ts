// API client for backend communication
const API_BASE_URL = 'https://api.jibbit.app/api';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: number;
    message: string;
    fields?: string[];
  };
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface UserProfile {
  _id?: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  headline?: string;
  bio?: string;
  industry?: string;
  experienceLevel?: string;
  basicInfo?: {
    phoneNumber?: string;
    location?: string;
    professionalHeadline?: string;
    bio?: string;
    industry?: string;
    experienceLevel?: string;
  };
  employmentHistory?: any[];
  skills?: any[];
  education?: any[];
  certifications?: any[];
  projects?: any[];
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

class ApiClient {
  private getAuthHeader(): HeadersInit {
    const token = localStorage.getItem('auth_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeader(),
          ...options.headers,
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: {
          code: 500,
          message: 'Network error. Please check your connection.',
        },
      };
    }
  }

  // Auth endpoints
  async register(data: RegisterData) {
    return this.request<{ id: string; email: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: LoginData) {
    return this.request<{ token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async logout() {
    return this.request('/auth/logout', { method: 'POST' });
  }

  async deleteAccount(password: string) {
    return this.request<void>('/auth/delete-account', {
      method: 'DELETE',
      body: JSON.stringify({ password }),
    });
  }

  async checkProvider(email: string) {
    return this.request<{ provider: string }>('/auth/check-provider', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async forgotPassword(email: string) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, password: string) {
    return this.request(`/auth/reset-password/${token}`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  }

  async verifyOAuthToken(token: string) {
    return this.request<{ token: string }>('/auth/verify-token', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  // User endpoints
  async getProfile() {
    return this.request<UserProfile>('/users/me');
  }

  async updateProfile(profileData: Partial<UserProfile>) {
    return this.request<UserProfile>('/users/me', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // Basic Info endpoints
  async getBasicInfo() {
    return this.request<any[]>('/users/me/basic-info');
  }

  async createBasicInfo(data: any) {
    return this.request<any>('/users/me/basic-info', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBasicInfo(id: string, data: any) {
    return this.request<any>(`/users/me/basic-info/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteBasicInfo(id: string) {
    return this.request<null>(`/users/me/basic-info/${id}`, {
      method: 'DELETE',
    });
  }

  // Employment History endpoints
  async getEmploymentHistory() {
    return this.request<any[]>('/users/me/employment');
  }

  async addEmployment(data: any) {
    return this.request<any>('/users/me/employment', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEmployment(id: string, data: any) {
    return this.request<any>(`/users/me/employment/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteEmployment(id: string) {
    return this.request<null>(`/users/me/employment/${id}`, {
      method: 'DELETE',
    });
  }

  // Skills endpoints
  async getSkills() {
    return this.request<any[]>('/users/me/skills');
  }

  async addSkill(data: any) {
    return this.request<any>('/users/me/skills', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSkill(id: string, data: any) {
    return this.request<any>(`/users/me/skills/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteSkill(id: string) {
    return this.request<null>(`/users/me/skills/${id}`, {
      method: 'DELETE',
    });
  }

  // Education endpoints
  async getEducation() {
    return this.request<any[]>('/users/me/education');
  }

  async addEducation(data: any) {
    return this.request<any>('/users/me/education', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEducation(id: string, data: any) {
    return this.request<any>(`/users/me/education/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteEducation(id: string) {
    return this.request<null>(`/users/me/education/${id}`, {
      method: 'DELETE',
    });
  }

  // Certifications endpoints
  async getCertifications() {
    return this.request<any[]>('/users/me/certifications');
  }

  async addCertification(data: any) {
    return this.request<any>('/users/me/certifications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCertification(id: string, data: any) {
    return this.request<any>(`/users/me/certifications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCertification(id: string) {
    return this.request<null>(`/users/me/certifications/${id}`, {
      method: 'DELETE',
    });
  }

  // Projects endpoints
  async getProjects() {
    return this.request<any[]>('/users/me/projects');
  }

  async addProject(data: any) {
    return this.request<any>('/users/me/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProject(id: string, data: any) {
    return this.request<any>(`/users/me/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProject(id: string) {
    return this.request<null>(`/users/me/projects/${id}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiClient();
