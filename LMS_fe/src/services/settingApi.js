import api from './api';

// 1. LẤY CẤU HÌNH GIAO DIỆN
export const getPageLayout = async (group,key='page_layout_config') => {
  try{
    const response = await api.get(`/settings/group/${group}/${key}`);
    const settings = response.data.data; 

    if (!Array.isArray(settings) || settings.length === 0) {
      return null;
    }

    const setting = settings[0];

    if (!setting.setting_value) {
      return null;
    }

    return typeof setting.setting_value === 'string'
      ? JSON.parse(setting.setting_value)
    : setting.setting_value;
  }catch (error) {
    console.error("Lỗi lấy page layout:", error);
    return [];
  }
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
export const searchSettings = async (parent,group,key) => {
  const response = await api.get(`/settings/parent`,{
    params: {
      parent,
      group,
      key,
    },
  });
  return response.data.data || [];
};
export const createSetting = async (data) => {
  const res = await api.post("/settings", data);
  return res.data.data;
};
export const updateSettingValueApi = async (data) => {
  const res = await api.put("/settings", data);
  return res.data;
};
