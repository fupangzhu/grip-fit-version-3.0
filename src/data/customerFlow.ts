export type PhoneItem = {
  id: string;
  brand: string;
  name: string;
  date: string;
  releaseDate: string;
  width: number;
  height: number;
  thickness: number;
  weight: number;
  match: number;
  gripScore: number;
  price: string;
  screen: string;
  battery: string;
  rearCamera: string;
  color: 'black' | 'gold' | 'green' | 'blue' | 'silver';
  imageUrl: string;
  sourceUrls: string[];
};

export type Metric = {
  label: string;
  value: number;
  unit: string;
  desc: string;
  rank: string;
  percent: number;
};

export type ReportRow = {
  name: string;
  value: string;
  score: number;
  weight: number;
  status: 'risk' | 'warn' | 'good';
  advice: string;
};

export type OptimalParam = {
  label: string;
  value: string;
  unit: string;
};

export type ComparisonScore = {
  label: string;
  ideal: number;
  iphone: number;
  galaxy: number;
};

export const phones: PhoneItem[] = [
  {
    id: 'iphone-16-pro',
    brand: 'Apple',
    name: 'iPhone 16 Pro',
    date: '2024.09 上市',
    releaseDate: '2024-09-09',
    width: 71.5,
    height: 149.6,
    thickness: 8.25,
    weight: 199,
    match: 94.2,
    gripScore: 9.4,
    price: '¥7,999 起',
    screen: '6.3 英寸 Super Retina XDR',
    battery: '视频播放最长 27 小时',
    rearCamera: '48MP Fusion + 48MP Ultra Wide + 12MP Telephoto',
    color: 'silver',
    imageUrl: 'https://cdsassets.apple.com/live/7WUAS350/images/tech-specs/121031-iphone-16-pro.png',
    sourceUrls: [
      'https://support.apple.com/en-lamr/121031',
      'https://www.apple.com/newsroom/2024/09/apple-debuts-iphone-16-pro-and-iphone-16-pro-max/',
    ],
  },
  {
    id: 's24-ultra',
    brand: 'Samsung',
    name: 'Galaxy S24 Ultra',
    date: '2024.01 上市',
    releaseDate: '2024-01-17',
    width: 79,
    height: 162.3,
    thickness: 8.6,
    weight: 232,
    match: 88.6,
    gripScore: 8.1,
    price: '¥9,699 起',
    screen: '6.8 英寸 QHD+ Dynamic AMOLED 2X',
    battery: '5000 mAh',
    rearCamera: '200MP Wide + 50MP 5x Tele + 12MP Ultra Wide + 10MP 3x Tele',
    color: 'black',
    imageUrl: 'https://img.global.news.samsung.com/global/wp-content/uploads/2024/01/Galaxy-S24-Series_dl1-728x410.jpg',
    sourceUrls: [
      'https://news.samsung.com/global/enter-the-new-era-of-mobile-ai-with-samsung-galaxy-s24-series',
      'https://news.samsung.com/us/enter-new-era-of-mobile-ai-samsung-galaxy-s24-series',
    ],
  },
  {
    id: 'vivo-x100-pro',
    brand: 'vivo',
    name: 'vivo X100 Pro',
    date: '2023.11 上市',
    releaseDate: '2023-11-13',
    width: 75.28,
    height: 164.05,
    thickness: 8.91,
    weight: 225,
    match: 86.4,
    gripScore: 8.3,
    price: '¥4,999 起',
    screen: '6.78 英寸 AMOLED',
    battery: '5400 mAh',
    rearCamera: '50MP 主摄 + 50MP 超广角 + 50MP 蔡司 APO 超级长焦',
    color: 'blue',
    imageUrl: 'https://asia-exstatic-vivofs.vivo.com/PSee2l50xoirPK7y/1709016772268/15c5c97edbd6a3cdb931002e6ea9ddf6.png',
    sourceUrls: [
      'https://www.vivo.com/id/products/param/x100pro',
      'https://www.vivo.com/eu/about-vivo/news/X100Pro',
      'https://m.vivo.com.cn/vivo/param/x100pro',
    ],
  },
  {
    id: 'oppo-find-x7-ultra',
    brand: 'OPPO',
    name: 'OPPO Find X7 Ultra',
    date: '2024.01 上市',
    releaseDate: '2024-01-08',
    width: 76.2,
    height: 164.3,
    thickness: 9.5,
    weight: 221,
    match: 84.9,
    gripScore: 8.0,
    price: '¥5,999 起',
    screen: '6.82 英寸 QHD+ AMOLED',
    battery: '5000 mAh',
    rearCamera: '双潜望四主摄 HyperTone 影像系统',
    color: 'gold',
    imageUrl: 'https://www.oppo.com/content/dam/oppo/common/mkt/v2-2/find-x7-series-cn/specs/find-x7-ultra-976_720.png',
    sourceUrls: [
      'https://www.oppo.com/cn/smartphones/series-find-x/find-x7-ultra/specs/',
      'https://www.oppo.com/en/newsroom/press/oppo-find-x7-ultra-hypertone-camera-system/',
      'https://www.ithome.com/0/743/979.htm',
    ],
  },
  {
    id: 'xiaomi-14-ultra',
    brand: 'Xiaomi',
    name: 'Xiaomi 14 Ultra',
    date: '2024.02 上市',
    releaseDate: '2024-02-22',
    width: 75.3,
    height: 161.4,
    thickness: 9.2,
    weight: 219.8,
    match: 83.5,
    gripScore: 7.9,
    price: '¥6,499 起',
    screen: '6.73 英寸 WQHD+ AMOLED',
    battery: '5000 mAh',
    rearCamera: 'Leica 四摄 50MP 主摄 + 50MP 超广角 + 双长焦',
    color: 'black',
    imageUrl: 'https://i02.appmifile.com/334_operator_sg/22/02/2024/d36105f6de5a716a1c0737352c2827be.png',
    sourceUrls: [
      'https://www.mi.com/uk/product/xiaomi-14-ultra/specs/',
      'https://www.gadgets360.com/mobiles/news/xiaomi-14-ultra-price-specifications-features-china-launch-5110891',
      'https://www.gizmochina.com/2024/02/27/xiaomi-14-ultra-first-sale-china/',
    ],
  },
  {
    id: 'honor-magic6-pro',
    brand: 'HONOR',
    name: 'HONOR Magic6 Pro',
    date: '2024.01 上市',
    releaseDate: '2024-01-11',
    width: 75.8,
    height: 162.5,
    thickness: 8.9,
    weight: 229,
    match: 81.8,
    gripScore: 7.6,
    price: '¥5,699 起',
    screen: '6.8 英寸 LTPO OLED',
    battery: '5600 mAh',
    rearCamera: '50MP 广角 + 50MP 超广角 + 180MP 潜望长焦',
    color: 'green',
    imageUrl: 'https://www-file.honor.com/content/dam/honor/global/specs/smartphone/honor-magic6-pro/honor-magic6-pro-green-spec.png',
    sourceUrls: [
      'https://www.honor.com/global/phones/honor-magic6-pro/spec/',
      'https://www.honor.com/cn/news/honor-magic6-launch/',
      'https://www.honor.com/cn/phones/honor-magic6-pro/',
    ],
  },
];

export const userMetrics: Metric[] = [
  {
    label: '手长',
    value: 188.5,
    unit: 'mm',
    desc: '中指尖至腕横纹距离',
    rank: 'P72',
    percent: 72,
  },
  {
    label: '手宽',
    value: 84.2,
    unit: 'mm',
    desc: '掌骨关节横向宽度',
    rank: 'P64',
    percent: 64,
  },
];

export const optimalParams: OptimalParam[] = [
  { label: '机身宽度', value: '70.6', unit: 'mm' },
  { label: '机身高度', value: '148.2', unit: 'mm' },
  { label: '机身厚度', value: '7.8', unit: 'mm' },
  { label: '整机重量', value: '186', unit: 'g' },
  { label: '背部圆角', value: '11.5', unit: 'mm' },
  { label: '重心高度', value: '51.2', unit: '%' },
  { label: '相机凸起', value: '2.4', unit: 'mm' },
  { label: '屏幕比例', value: '19.5:9', unit: '' },
];

export const reportRows: ReportRow[] = [
  {
    name: '机身宽度',
    value: '71.5 mm',
    score: 9.2,
    weight: 0.162,
    status: 'good',
    advice: '当前宽度接近你的掌宽最佳控制区间，单手握持时拇指可达性较好。',
  },
  {
    name: '整机重量',
    value: '199 g',
    score: 7.4,
    weight: 0.138,
    status: 'warn',
    advice: '长时间握持时掌根压力会升高，建议优先选择重量小于 200g 的机型。',
  },
  {
    name: '机身厚度',
    value: '8.25 mm',
    score: 8.6,
    weight: 0.107,
    status: 'good',
    advice: '厚度落在舒适区，边缘曲率对抓握稳定性有正向帮助。',
  },
  {
    name: '相机凸起',
    value: '3.1 mm',
    score: 6.8,
    weight: 0.096,
    status: 'risk',
    advice: '背部凸起会影响食指支撑点，建议搭配保护壳或降低凸起参数。',
  },
  {
    name: '屏幕高度',
    value: '149.6 mm',
    score: 8.1,
    weight: 0.086,
    status: 'good',
    advice: '高度适中，但顶部触控区域仍建议使用辅助触达。',
  },
];

export const comparisonScores: ComparisonScore[] = [
  { label: '单手握持', ideal: 9.6, iphone: 9.4, galaxy: 7.8 },
  { label: '拇指可达', ideal: 9.2, iphone: 8.9, galaxy: 7.1 },
  { label: '长时舒适', ideal: 8.8, iphone: 8.2, galaxy: 7.4 },
  { label: '背部支撑', ideal: 9.1, iphone: 8.4, galaxy: 7.6 },
  { label: '综合稳定', ideal: 9.3, iphone: 9.0, galaxy: 8.0 },
];
