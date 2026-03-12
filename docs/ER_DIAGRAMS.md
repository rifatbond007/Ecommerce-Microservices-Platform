# Entity Relationship Diagrams

This document contains the visual ER diagrams for the e-commerce platform's microservices, derived from the `DATABASE_SCHEMA.md`.

## System Overview (Cross-Service)
This diagram shows how high-level entities reference each other across service boundaries via UUIDs.

```mermaid
erDiagram
    %% --- AUTH SERVICE ---
    USERS {
        uuid id PK
        string email
        string username
    }
    USERS ||--o{ ORDERS : "places (Order Service)"
    USERS ||--|| PROFILES : "has (User Service)"
    USERS ||--o{ PAYMENTS : "settles (Payment Service)"

    %% --- PRODUCT SERVICE ---
    PRODUCTS {
        uuid id PK
        string sku
    }
    PRODUCTS ||--o{ ORDER_ITEMS : "referenced_by (Order Service)"
    PRODUCTS ||--o{ WISHLIST_ITEMS : "referenced_by (User Service)"
    PRODUCTS ||--o{ REVIEWS : "referenced_by (User Service)"

    %% --- ORDER SERVICE ---
    ORDERS {
        uuid id PK
        string order_number
    }
    ORDERS ||--o{ PAYMENTS : "settled_by (Payment Service)"
    ORDERS ||--|| INVOICES : "generates (Payment Service)"
```

---

## 1. API Gateway
Focuses on routing, rate limiting, and security.

```mermaid
erDiagram
    RATE_LIMITS {
        serial id PK
        string identifier
        string endpoint
        integer request_count
    }
    API_KEYS {
        serial id PK
        string key_hash
        string service_name
        jsonb permissions
    }
    ROUTE_CONFIGS {
        serial id PK
        string path
        string method
        string target_service
    }
```

---

## 2. Auth Service
Handles identity and access control.

```mermaid
erDiagram
    USERS {
        uuid id PK
        string email UK
        string username UK
        string password_hash
    }
    ROLES {
        serial id PK
        string name UK
        jsonb permissions
    }
    USER_ROLES {
        serial id PK
        uuid user_id FK
        integer role_id FK
    }
    SESSIONS {
        uuid id PK
        uuid user_id FK
        string token_hash UK
    }
    USERS ||--o{ USER_ROLES : "has"
    ROLES ||--o{ USER_ROLES : "assigned_to"
    USERS ||--o{ SESSIONS : "starts"
```

---

## 3. User Service
Manages profiles, addresses, and social features.

```mermaid
erDiagram
    PROFILES {
        uuid id PK
        uuid user_id FK
        string language
        string currency
    }
    ADDRESSES {
        uuid id PK
        uuid user_id FK
        string type
        boolean is_default
    }
    WISHLISTS {
        uuid id PK
        uuid user_id FK
    }
    WISHLIST_ITEMS {
        uuid id PK
        uuid wishlist_id FK
        uuid product_id FK
    }
    REVIEWS {
        uuid id PK
        uuid user_id FK
        uuid product_id FK
        integer rating
    }
    USERS ||--|| PROFILES : "has"
    USERS ||--o{ ADDRESSES : "manages"
    WISHLISTS ||--o{ WISHLIST_ITEMS : "contains"
```

---

## 4. Product Service
The core catalog and inventory management system.

```mermaid
erDiagram
    CATEGORIES {
        uuid id PK
        uuid parent_id FK
        string name
    }
    PRODUCTS {
        uuid id PK
        uuid category_id FK
        string sku UK
        decimal base_price
    }
    PRODUCT_VARIANTS {
        uuid id PK
        uuid product_id FK
        string sku UK
        decimal price
    }
    PRODUCT_OPTIONS {
        uuid id PK
        uuid product_id FK
        string name
    }
    PRODUCT_OPTION_VALUES {
        uuid id PK
        uuid option_id FK
        string value
    }
    INVENTORIES {
        uuid id PK
        uuid product_id FK
        uuid warehouse_id FK
        integer quantity
    }
    WAREHOUSES {
        uuid id PK
        string code UK
    }
    CATEGORIES ||--o{ CATEGORIES : "sub-categories"
    CATEGORIES ||--o{ PRODUCTS : "categorizes"
    PRODUCTS ||--o{ PRODUCT_VARIANTS : "has"
    PRODUCTS ||--o{ PRODUCT_OPTIONS : "configures"
    PRODUCT_OPTIONS ||--o{ PRODUCT_OPTION_VALUES : "lists"
    WAREHOUSES ||--o{ INVENTORIES : "stocks"
```

---

## 5. Cart Service
Transient shopping state.

```mermaid
erDiagram
    CARTS {
        uuid id PK
        uuid session_id
        uuid user_id FK
        decimal total
    }
    CART_ITEMS {
        uuid id PK
        uuid cart_id FK
        uuid product_id FK
        integer quantity
    }
    CARTS ||--o{ CART_ITEMS : "contains"
```

---

## 6. Order Service
Fulfillment lifecycle management.

```mermaid
erDiagram
    ORDERS {
        uuid id PK
        string order_number UK
        uuid user_id FK
        string status
    }
    ORDER_ITEMS {
        uuid id PK
        uuid order_id FK
        uuid product_id FK
        integer quantity
    }
    SHIPMENTS {
        uuid id PK
        uuid order_id FK
        string tracking_number
    }
    ORDERS ||--o{ ORDER_ITEMS : "contains"
    ORDERS ||--o{ SHIPMENTS : "fulfilled_by"
```

---

## 7. Payment Service
Financial transactions and invoicing.

```mermaid
erDiagram
    PAYMENTS {
        uuid id PK
        uuid order_id FK
        uuid user_id FK
        decimal amount
        string status
    }
    INVOICES {
        uuid id PK
        string invoice_number UK
        uuid order_id FK
        decimal total
    }
    ORDERS ||--o{ PAYMENTS : "settled_by"
    ORDERS ||--|| INVOICES : "generates"
```

---

## 8. Notification Service
Messaging and template management.

```mermaid
erDiagram
    NOTIFICATION_TEMPLATES {
        uuid id PK
        string name UK
        string type
    }
    NOTIFICATIONS {
        uuid id PK
        uuid user_id FK
        string status
    }
    EMAIL_QUEUE {
        uuid id PK
        string to_email
        string status
    }
    NOTIFICATION_TEMPLATES ||--o{ EMAIL_QUEUE : "formats"
```

---

## 9. Search & Admin Services
Analytics and system management.

```mermaid
erDiagram
    SEARCH_LOGS {
        uuid id PK
        string query
        integer results_count
    }
    ADMIN_USERS {
        uuid id PK
        uuid user_id FK
        string role
    }
    AUDIT_LOGS {
        uuid id PK
        uuid user_id FK
        string action
    }
    ADMIN_USERS ||--o{ AUDIT_LOGS : "performed_by"
```
