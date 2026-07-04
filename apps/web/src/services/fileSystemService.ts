import { apiRequest } from '@/utils/api';
import type { FileNode, ApiResponse } from '@/types';

export const fileSystemService = {
  async list(token: string, parentId?: string): Promise<FileNode[]> {
    const params = parentId ? `?parentId=${parentId}` : '';
    const response = await apiRequest<ApiResponse<FileNode[]>>(`/api/filesystem${params}`, { token });
    return response.data ?? [];
  },

  async createFolder(name: string, token: string, parentId?: string): Promise<FileNode> {
    const response = await apiRequest<ApiResponse<FileNode>>('/api/filesystem/folder', {
      method: 'POST',
      body: JSON.stringify({ name, parentId }),
      token,
    });
    return response.data!;
  },

  async createFile(
    name: string,
    token: string,
    options?: { parentId?: string; mimeType?: string; content?: string }
  ): Promise<FileNode> {
    const response = await apiRequest<ApiResponse<FileNode>>('/api/filesystem/file', {
      method: 'POST',
      body: JSON.stringify({ name, ...options }),
      token,
    });
    return response.data!;
  },

  async delete(id: string, token: string): Promise<void> {
    await apiRequest(`/api/filesystem/${id}`, { method: 'DELETE', token });
  },
};
