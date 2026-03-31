# E-Commerce Frontend Client Specification

## Project Overview
- **Project Name**: E-Commerce Microservices Platform
- **Type**: Full-featured e-commerce web application
- **Target Users**: Online shoppers, sellers, and administrators
- **Backend**: 7 microservices (Auth, User, Product, Cart, Order, Admin, Gateway)

---

## Pages & Screens

### Public Pages
1. **Home Page** - Hero banner, featured products, category showcase, promotions
2. **Product Listing Page** - Grid/list view, filters (category, brand, price, rating), sort options, pagination
3. **Product Detail Page** - Product images, variants (size/color), price, inventory status, reviews, add to cart
4. **Category Page** - Category tree navigation, subcategories, featured products
5. **Brand Page** - Brand info, products by brand
6. **Search Results Page** - Search suggestions, filter results, sort options

### Authentication Pages
7. **Login Page** - Email/password login, social login placeholders, forgot password link
8. **Register Page** - Registration form (email, username, password, name, phone), terms acceptance
9. **Forgot Password Page** - Email input for password reset
10. **Reset Password Page** - New password input with confirmation
11. **Email Verification Page** - Success/failure states for email verification

### User Dashboard (Authenticated)
12. **My Account** - Profile overview, quick actions
13. **Profile Settings** - Edit name, phone, avatar, notification preferences
14. **Address Book** - List of addresses, add/edit/delete, set default shipping/billing
15. **Wishlists** - Multiple wishlists, add/remove products, share wishlist
16. **Shopping Cart** - Cart items, quantities, coupon code, order summary
17. **Checkout** - Shipping address selection, payment method (placeholder), order review
18. **Order History** - List of past orders with status, filter by status
19. **Order Detail** - Order items, status timeline, shipping info, cancel/return actions
20. **My Reviews** - List of submitted reviews, edit/delete options
21. **Become a Seller** - Seller request form, status display

### Seller Dashboard
22. **Seller Dashboard** - Sales overview, recent orders, product performance
23. **My Products** - List products, add new product, edit/delete
24. **Product Form** - Name, description, category, brand, price, variants, inventory, images
25. **Inventory Management** - Stock levels, warehouse selection, adjust quantity

### Admin Dashboard
26. **Admin Dashboard** - Stats cards (users, orders, revenue), recent activity, charts
27. **User Management** - User list, search, view details, edit, delete, manage addresses
28. **Product Management** - All products list, toggle active/featured, edit, delete
29. **Order Management** - All orders list, update status, view details, cancel orders
30. **Seller Requests** - Pending requests, approve/reject actions
31. **Settings** - System configuration, public settings management

---

## UI/UX Requirements

### Layout Structure
- **Header**: Logo, search bar, navigation (categories, deals), user menu, cart icon with badge
- **Footer**: Links (about, contact, terms, privacy), social icons, newsletter signup
- **Sidebar**: For dashboard pages - navigation links, user info panel

### Responsive Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### Color Palette (suggested)
- Primary: #2563EB (blue)
- Secondary: #64748B (slate)
- Accent: #F59E0B (amber for promotions)
- Success: #10B981 (green)
- Error: #EF4444 (red)
- Background: #F8FAFC (light gray)
- Surface: #FFFFFF (white)

### Typography
- Headings: Bold, larger sizes for page titles
- Body: Regular weight, readable size (16px)
- UI Elements: Medium weight for buttons, labels

### Components Needed
- Buttons (primary, secondary, outline, text)
- Form inputs (text, email, password, number, select, checkbox, radio)
- Cards (product card, order card, stats card)
- Modal/Dialog (confirmations, forms)
- Tables (admin data display)
- Pagination
- Toast notifications
- Loading states (skeleton, spinner)
- Empty states
- Rating stars
- Badge (status, cart count)
- Accordion (filters, FAQ)
- Tabs (product details, dashboard sections)

---

## Functionality Features

### Authentication Flow
- Login with email/password
- Registration with validation
- JWT token storage (localStorage)
- Auto-refresh token before expiry
- Logout clears session
- Password reset via email

### Shopping Cart
- Add/remove items
- Update quantities
- Apply coupon codes
- Persist cart across sessions
- Calculate totals (subtotal, tax, shipping, discount)

### Product Browsing
- Filter by: category, brand, price range, rating, availability
- Sort by: price, name, popularity, newest
- Pagination (12-24 items per page)
- Quick view modal
- Product zoom on image hover

### Checkout Process
- Step 1: Review cart
- Step 2: Select/create shipping address
- Step 3: Choose shipping method
- Step 4: Payment (placeholder - integration needed)
- Step 5: Order confirmation

### User Features
- Edit profile (name, phone, avatar)
- Manage addresses (CRUD, default setting)
- Create multiple wishlists
- View order history with status
- Request order return
- Submit product reviews

### Seller Features
- Request seller status (needs admin approval)
- CRUD products with variants
- Manage inventory across warehouses
- View own products' performance

### Admin Features
- View dashboard statistics
- CRUD users (except passwords)
- Manage all products (toggle active/featured)
- Update order status
- Approve/reject seller requests
- Manage system settings

---

## API Integration Notes

### Base URL
```
Development: http://localhost:3000/api/v1
```

### Authentication
```javascript
// Headers
Authorization: Bearer <access_token>
```

### Response Format
```json
{
  "success": true,
  "data": { ... }
}
```

### Key Endpoints
| Feature | Endpoint |
|---------|----------|
| Auth | /auth/login, /auth/register, /auth/refresh, /auth/me |
| Products | /products, /products/:id, /categories, /brands |
| Cart | /cart/carts, /cart/carts/items |
| Orders | /orders, /orders/:id |
| User | /users/me, /users/me/addresses, /users/me/wishlists |
| Admin | /admin/dashboard/stats, /admin/users/users, /admin/orders/orders |

### Gateway Headers (for user context)
- x-user-id: User's ID from token

---

## Technical Considerations

### State Management
- Zustand for global client state (auth, cart)
- TanStack Query (React Query) v5 for server state
- Next.js caching mechanisms for static data

### Routing
- Next.js App Router (app/ directory)
- Server Components for data fetching
- Client Components for interactivity
- Next.js Middleware for route protection

### Server Actions
- Use Server Actions for form submissions (mutations)
- Use TanStack Query for client-side mutations
- Validate with Zod in both client and server

### Next.js App Router Patterns
```
app/
├── layout.tsx          # Root layout with providers
├── page.tsx            # Home page (Server Component)
├── loading.tsx         # Loading states
├── error.tsx           # Error boundaries
├── not-found.tsx       # 404 pages
└── [slug]/             # Dynamic routes
    └── page.tsx
```

### Image Optimization
- Use Next.js Image component for automatic optimization
- Configure domains for external images
- Use appropriate sizing and priority for LCP images

### Form Handling
- React Hook Form for form state
- Zod schemas for validation (match backend)

### Image Handling
- Image upload component with preview
- Support multiple product images
- Lazy loading for product grids

### Error Handling
- Display API errors in toast notifications
- Retry failed requests
- Offline detection

---

## Acceptance Criteria

1. ✅ Users can register, login, and manage their profile
2. ✅ Users can browse products, filter, search, and view details
3. ✅ Users can add products to cart and checkout
4. ✅ Users can view order history and request returns
5. ✅ Users can create and manage wishlists
6. ✅ Sellers can manage their products and inventory
7. ✅ Admins can manage users, products, orders, and settings
8. ✅ Responsive design works on mobile, tablet, desktop
9. ✅ Loading states and error handling provide good UX

---

## Mock Data Needed
- Sample products with images, variants, categories, brands
- Sample user accounts (regular, seller, admin)
- Sample orders with various statuses
- Sample reviews and ratings