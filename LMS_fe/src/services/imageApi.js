import api from './api';

// 1. UPLOAD MỘT TỆP ẢNH LÊN CLOUDINARY
export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);

  const response = await api.post('/api/images/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data; 
};

// 2. XÓA ẢNH TRÊN CLOUDINARY
export const deleteImage = async (imageId) => {
  const response = await api.delete(`/api/images/${imageId}`);
  return response.data;
};