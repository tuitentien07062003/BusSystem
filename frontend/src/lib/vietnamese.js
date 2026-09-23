// src/lib/vietnamese.js
// Loại bỏ dấu tiếng Việt để search không dấu

const VIETNAMESE_MAP = {
  à: 'a', á: 'a', ạ: 'a', ả: 'a', ã: 'a',
  â: 'a', ầ: 'a', ấ: 'a', ậ: 'a', ẩ: 'a', ẫ: 'a',
  ă: 'a', ằ: 'a', ắ: 'a', ặ: 'a', ẳ: 'a', ẵ: 'a',
  è: 'e', é: 'e', ẹ: 'e', ẻ: 'e', ẽ: 'e',
  ê: 'e', ề: 'e', ế: 'e', ệ: 'e', ể: 'e', ễ: 'e',
  ì: 'i', í: 'i', ị: 'i', ỉ: 'i', ĩ: 'i',
  ò: 'o', ó: 'o', ọ: 'o', ỏ: 'o', õ: 'o',
  ô: 'o', ồ: 'o', ố: 'o', ộ: 'o', ổ: 'o', ỗ: 'o',
  ơ: 'o', ờ: 'o', ớ: 'o', ợ: 'o', ở: 'o', ỡ: 'o',
  ù: 'u', ú: 'u', ụ: 'u', ủ: 'u', ũ: 'u',
  ư: 'u', ừ: 'u', ứ: 'u', ự: 'u', ử: 'u', ữ: 'u',
  ỳ: 'y', ý: 'y', ỵ: 'y', ỷ: 'y', ỹ: 'y',
  đ: 'd',
};

export function normalizeVietnamese(str) {
  if (!str) return '';
  const lower = String(str).toLowerCase();
  let out = '';
  for (const ch of lower) {
    out += VIETNAMESE_MAP[ch] ?? ch;
  }
  return out;
}

// Kiểm tra chuỗi `text` có chứa `keyword` (đã normalize cả 2)
export function matchesSearch(text, keyword) {
  if (!keyword) return true;
  return normalizeVietnamese(text).includes(normalizeVietnamese(keyword));
}
