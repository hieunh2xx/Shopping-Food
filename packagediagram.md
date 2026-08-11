# UniEats — Package Diagrams

Chỉ mô tả **code production** (không gồm Tests / e2e).

---

## 1. Toàn hệ thống

Luồng: **User → Frontend → API → Business → Data → Database**

```mermaid
flowchart LR
    User([User Browser])

    subgraph FE [Frontend - React Vite]
        direction TB
        UI[Pages Components]
        API_Client[Services Axios JWT]
    end

    subgraph BE [Backend - NET 8]
        direction TB
        API[API Layer]
        APP[Application Layer]
        REPO[Repository Layer]
    end

    DB[(SQL Server)]
    EXT[SePay SMTP SignalR]

    User --> UI
    UI --> API_Client
    API_Client -->|REST JWT| API
    API --> APP
    APP --> REPO
    REPO --> DB
    API --> EXT
```

---

## 2. Backend

Luồng phụ thuộc: **Controllers → Handlers → Repositories → Domain**

```mermaid
flowchart TB
    subgraph API [ShoppingFood.API]
        direction LR
        C1[Controllers]
        C2[Auth SignalR DI]
    end

    subgraph APP [ShoppingFood.Application]
        direction TB
        F1[Features CQRS]
        F2[Validators]
        F3[App Services]
    end

    subgraph REPO [ShoppingFood.Repository]
        direction LR
        R1[Repositories]
        R2[UnitOfWork]
    end

    subgraph DOMAIN [ShoppingFood.Domain]
        direction LR
        D1[Models Enums]
        D2[DbContext]
    end

    subgraph SHARED [Shared Libraries]
        direction LR
        S1[ShoppingFood.Dto]
        S2[ShoppingFood.Core]
    end

    C1 -->|MediatR| F1
    C2 --> R1
    F1 --> R1
    F1 --> S1
    F1 --> S2
    F1 --> F2
    F1 --> F3
    R1 --> R2
    R1 --> D1
    R1 --> D2
    D1 --> S2
    S1 --> S2
```

### Modules trong Application

| Nhóm | Features |
|------|----------|
| Người dùng | Users, UserAddresses |
| Mua hàng | Carts, Orders, Payments |
| Catalog | Products, Restaurants, Discounts, FlashSales, Promotions |
| Vận hành | Shippers, Coordinator, Chat, Support |
| Quản trị | Admin, System, Faqs, Notifications, LoyaltyPoints |

### Project references

```
ShoppingFood.API
  └── ShoppingFood.Application
  └── ShoppingFood.Repository

ShoppingFood.Application
  └── ShoppingFood.Repository
  └── ShoppingFood.Domain
  └── ShoppingFood.Dto
  └── ShoppingFood.Core

ShoppingFood.Repository
  └── ShoppingFood.Domain
  └── ShoppingFood.Dto
  └── ShoppingFood.Core

ShoppingFood.Domain / Dto
  └── ShoppingFood.Core
```

---

## 3. Frontend

Luồng: **Pages → Hooks Contexts → Services → API**

```mermaid
flowchart TB
    subgraph UI [Presentation]
        direction TB
        P1[pages]
        P2[components]
        P3[routes]
    end

    subgraph STATE [State]
        direction LR
        S1[contexts]
        S2[hooks]
    end

    subgraph API_LAYER [API Layer]
        direction TB
        SV[services]
        BASE[base Axios JWT]
    end

    subgraph COMMON [Shared]
        direction LR
        I1[interfaces]
        I2[config utils]
    end

    BE[ShoppingFood.API]

    P1 --> P2
    P1 --> P3
    P1 --> S1
    P1 --> S2
    P1 --> SV
    S2 --> SV
    SV --> BASE
    SV --> I1
    P1 --> I2
    BASE -->|HTTPS| BE
```

### Pages theo role

| Role | Thư mục |
|------|---------|
| Khách / Customer | `shared` |
| Seller | `seller` |
| Shipper | `shipper` |
| Coordinator | `coordinator` |
| Admin | `admin` |
| Khác | `payment`, `support` |

### Services chính

`AuthService` · `CartService` · `OrderService` · `ProductService` · `RestaurantService` · `PaymentService` · `DiscountService` · `AdminService` · `ShipperService` · `NotificationService` · …

---

## Cách xem

1. Cursor / VS Code: mở file → `Ctrl+Shift+V`
2. Export hình: copy block `mermaid` → [mermaid.live](https://mermaid.live) → Export PNG/SVG
