# SSH Connection Statistics Dashboard 🔐

A modern, real-time web dashboard for monitoring and analyzing SSH connection attempts with beautiful visualizations and comprehensive security features.

![SSH Dashboard](https://img.shields.io/badge/SSH-Statistics-blue) ![Node.js](https://img.shields.io/badge/Node.js-18%2B-green) ![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Features

- **📊 Real-time SSH Statistics**: Monitor successful and failed SSH connections by IP address
- **🔐 Secure Authentication**: Role-based access control with session management
- **🎨 Modern UI**: Responsive design with beautiful charts and visualizations
- **📱 Mobile-Friendly**: Fully responsive design that works on all devices
- **🔍 Advanced Filtering**: Search and filter connections by IP or username
- **👥 User Management**: Admin panel for user management (admin role only)
- **🔒 Security**: Password hashing, session timeout, and secure cookies
- **💾 Self-contained Database**: No external database required (file-based JSON storage)

## 🚀 Quick Start

### Prerequisites
- Node.js 18 or higher
- SSH logs access (typically `/var/log/auth.log` or `/var/log/secure`)

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd ssh-statistics-dashboard
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure the application**
```bash
# The application will automatically create necessary files
# Default configuration should work for most setups
```

4. **Start the server**
```bash
npm start
```

5. **Access the dashboard**
```
Open your browser and navigate to: http://localhost:80
Default login: admin / admin
```

## 📁 Project Structure

```
ssh-statistics-dashboard/
├── lib/
│   ├── database.js          # NoSQL database management
│   ├── auth.js             # Authentication services
│   └── geSshLogsSummary.js # SSH log parsing utilities
├── views/
│   ├── layouts/
│   │   └── main.hbs        # Main layout template
│   ├── partials/
│   │   └── navigation.hbs  # Navigation component
│   ├── summary.hbs         # Dashboard main page
│   ├── login.hbs          # Login page
│   └── users.hbs          # User management page
├── public/
│   └── style.css          # Custom styles
├── data/
│   └── db.json           # Application database (auto-created)
└── server.js            # Main application file
```

## 🔧 Configuration

### SSH Log File Path
Update the log file path in `lib/geSshLogsSummary.js`:
```javascript
// Default paths (automatically tries both)
const logPaths = [
    '/var/log/auth.log',    // Debian/Ubuntu
    '/var/log/secure'      // CentOS/RHEL
];
```

### Server Configuration
Modify `server.js` for custom settings:
```javascript
const port = 80; // Change to your preferred port
```

## 👤 User Management

### Default Users
- **Admin**: `admin` / `admin` (change this immediately after first login!)

### User Roles
- **admin**: Full access to all features including user management
- **user**: Read-only access to SSH statistics

### Changing Passwords
1. Click "Change Password" in the navigation bar
2. Enter current password and new password
3. The new password will be displayed for you to save securely

## 🛡️ Security Features

- **Password Hashing**: bcrypt with salt rounds
- **Session Management**: 24-hour session timeout
- **Secure Cookies**: HTTP-only, secure cookies
- **Role-based Access**: Different permissions for admin/user roles
- **Input Validation**: Client and server-side validation
- **XSS Protection**: Handlebars auto-escaping

## 📊 Dashboard Features

### Main Statistics
- Connection attempts by IP address
- Successful vs failed login ratios
- Username frequency analysis
- Real-time data updates

### Data Filtering
- Search by IP address
- Filter by username
- Sortable columns
- Responsive data tables

### Visualizations
- Color-coded success/failure indicators
- Badge-based username display
- Interactive charts and graphs
- Mobile-optimized tables

## 🔄 API Endpoints

| Endpoint | Method | Description | Authentication |
|----------|--------|-------------|----------------|
| `/` | GET | Main dashboard | Required |
| `/login` | GET/POST | Login page | Public |
| `/logout` | GET | Logout user | Required |
| `/admin/users` | GET | User management | Admin only |
| `/api/change-password` | POST | Change password | Required |
| `/health` | GET | System health check | Public |

## 🐛 Troubleshooting

### Common Issues

1. **Cannot read SSH logs**
   - Ensure the application has read permissions on log files
   - Check log file path in configuration

2. **Port already in use**
   - Change the port in `server.js`
   - Ensure no other service is using port 80

3. **Login issues**
   - Verify default credentials: `admin` / `admin`
   - Check database file permissions in `data/db.json`

### Logs Location
- Application logs: Console output
- User sessions: `data/db.json`
- SSH source: System auth logs

## 📈 Performance

- Lightweight and fast
- Efficient log parsing
- Minimal memory footprint
- Optimized for real-time monitoring

## 🤝 Contributing

1. Fork the project
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- SSH log parsing inspiration from various open-source tools
- UI components using Bootstrap and Font Awesome
- Icons by Font Awesome
- Charts and visualizations using modern CSS

---

# داشبورد آمار اتصال‌های SSH 🔐

یک داشبورد تحت وب مدرن و بلادرنگ برای مانیتورینگ و آنالیز تلاش‌های اتصال SSH با ویژوال‌سازی‌های زیبا و قابلیت‌های امنیتی جامع.

## ✨ قابلیت‌ها

- **📊 آمار بلادرنگ SSH**: مانیتورینگ اتصال‌های موفق و ناموفق SSH بر اساس آدرس IP
- **🔐 احراز هویت امن**: کنترل دسترسی مبتنی بر نقش با مدیریت session
- **🎨 رابط کاربری مدرن**: طراحی واکنش‌گرا با چارت‌ها و ویژوال‌سازی‌های زیبا
- **📱 سازگار با موبایل**: طراحی کاملاً واکنش‌گرا برای تمام دستگاه‌ها
- **🔍 فیلترینگ پیشرفته**: جستجو و فیلتر اتصال‌ها بر اساس IP یا نام کاربری
- **👥 مدیریت کاربران**: پنل مدیریت کاربران (فقط برای ادمین)
- **🔒 امنیت**: هش کردن رمز عبور، timeout session و cookieهای امن
- **💾 دیتابیس self-contained**: بدون نیاز به دیتابیس خارجی (ذخیره‌سازی مبتنی بر فایل JSON)

## 🚀 راه‌اندازی سریع

### پیش‌نیازها
- Node.js 18 یا بالاتر
- دسترسی به لاگ‌های SSH (معمولاً `/var/log/auth.log` یا `/var/log/secure`)

### نصب

1. **کلون کردن ریپازیتوری**
```bash
git clone <your-repo-url>
cd ssh-statistics-dashboard
```

2. **نصب وابستگی‌ها**
```bash
npm install
```

3. **پیکربندی برنامه**
```bash
# برنامه به طور خودکار فایل‌های لازم را ایجاد می‌کند
# پیکربندی پیش‌فرض برای اکثر تنظیمات کار می‌کند
```

4. **راه‌اندازی سرور**
```bash
npm start
```

5. **دسترسی به داشبورد**
```
مرورگر خود را باز کرده و به آدرس زیر بروید: http://localhost:80
ورود پیش‌فرض: admin / admin
```

## 📁 ساختار پروژه

```
ssh-statistics-dashboard/
├── lib/
│   ├── database.js          # مدیریت دیتابیس NoSQL
│   ├── auth.js             # سرویس‌های احراز هویت
│   └── geSshLogsSummary.js # ابزارهای تجزیه لاگ SSH
├── views/
│   ├── layouts/
│   │   └── main.hbs        # قالب اصلی
│   ├── partials/
│   │   └── navigation.hbs  # کامپوننت نوار ناوبری
│   ├── summary.hbs         # صفحه اصلی داشبورد
│   ├── login.hbs          # صفحه ورود
│   └── users.hbs          # صفحه مدیریت کاربران
├── public/
│   └── style.css          # استایل‌های سفارشی
├── data/
│   └── db.json           # دیتابیس برنامه (به طور خودکار ایجاد می‌شود)
└── server.js            # فایل اصلی برنامه
```

## 🔧 پیکربندی

### مسیر فایل لاگ SSH
مسیر فایل لاگ را در `lib/geSshLogsSummary.js` به روز کنید:
```javascript
// مسیرهای پیش‌فرض (به طور خودکار هر دو را امتحان می‌کند)
const logPaths = [
    '/var/log/auth.log',    // دبیان/اوبونتو
    '/var/log/secure'      // سنت‌اواس/RHEL
];
```

### پیکربندی سرور
`server.js` را برای تنظیمات سفارشی تغییر دهید:
```javascript
const port = 80; // به پورت مورد نظر خود تغییر دهید
```

## 👤 مدیریت کاربران

### کاربران پیش‌فرض
- **ادمین**: `admin` / `admin` (بلافاصله پس از اولین ورود این را تغییر دهید!)

### نقش‌های کاربری
- **admin**: دسترسی کامل به تمام قابلیت‌ها از جمله مدیریت کاربران
- **user**: دسترسی فقط خواندنی به آمار SSH

### تغییر رمز عبور
1. روی "Change Password" در نوار ناوبری کلیک کنید
2. رمز عبور فعلی و جدید را وارد کنید
3. رمز عبور جدید برای ذخیره امن به شما نمایش داده می‌شود

## 🛡️ ویژگی‌های امنیتی

- **هش کردن رمز عبور**: bcrypt با salt rounds
- **مدیریت session**: timeout session 24 ساعته
- **Cookieهای امن**: HTTP-only, secure cookies
- **کنترل دسترسی مبتنی بر نقش**: سطوح دسترسی مختلف برای نقش‌های admin/user
- **اعتبارسنجی ورودی**: اعتبارسنجی در سمت کلاینت و سرور
- **محافظت در برابر XSS**: auto-escaping در Handlebars

## 📊 ویژگی‌های داشبورد

### آمار اصلی
- تلاش‌های اتصال بر اساس آدرس IP
- نسبت ورودهای موفق به ناموفق
- آنالیز فرکانس نام‌های کاربری
- به روزرسانی بلادرنگ داده‌ها

### فیلترینگ داده‌ها
- جستجو بر اساس آدرس IP
- فیلتر بر اساس نام کاربری
- ستون‌های قابل مرتب‌سازی
- جداول داده واکنش‌گرا

### ویژوال‌سازی‌ها
- نشانگرهای موفقیت/شکست با کد رنگی
- نمایش نام‌های کاربری با badge
- چارت‌ها و گراف‌های تعاملی
- جدول‌های بهینه‌شده برای موبایل

## 🔄 endpointهای API

| endpoint | Method | Description | احراز هویت |
|----------|--------|-------------|----------------|
| `/` | GET | داشبورد اصلی | الزامی |
| `/login` | GET/POST | صفحه ورود | عمومی |
| `/logout` | GET | خروج کاربر | الزامی |
| `/admin/users` | GET | مدیریت کاربران | فقط ادمین |
| `/api/change-password` | POST | تغییر رمز عبور | الزامی |
| `/health` | GET | بررسی سلامت سیستم | عمومی |

## 🐛 عیب‌یابی

### مشکلات متداول

1. **عدم توانایی خواندن لاگ‌های SSH**
   - مطمئن شوید برنامه دسترسی خواندن روی فایل‌های لاگ دارد
   - مسیر فایل لاگ را در پیکربندی بررسی کنید

2. **پورت در حال استفاده است**
   - پورت را در `server.js` تغییر دهید
   - مطمئن شوید هیچ سرویس دیگری از پورت 80 استفاده نمی‌کند

3. **مشکلات ورود**
   - اعتبارنامه پیش‌فرض را تأیید کنید: `admin` / `admin`
   - مجوزهای فایل دیتابیس در `data/db.json` را بررسی کنید

### محل لاگ‌ها
- لاگ‌های برنامه: خروجی کنسول
- sessionهای کاربر: `data/db.json`
- منبع SSH: لاگ‌های auth سیستم

## 📈 عملکرد

- سبک‌وزن و سریع
- تجزیه کارآمد لاگ‌ها
- ردپای حافظه کم
- بهینه‌شده برای مانیتورینگ بلادرنگ

## 🤝 مشارکت

1. پروژه را fork کنید
2. یک شاخه feature ایجاد کنید (`git checkout -b feature/AmazingFeature`)
3. تغییرات خود را commit کنید (`git commit -m 'Add some AmazingFeature'`)
4. به شاخه push کنید (`git push origin feature/AmazingFeature`)
5. یک Pull Request باز کنید

## 📄 مجوز

این پروژه تحت مجوز MIT منتشر شده است - برای جزئیات به فایل [LICENSE](LICENSE) مراجعه کنید.

## 🙏 تشکرها

- الهام‌گیری از تجزیه لاگ SSH از ابزارهای متن‌باز مختلف
- کامپوننت‌های رابط کاربری با استفاده از Bootstrap و Font Awesome
- آیکون‌ها توسط Font Awesome
- چارت‌ها و ویژوال‌سازی‌ها با استفاده از CSS مدرن