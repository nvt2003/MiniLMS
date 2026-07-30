import api from './api';

// 1. LẤY CẤU HÌNH GIAO DIỆN
export const getPageLayout = async (groupName = 'homepage') => {
  const response = await api.get(`/settings/group/${groupName}`);
  const settingsList = response.data.data; 

  // Tìm item có setting_key là 'page_layout_config'
  const layoutSetting = settingsList.find(item => item.setting_key === 'page_layout_config');
  
  if (!layoutSetting || !layoutSetting.setting_value) return null;

  // Nếu DB đã lưu chuỗi JSON, parse ra Object/JSON cho Craft.js
  return typeof layoutSetting.setting_value === 'string' 
    ? JSON.parse(layoutSetting.setting_value) 
    : layoutSetting.setting_value;
};

// 2. LƯU CẤU HÌNH GIAO DIỆN
export const savePageLayout = async (jsonState, groupName = 'homepage') => {
  // Chuẩn hóa jsonState về dạng chuỗi JSON
  const jsonString = typeof jsonState === 'string' ? jsonState : JSON.stringify(jsonState);

  // updateByGroup mong muốn nhận body dạng Object: { "setting_key": "setting_value" }
  const payload = {
    page_layout_config: jsonString
  };

  const response = await api.put(`/settings/group/${groupName}`, payload);
  return response.data;
};
export const searchPageGroups = async (keyword = '') => {
  const response = await api.get(`/settings/group`, {
    params: { search: keyword },
  });
  return response.data.data || [];
};