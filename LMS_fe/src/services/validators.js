export const maxChar = (value,length,msg) => {
  if (!value) return null;
  return value.length <= length
    ? null
    : `${msg} không được vượt quá ${length} ký tự`;
};
export const minChar = (value,length,msg) => {
  if (!value) return null;
  return value.length >= length
    ? null
    : `${msg} cần tối thiểu ${length} ký tự`;
};
export const required = (value,message = "Trường này là bắt buộc") => {
  if (value === null || value === undefined) return message;

  if (typeof value === "string" && value.trim() === "") {
    return message;
  }

  return null;
};