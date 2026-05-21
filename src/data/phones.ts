// 22 款主流在售机型 mock — 参数取自厂商官网公布数据，用于演示。
// match 字段由 scoring.ts 根据用户手长 / 手宽即时计算，这里只放静态参数。

export type Phone = {
  id: string;
  name: string;
  brand: string;
  releaseDate: string;
  price: number; // CNY
  width: number;
  height: number;
  thickness: number;
  weight: number;
  screen: number; // 英寸
  ratio: string;
  cameraBump: number; // mm
  cornerRadius: number; // R 值
  centerOfMassOffset: number; // mm（距离几何中心）
  backArc: number; // 百分比
  rearCamera: string;
  battery: string;
  imageUrl: string;
  color: 'titanium' | 'navy' | 'graphite' | 'silver' | 'ivory' | 'green';
};

export const phones: Phone[] = [
  { id: 'iphone-16-pro-max', name: 'iPhone 16 Pro Max', brand: 'Apple', releaseDate: '2024-09', price: 9999,
    width: 77.6, height: 163.0, thickness: 8.25, weight: 227, screen: 6.9, ratio: '19.5:9',
    cameraBump: 4.2, cornerRadius: 9.0, centerOfMassOffset: 6.2, backArc: 30,
    rearCamera: '48MP 主 + 48MP 超广角 + 12MP 5x', battery: '4685 mAh', imageUrl: '/assets/phone-iphone-16-pro.png', color: 'titanium' },
  { id: 'iphone-16-pro', name: 'iPhone 16 Pro', brand: 'Apple', releaseDate: '2024-09', price: 7999,
    width: 71.5, height: 149.6, thickness: 8.25, weight: 199, screen: 6.3, ratio: '19.5:9',
    cameraBump: 4.2, cornerRadius: 9.0, centerOfMassOffset: 4.8, backArc: 30,
    rearCamera: '48MP 主 + 48MP 超广角 + 12MP 5x', battery: '3582 mAh', imageUrl: '/assets/phone-iphone-16-pro.png', color: 'titanium' },
  { id: 'iphone-15', name: 'iPhone 15', brand: 'Apple', releaseDate: '2023-09', price: 5999,
    width: 71.6, height: 147.6, thickness: 7.8, weight: 171, screen: 6.1, ratio: '19.5:9',
    cameraBump: 1.6, cornerRadius: 10.5, centerOfMassOffset: 3.2, backArc: 35,
    rearCamera: '48MP 主 + 12MP 超广角', battery: '3349 mAh', imageUrl: '/assets/phone-iphone-15.png', color: 'navy' },
  { id: 'iphone-15-mini', name: 'iPhone 13 mini', brand: 'Apple', releaseDate: '2021-09', price: 4499,
    width: 64.2, height: 131.5, thickness: 7.65, weight: 141, screen: 5.4, ratio: '19.5:9',
    cameraBump: 1.4, cornerRadius: 10.0, centerOfMassOffset: 2.1, backArc: 40,
    rearCamera: '12MP 主 + 12MP 超广角', battery: '2406 mAh', imageUrl: '/assets/phone-iphone-15.png', color: 'silver' },

  { id: 's24-ultra', name: 'Samsung Galaxy S24 Ultra', brand: 'Samsung', releaseDate: '2024-01', price: 9699,
    width: 79.0, height: 162.3, thickness: 8.6, weight: 232, screen: 6.8, ratio: '19.3:9',
    cameraBump: 3.4, cornerRadius: 4.0, centerOfMassOffset: 7.6, backArc: 18,
    rearCamera: '200MP 主 + 12MP 超广角 + 50MP 5x + 10MP 3x', battery: '5000 mAh', imageUrl: '/assets/phone-s24-ultra.png', color: 'titanium' },
  { id: 's24', name: 'Samsung Galaxy S24', brand: 'Samsung', releaseDate: '2024-01', price: 5499,
    width: 70.6, height: 147.0, thickness: 7.6, weight: 167, screen: 6.2, ratio: '19.5:9',
    cameraBump: 1.8, cornerRadius: 5.0, centerOfMassOffset: 3.6, backArc: 28,
    rearCamera: '50MP 主 + 12MP 超广角 + 10MP 3x', battery: '4000 mAh', imageUrl: '/assets/phone-s24.png', color: 'ivory' },

  { id: 'xiaomi-14-ultra', name: 'Xiaomi 14 Ultra', brand: 'Xiaomi', releaseDate: '2024-02', price: 6499,
    width: 75.3, height: 161.4, thickness: 9.20, weight: 224, screen: 6.73, ratio: '20:9',
    cameraBump: 5.1, cornerRadius: 12.0, centerOfMassOffset: 5.8, backArc: 22,
    rearCamera: '50MP 主 + 50MP 超广角 + 50MP 3x + 50MP 5x', battery: '5300 mAh', imageUrl: '/assets/phone-xiaomi-14.png', color: 'graphite' },
  { id: 'xiaomi-14', name: 'Xiaomi 14', brand: 'Xiaomi', releaseDate: '2023-10', price: 3999,
    width: 71.5, height: 152.8, thickness: 8.20, weight: 188, screen: 6.36, ratio: '20:9',
    cameraBump: 2.8, cornerRadius: 8.0, centerOfMassOffset: 4.2, backArc: 32,
    rearCamera: '50MP 主 + 50MP 超广角 + 50MP 3x', battery: '4610 mAh', imageUrl: '/assets/phone-xiaomi-14.png', color: 'green' },
  { id: 'redmi-k70', name: 'Redmi K70', brand: 'Xiaomi', releaseDate: '2023-11', price: 2499,
    width: 74.6, height: 160.4, thickness: 8.6, weight: 211, screen: 6.67, ratio: '20:9',
    cameraBump: 3.0, cornerRadius: 6.0, centerOfMassOffset: 5.1, backArc: 26,
    rearCamera: '50MP 主 + 8MP 超广角 + 2MP 微距', battery: '5000 mAh', imageUrl: '/assets/phone-redmi.png', color: 'silver' },

  { id: 'oppo-find-x7-ultra', name: 'OPPO Find X7 Ultra', brand: 'OPPO', releaseDate: '2024-01', price: 5999,
    width: 74.4, height: 164.3, thickness: 9.50, weight: 221, screen: 6.82, ratio: '19.8:9',
    cameraBump: 4.5, cornerRadius: 13.5, centerOfMassOffset: 5.4, backArc: 38,
    rearCamera: '50MP 主 + 50MP 超广角 + 50MP 3x + 50MP 6x', battery: '5000 mAh', imageUrl: '/assets/phone-oppo.png', color: 'ivory' },
  { id: 'oppo-reno-12', name: 'OPPO Reno 12 Pro', brand: 'OPPO', releaseDate: '2024-05', price: 3699,
    width: 74.5, height: 161.5, thickness: 7.4, weight: 180, screen: 6.7, ratio: '20:9',
    cameraBump: 1.6, cornerRadius: 14.0, centerOfMassOffset: 3.8, backArc: 42,
    rearCamera: '50MP 主 + 8MP 超广角 + 50MP 2x', battery: '5000 mAh', imageUrl: '/assets/phone-oppo.png', color: 'navy' },

  { id: 'vivo-x100-pro', name: 'vivo X100 Pro', brand: 'vivo', releaseDate: '2023-11', price: 4999,
    width: 75.2, height: 164.1, thickness: 9.0, weight: 221, screen: 6.78, ratio: '20:9',
    cameraBump: 4.0, cornerRadius: 11.0, centerOfMassOffset: 6.4, backArc: 30,
    rearCamera: '50MP 主 + 50MP 超广角 + 100MP 4.3x', battery: '5400 mAh', imageUrl: '/assets/phone-vivo.png', color: 'graphite' },
  { id: 'vivo-x100s', name: 'vivo X100s', brand: 'vivo', releaseDate: '2024-05', price: 4299,
    width: 74.5, height: 162.0, thickness: 7.85, weight: 205, screen: 6.78, ratio: '20:9',
    cameraBump: 3.6, cornerRadius: 11.0, centerOfMassOffset: 5.0, backArc: 32,
    rearCamera: '50MP 主 + 50MP 超广角 + 64MP 3x', battery: '5100 mAh', imageUrl: '/assets/phone-vivo.png', color: 'titanium' },

  { id: 'honor-magic-6-pro', name: 'HONOR Magic 6 Pro', brand: 'HONOR', releaseDate: '2024-01', price: 5699,
    width: 75.8, height: 162.5, thickness: 8.9, weight: 229, screen: 6.8, ratio: '20:9',
    cameraBump: 4.1, cornerRadius: 13.0, centerOfMassOffset: 5.6, backArc: 36,
    rearCamera: '50MP 主 + 50MP 超广角 + 180MP 2.5x', battery: '5600 mAh', imageUrl: '/assets/phone-honor.png', color: 'green' },
  { id: 'honor-100', name: 'HONOR 100', brand: 'HONOR', releaseDate: '2023-11', price: 2499,
    width: 73.6, height: 162.5, thickness: 7.81, weight: 191, screen: 6.7, ratio: '20:9',
    cameraBump: 1.5, cornerRadius: 12.0, centerOfMassOffset: 3.4, backArc: 38,
    rearCamera: '50MP 主 + 12MP 超广角', battery: '5000 mAh', imageUrl: '/assets/phone-honor.png', color: 'ivory' },

  { id: 'pixel-9-pro', name: 'Google Pixel 9 Pro', brand: 'Google', releaseDate: '2024-08', price: 6299,
    width: 72.0, height: 152.8, thickness: 8.5, weight: 199, screen: 6.3, ratio: '19.5:9',
    cameraBump: 4.3, cornerRadius: 8.5, centerOfMassOffset: 4.4, backArc: 16,
    rearCamera: '50MP 主 + 48MP 超广角 + 48MP 5x', battery: '4700 mAh', imageUrl: '/assets/phone-pixel.png', color: 'titanium' },
  { id: 'pixel-8', name: 'Google Pixel 8', brand: 'Google', releaseDate: '2023-10', price: 4499,
    width: 70.8, height: 150.5, thickness: 8.9, weight: 187, screen: 6.2, ratio: '20:9',
    cameraBump: 2.5, cornerRadius: 8.0, centerOfMassOffset: 3.0, backArc: 22,
    rearCamera: '50MP 主 + 12MP 超广角', battery: '4575 mAh', imageUrl: '/assets/phone-pixel.png', color: 'navy' },

  { id: 'oneplus-12', name: 'OnePlus 12', brand: 'OnePlus', releaseDate: '2023-12', price: 4299,
    width: 75.8, height: 164.3, thickness: 9.15, weight: 220, screen: 6.82, ratio: '19.8:9',
    cameraBump: 3.2, cornerRadius: 9.5, centerOfMassOffset: 5.2, backArc: 28,
    rearCamera: '50MP 主 + 48MP 超广角 + 64MP 3x', battery: '5400 mAh', imageUrl: '/assets/phone-oneplus.png', color: 'green' },

  { id: 'realme-gt7', name: 'realme GT7 Pro', brand: 'realme', releaseDate: '2024-11', price: 3599,
    width: 76.1, height: 162.5, thickness: 8.55, weight: 222, screen: 6.78, ratio: '20:9',
    cameraBump: 2.9, cornerRadius: 8.0, centerOfMassOffset: 4.6, backArc: 30,
    rearCamera: '50MP 主 + 8MP 超广角 + 50MP 3x', battery: '6500 mAh', imageUrl: '/assets/phone-realme.png', color: 'graphite' },

  { id: 'meizu-21', name: 'Meizu 21 Pro', brand: 'Meizu', releaseDate: '2024-03', price: 5599,
    width: 75.4, height: 164.6, thickness: 8.49, weight: 209, screen: 6.79, ratio: '20:9',
    cameraBump: 2.8, cornerRadius: 11.5, centerOfMassOffset: 4.8, backArc: 32,
    rearCamera: '50MP 主 + 13MP 超广角 + 50MP 3.2x', battery: '5050 mAh', imageUrl: '/assets/phone-meizu.png', color: 'silver' },

  { id: 'iqoo-12', name: 'iQOO 12', brand: 'iQOO', releaseDate: '2023-11', price: 3699,
    width: 75.1, height: 163.2, thickness: 8.1, weight: 199, screen: 6.78, ratio: '20:9',
    cameraBump: 2.4, cornerRadius: 10.0, centerOfMassOffset: 4.0, backArc: 30,
    rearCamera: '50MP 主 + 50MP 超广角 + 64MP 3x', battery: '5000 mAh', imageUrl: '/assets/phone-iqoo.png', color: 'navy' },

  { id: 'sony-xperia-1-vi', name: 'Sony Xperia 1 VI', brand: 'Sony', releaseDate: '2024-06', price: 11999,
    width: 74.0, height: 162.0, thickness: 8.2, weight: 192, screen: 6.5, ratio: '19.5:9',
    cameraBump: 2.6, cornerRadius: 6.0, centerOfMassOffset: 4.4, backArc: 22,
    rearCamera: '48MP 主 + 12MP 超广角 + 12MP 3.5-7.1x', battery: '5000 mAh', imageUrl: '/assets/phone-sony.png', color: 'graphite' },
];

export type PhoneBrand = Phone['brand'];
export const phoneBrands: PhoneBrand[] = Array.from(new Set(phones.map((p) => p.brand)));
