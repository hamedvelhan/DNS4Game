# قرارداد JavaScript Bridge برای Android

رابط وب در صورت اجرا داخل WebView اندروید، شیء زیر را از Native انتظار دارد:

```ts
window.DNSGameArtNative = {
  getNetworkInfo(): Promise<{
    online: boolean;
    type: "Wi-Fi" | "Mobile data" | "Ethernet" | "Unknown" | "Offline";
    detail?: string;
    carrier?: string;
    ipv4?: "Available" | "Unknown";
  }>;

  authenticate(input: {
    mode: "register" | "login";
    displayName: string;
    phone: string;
    password: string;
  }): Promise<{
    success: boolean;
    accountId?: string;
    displayName?: string;
    phone?: string;
    message?: string;
  }>;

  purchaseMyket(productId: string): Promise<{
    status: "purchased" | "cancelled" | "failed";
    productId: string;
    purchaseToken?: string;
    orderId?: string;
    message?: string;
  }>;

  verifyMyketPurchase(
    productId: string,
    purchaseToken: string,
    orderId?: string
  ): Promise<{
    valid: boolean;
    productId: string;
    orderId?: string;
    expiresAt?: number; // Unix epoch milliseconds
    message?: string;
  }>;

  restoreMyketPurchases(): Promise<Array<{
    status: "purchased" | "cancelled" | "failed";
    productId: string;
    purchaseToken?: string;
    orderId?: string;
  }>>;
};
```

## قواعد امنیتی و خرید اشتراک

1. `authenticate` باید به سرویس احراز هویت واقعی متصل باشد. رمز عبور را در `localStorage` یا تنظیمات WebView ذخیره نکنید.
2. `purchaseMyket` باید فرایند خرید مایکت را با شناسهٔ محصول ثبت‌شده در پنل توسعه‌دهنده اجرا کند و توکن/شناسهٔ سفارش را برگرداند.
3. `verifyMyketPurchase` باید توکن خرید را به بک‌اند امن ارسال کند. بک‌اند باید با API مورداعتماد فروشگاه آن را اعتبارسنجی کند، وضعیت اشتراک و زمان انقضا را از منبع معتبر به دست آورد و سپس نتیجه را به WebView بازگرداند.
4. `restoreMyketPurchases` باید خریدهای موجود کاربر را از مایکت بازیابی کند؛ هر خرید نیز باید دوباره با `verifyMyketPurchase` بررسی شود.
5. از مقدار `expiresAt` برگشتی از تأیید معتبر استفاده کنید؛ تاریخ انقضا را صرفاً با ساعت دستگاه یا پاسخ کلاینت محاسبه نکنید.
6. تبلیغات جایزه‌ای اتصال و تمدید در `src/ads/adManager.ts` از طریق `registerRewardedAdProvider` متصل می‌شوند و callback پاداش باید واقعی باشد. قطع اتصال از تبلیغ بین‌صفحه‌ای مستقل (`registerInterstitialAdProvider`) استفاده می‌کند و به پاداش نیاز ندارد. قطع اتصال نباید در صورت خطا یا نبود تبلیغ مسدود شود.
7. در متد `getNetworkInfo` نوع اتصال و اپراتور فقط از APIهای مجاز سیستم‌عامل خوانده شوند؛ در صورت نبود مجوز یا داده، مقدار `Unknown` برگردانید و حدس نزنید.

## وضعیت این فایل

این سند قرارداد اتصال است، نه پیاده‌سازی نهایی Kotlin. سورس Android، شناسهٔ برنامهٔ مایکت، شناسهٔ محصول واقعی، کلیدهای SDK تبلیغات و آدرس بک‌اند در فایل ZIP فعلی وجود نداشتند؛ بنابراین خرید و احراز هویت واقعی را نمی‌توان از داخل پیش‌نمایش React به‌تنهایی فعال کرد.
