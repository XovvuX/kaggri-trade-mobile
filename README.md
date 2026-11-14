# vovu 🌾

Nông sản sỉ từ nhà cung cấp đã xác minh — Mobile App (Expo + Expo Router)

## Cấu trúc

```
vovu/
├── app/                          # Routes (Expo Router)
│   ├── _layout.tsx              # Root layout
│   ├── index.tsx                # Landing (chọn Buyer / Vendor)
│   ├── auth/
│   │   ├── login.tsx            # Đăng nhập
│   │   └── register.tsx         # Đăng ký
│   ├── (buyer)/                 # 👤 Buyer flow (Bottom Tab)
│   │   ├── _layout.tsx
│   │   ├── index.tsx            # Marketplace
│   │   ├── orders.tsx           # Đơn hàng
│   │   └── profile.tsx          # Tài khoản
│   ├── buyer/
│   │   ├── product/[id].tsx     # Chi tiết sản phẩm
│   │   ├── cart.tsx             # Giỏ hàng
│   │   ├── checkout.tsx         # Xác nhận đơn
│   │   ├── payment.tsx          # Chọn thanh toán
│   │   └── order-success.tsx    # Đặt hàng thành công
│   └── (vendor)/                # 🌾 Vendor flow (Bottom Tab)
│       ├── _layout.tsx
│       ├── index.tsx            # Dashboard
│       ├── orders.tsx           # Quản lý đơn
│       ├── products.tsx         # Quản lý sản phẩm
│       └── profile.tsx          # Tài khoản
└── src/
    ├── components/              # Shared UI (Button, Card, Chip, ...)
    ├── data/                    # Mock data
    ├── services/                # Service Layer (API interfaces)
    ├── stores/                  # Zustand stores
    ├── theme/                   # Design tokens
    ├── types/                   # TypeScript types
    └── utils/                   # Helpers
```

## Stack

- **Expo SDK 57** + **Expo Router** (file-based routing)
- **React 19** + **TypeScript**
- **Zustand** (state management)
- **React Native 0.86**

## Tính năng

### Buyer
- 🛒 Marketplace: xem sản phẩm theo grid, lọc theo NCC đã xác minh
- 📦 Chi tiết sản phẩm: bảng giá sỉ theo số lượng, MOQ, gallery ảnh
- 🛍️ Giỏ hàng: nhóm theo NCC, điều chỉnh số lượng
- 📋 Checkout: chọn Standard / Preorder, địa chỉ, hóa đơn VAT
- 💳 Payment: VietQR, VA, NAPAS, COD, Credit NET15
- ✓ Theo dõi đơn hàng

### Vendor
- 📊 Dashboard: thống kê tổng quan
- 📦 Quản lý đơn hàng: Accept/Reject, lọc theo trạng thái
- 🥬 Quản lý sản phẩm: tồn kho, giá sỉ theo bậc
- 🏆 Hồ sơ: chứng nhận, đánh giá

## Chạy thử

```bash
cd vovu
npm install
npx expo start
```

Sau đó:
- Mở Expo Go trên điện thoại và quét QR
- Hoặc bấm `w` để chạy trên web
- Hoặc `a` / `i` cho Android / iOS

**Demo login**: nhập bất kỳ email/password nào cũng được.

## Theme

- Primary: `#0d623b` (Agritech Green)
- Style: icon lớn, rõ ràng, thân thiện với người nông dân
- Component convention: xem `src/components/`
