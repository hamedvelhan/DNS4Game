export type Category = "Shooter" | "Battle Royale" | "MOBA" | "Strategy" | "Sandbox" | "Sports" | "RPG" | "General";
export interface DnsProfile {
  id: string; name: string; game: string; descriptionFa: string; category: Category;
  primary: string | null; secondary: string | null; hue: number;
  diagnostic: { probeDomain: string; timeoutMs: number; samples: number };
}
const diag = { probeDomain: "example.com", timeoutMs: 2000, samples: 10 };
export const CATALOG: DnsProfile[] = [
  { id: "cod", name: "کالاف دیوتی موبایل", game: "Call of Duty: Mobile", descriptionFa: "مناسب برای آزمایش پاسخ DNS دامنه‌های ورود و احراز هویت کالاف؛ ثبت تیر به مسیر سرور مسابقه وابسته است و با DNS تضمین نمی‌شود.", category: "Shooter", hue: 28, primary: null, secondary: null, diagnostic: diag },
  { id: "pubg", name: "پابجی موبایل", game: "PUBG Mobile", descriptionFa: "برای بررسی دسترسی DNS به دامنه‌های ورود و سرویس‌های پابجی؛ کیفیت مسیر مسابقه جداگانه تعیین می‌شود.", category: "Battle Royale", hue: 45, primary: null, secondary: null, diagnostic: diag },
  { id: "ff", name: "فری فایر", game: "Free Fire", descriptionFa: "تمرکز بر پاسخ‌گویی DNS سرویس‌های ورود فری فایر؛ این تنظیم به‌تنهایی رجیستر تیر را تغییر نمی‌دهد.", category: "Battle Royale", hue: 12, primary: null, secondary: null, diagnostic: diag },
  { id: "fn", name: "فورتنایت", game: "Fortnite", descriptionFa: "برای آزمایش پاسخ DNS دامنه‌های فورتنایت و دسترسی به سرویس‌های بازی؛ مسیر ترافیک مسابقه مستقل است.", category: "Battle Royale", hue: 265, primary: null, secondary: null, diagnostic: diag },
  { id: "bs", name: "براول استارز", game: "Brawl Stars", descriptionFa: "بررسی پاسخ DNS دامنه‌های براول استارز و کاهش خطاهای احتمالی در مرحله ورود.", category: "Shooter", hue: 50, primary: null, secondary: null, diagnostic: diag },
  { id: "coc", name: "کلش آف کلنز", game: "Clash of Clans", descriptionFa: "پروفایل DNS برای دامنه‌های ورود و سرویس‌های کلش؛ کیفیت اتصال درون بازی به مسیر شبکه وابسته است.", category: "Strategy", hue: 120, primary: null, secondary: null, diagnostic: diag },
  { id: "cr", name: "کلش رویال", game: "Clash Royale", descriptionFa: "آزمایش پاسخ‌گویی DNS سرویس‌های کلش رویال و دسترسی به دامنه‌های موردنیاز بازی.", category: "Strategy", hue: 215, primary: null, secondary: null, diagnostic: diag },
  { id: "ml", name: "موبایل لجندز", game: "Mobile Legends", descriptionFa: "بررسی پاسخ DNS دامنه‌های موبایل لجندز و دسترسی به سرویس‌های ورود و حساب کاربری.", category: "MOBA", hue: 190, primary: null, secondary: null, diagnostic: diag },
  { id: "gi", name: "گنشین ایمپکت", game: "Genshin Impact", descriptionFa: "تمرکز بر پاسخ DNS دامنه‌های ورود گنشین ایمپکت؛ پینگ سرورهای بازی جداگانه سنجیده می‌شود.", category: "RPG", hue: 170, primary: null, secondary: null, diagnostic: diag },
  { id: "mc", name: "ماینکرفت", game: "Minecraft", descriptionFa: "بررسی پاسخ DNS دامنه‌های سرویس ماینکرفت و دسترسی به خدمات آنلاین.", category: "Sandbox", hue: 140, primary: null, secondary: null, diagnostic: diag },
  { id: "rb", name: "روبلاکس", game: "Roblox", descriptionFa: "آزمایش پاسخ DNS دامنه‌های روبلاکس و سرویس‌های ورود و دریافت اطلاعات بازی.", category: "Sandbox", hue: 0, primary: null, secondary: null, diagnostic: diag },
  { id: "ef", name: "ای‌فوتبال", game: "eFootball", descriptionFa: "بررسی پاسخ DNS سرویس‌های آنلاین ای‌فوتبال؛ تأخیر مسابقه به سرور مقصد و مسیر شبکه وابسته است.", category: "Sports", hue: 205, primary: null, secondary: null, diagnostic: diag },
  { id: "val", name: "ولورانت", game: "Valorant", descriptionFa: "آزمایش پاسخ DNS دامنه‌های ولورانت و سرویس‌های ورود؛ مسیر بازی از DNS جداست.", category: "Shooter", hue: 350, primary: null, secondary: null, diagnostic: diag },
  { id: "apx", name: "اپکس لجندز", game: "Apex Legends", descriptionFa: "بررسی پاسخ DNS دامنه‌های اپکس لجندز و دسترسی به سرویس‌های آنلاین.", category: "Battle Royale", hue: 8, primary: null, secondary: null, diagnostic: diag },
  { id: "gen", name: "بازی‌های عمومی", game: "General Gaming", descriptionFa: "پروفایل عمومی برای بررسی پاسخ DNS دامنه‌های بازی؛ نتیجه به شبکه و سرویس مقصد وابسته است.", category: "General", hue: 230, primary: null, secondary: null, diagnostic: diag },
];
const IPV4 = /^(25[0-5]|2[0-4]d|1?d?d)(.(25[0-5]|2[0-4]d|1?d?d)){3}$/;
export const isValidIpv4 = (s: string | null): s is string => !!s && IPV4.test(s);
export const isConfigured = (p: DnsProfile) => isValidIpv4(p.primary);
