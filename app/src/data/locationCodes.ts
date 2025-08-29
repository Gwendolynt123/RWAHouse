// 国家和城市的映射数据
// 在界面上显示实际名称，但上链时使用数字代码

export interface Country {
  code: number;
  name: string;
  nameEn: string;
}

export interface City {
  code: number;
  name: string;
  nameEn: string;
  countryCode: number;
}

// 国家代码映射
export const COUNTRIES: Country[] = [
  { code: 1, name: '美国', nameEn: 'United States' },
  { code: 86, name: '中国', nameEn: 'China' },
  { code: 44, name: '英国', nameEn: 'United Kingdom' },
  { code: 81, name: '日本', nameEn: 'Japan' },
  { code: 33, name: '法国', nameEn: 'France' },
  { code: 49, name: '德国', nameEn: 'Germany' },
  { code: 39, name: '意大利', nameEn: 'Italy' },
  { code: 7, name: '俄罗斯', nameEn: 'Russia' },
  { code: 91, name: '印度', nameEn: 'India' },
  { code: 55, name: '巴西', nameEn: 'Brazil' },
  { code: 61, name: '澳大利亚', nameEn: 'Australia' },
  { code: 82, name: '韩国', nameEn: 'South Korea' },
  { code: 65, name: '新加坡', nameEn: 'Singapore' },
  { code: 852, name: '香港', nameEn: 'Hong Kong' },
  { code: 41, name: '瑞士', nameEn: 'Switzerland' },
];

// 城市代码映射 - 按国家组织
export const CITIES: City[] = [
  // 美国 (1)
  { code: 1001, name: '纽约', nameEn: 'New York', countryCode: 1 },
  { code: 1002, name: '洛杉矶', nameEn: 'Los Angeles', countryCode: 1 },
  { code: 1003, name: '芝加哥', nameEn: 'Chicago', countryCode: 1 },
  { code: 1004, name: '休斯顿', nameEn: 'Houston', countryCode: 1 },
  { code: 1005, name: '旧金山', nameEn: 'San Francisco', countryCode: 1 },
  { code: 1006, name: '西雅图', nameEn: 'Seattle', countryCode: 1 },
  { code: 1007, name: '迈阿密', nameEn: 'Miami', countryCode: 1 },
  { code: 1008, name: '波士顿', nameEn: 'Boston', countryCode: 1 },

  // 中国 (86)
  { code: 8601, name: '北京', nameEn: 'Beijing', countryCode: 86 },
  { code: 8602, name: '上海', nameEn: 'Shanghai', countryCode: 86 },
  { code: 8603, name: '广州', nameEn: 'Guangzhou', countryCode: 86 },
  { code: 8604, name: '深圳', nameEn: 'Shenzhen', countryCode: 86 },
  { code: 8605, name: '杭州', nameEn: 'Hangzhou', countryCode: 86 },
  { code: 8606, name: '南京', nameEn: 'Nanjing', countryCode: 86 },
  { code: 8607, name: '成都', nameEn: 'Chengdu', countryCode: 86 },
  { code: 8608, name: '武汉', nameEn: 'Wuhan', countryCode: 86 },

  // 英国 (44)
  { code: 4401, name: '伦敦', nameEn: 'London', countryCode: 44 },
  { code: 4402, name: '曼彻斯特', nameEn: 'Manchester', countryCode: 44 },
  { code: 4403, name: '伯明翰', nameEn: 'Birmingham', countryCode: 44 },
  { code: 4404, name: '利物浦', nameEn: 'Liverpool', countryCode: 44 },
  { code: 4405, name: '爱丁堡', nameEn: 'Edinburgh', countryCode: 44 },

  // 日本 (81)
  { code: 8101, name: '东京', nameEn: 'Tokyo', countryCode: 81 },
  { code: 8102, name: '大阪', nameEn: 'Osaka', countryCode: 81 },
  { code: 8103, name: '京都', nameEn: 'Kyoto', countryCode: 81 },
  { code: 8104, name: '横滨', nameEn: 'Yokohama', countryCode: 81 },
  { code: 8105, name: '名古屋', nameEn: 'Nagoya', countryCode: 81 },

  // 法国 (33)
  { code: 3301, name: '巴黎', nameEn: 'Paris', countryCode: 33 },
  { code: 3302, name: '里昂', nameEn: 'Lyon', countryCode: 33 },
  { code: 3303, name: '马赛', nameEn: 'Marseille', countryCode: 33 },
  { code: 3304, name: '尼斯', nameEn: 'Nice', countryCode: 33 },

  // 德国 (49)
  { code: 4901, name: '柏林', nameEn: 'Berlin', countryCode: 49 },
  { code: 4902, name: '慕尼黑', nameEn: 'Munich', countryCode: 49 },
  { code: 4903, name: '汉堡', nameEn: 'Hamburg', countryCode: 49 },
  { code: 4904, name: '法兰克福', nameEn: 'Frankfurt', countryCode: 49 },

  // 新加坡 (65)
  { code: 6501, name: '新加坡', nameEn: 'Singapore', countryCode: 65 },

  // 香港 (852)
  { code: 85201, name: '香港', nameEn: 'Hong Kong', countryCode: 852 },

  // 瑞士 (41)
  { code: 4101, name: '苏黎世', nameEn: 'Zurich', countryCode: 41 },
  { code: 4102, name: '日内瓦', nameEn: 'Geneva', countryCode: 41 },
];

// 辅助函数
export const getCountryByCode = (code: number): Country | undefined => {
  return COUNTRIES.find(country => country.code === code);
};

export const getCityByCode = (code: number): City | undefined => {
  return CITIES.find(city => city.code === code);
};

export const getCitiesByCountry = (countryCode: number): City[] => {
  return CITIES.filter(city => city.countryCode === countryCode);
};

export const getCountryName = (code: number): string => {
  const country = getCountryByCode(code);
  return country ? country.name : `Unknown Country (${code})`;
};

export const getCityName = (code: number): string => {
  const city = getCityByCode(code);
  return city ? city.name : `Unknown City (${code})`;
};