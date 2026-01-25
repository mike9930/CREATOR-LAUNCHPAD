import Settings from './models/Settings';

export async function getSetting(key, defaultValue = null) {
  const setting = await Settings.findOne({ key });
  if (setting) return setting.value;
  
  // Return from defaults if available
  const defaults = Settings.getDefaults();
  return defaults[key] ?? defaultValue;
}

export async function setSetting(key, value, userId = null) {
  const result = await Settings.findOneAndUpdate(
    { key },
    { $set: { value, updatedBy: userId, updatedAt: new Date() } },
    { upsert: true, new: true }
  );
  return result;
}

export function formatCurrency(amountInKobo, currency = 'NGN') {
  const amount = amountInKobo / 100;
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

export function parseYouTubeUrl(url) {
  if (!url) return null;
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}

export function getYouTubeEmbedUrl(videoId) {
  return `https://www.youtube.com/embed/${videoId}`;
}

export function getYouTubeThumbnail(videoId, quality = 'maxresdefault') {
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
}

export const AFRICAN_COUNTRIES = [
  'Nigeria', 'South Africa', 'Kenya', 'Ghana', 'Egypt', 'Morocco', 'Ethiopia',
  'Tanzania', 'Uganda', 'Algeria', 'Sudan', 'Cameroon', 'Ivory Coast', 'Senegal',
  'Zimbabwe', 'Zambia', 'Rwanda', 'Tunisia', 'Angola', 'Mozambique', 'Madagascar',
  'Mali', 'Burkina Faso', 'Niger', 'Malawi', 'Chad', 'Guinea', 'Benin', 'Burundi',
  'Togo', 'Sierra Leone', 'Libya', 'Congo', 'DR Congo', 'Liberia', 'Mauritania',
  'Eritrea', 'Namibia', 'Gambia', 'Botswana', 'Gabon', 'Lesotho', 'Guinea-Bissau',
  'Equatorial Guinea', 'Mauritius', 'Eswatini', 'Djibouti', 'Comoros', 'Cape Verde',
  'Sao Tome and Principe', 'Seychelles',
];

export const CATEGORIES = [
  { value: 'SINGING', label: 'Singing' },
  { value: 'DANCING', label: 'Dancing' },
  { value: 'COMEDY', label: 'Comedy' },
  { value: 'SPOKEN_WORD', label: 'Spoken Word' },
  { value: 'RAP', label: 'Rap/Hip-Hop' },
  { value: 'INSTRUMENTAL', label: 'Instrumental' },
  { value: 'OTHER', label: 'Other Talent' },
];
