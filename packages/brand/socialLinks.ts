/** URLs oficiales Hercom (web + app). */

export const HERCOM_SOCIAL = {
  facebook: "https://www.facebook.com/profile.php?id=61571135840620",
  instagram: "https://www.instagram.com/hercomperu/reels/",
  tiktok: "https://www.tiktok.com/@hercomchoferes",
} as const;

export type HercomSocialKey = keyof typeof HERCOM_SOCIAL;

export const HERCOM_SOCIAL_ITEMS: ReadonlyArray<{
  key: HercomSocialKey;
  label: string;
  url: string;
}> = [
  { key: "facebook", label: "Facebook", url: HERCOM_SOCIAL.facebook },
  { key: "instagram", label: "Instagram", url: HERCOM_SOCIAL.instagram },
  { key: "tiktok", label: "TikTok", url: HERCOM_SOCIAL.tiktok },
];