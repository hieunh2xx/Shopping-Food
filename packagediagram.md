# Shopping Food — Package Diagrams

Tài liệu mô tả cấu trúc package của toàn hệ thống, backend (.NET 8) và frontend (React).

> Diagram dùng cú pháp Mermaid đơn giản, tương thích Cursor / VS Code / GitHub / mermaid.live.

---

## 1. Toàn dự án (System)

```mermaid
flowchart TB
    subgraph FE [ShoppingFood FE - React Vite]
        FE_Pages[Pages Routes]
        FE_Services[Services API client]
        FE_Components[Components Contexts]
    end

    subgraph BE [Backend NET 8]
        BE_API[ShoppingFood.API]
        BE_App[ShoppingFood.Application]
        BE_Repo[ShoppingFood.Repository]
        BE_Domain[ShoppingFood.Domain]
        BE_Dto[ShoppingFood.Dto]
        BE_Core[ShoppingFood.Core]
        BE_Tests[ShoppingFood.Tests]
    end

    subgraph EXT [External]
        EXT_SQL[SQL Server]
        EXT_Sepay[SePay]
        EXT_Other[SMTP Stringee SignalR]
    end

    FE_Pages --> FE_Services
    FE_Pages --> FE_Components
    FE_Services --> BE_API
    BE_API --> BE_App
    BE_App --> BE_Repo
    BE_Repo --> EXT_SQL
    BE_API --> EXT_Sepay
    BE_API --> EXT_Other
    BE_App --> BE_Dto
    BE_App --> BE_Core
    BE_Repo --> BE_Domain
    BE_Domain --> BE_Core
    BE_Dto --> BE_Core
    BE_Tests --> BE_App
    BE_Tests --> BE_Repo
```

---

## 2. Backend (Clean Architecture)

```mermaid
flowchart TB
    subgraph PKG_API [ShoppingFood.API]
        API_Ctrl[Controllers]
        API_Program[Program DI]
        API_Auth[Auth Filter SignalR]
        API_Seed[TestDataSeeder]
    end

    subgraph PKG_APP [ShoppingFood.Application]
        APP_Features[Features CQRS]
        APP_Services[Services Email Settlement Chat]
        APP_Validators[Validators]
    end

    subgraph PKG_REPO [ShoppingFood.Repository]
        REPO_Repos[Repositories]
        REPO_UoW[UnitOfWork]
    end

    subgraph PKG_DOMAIN [ShoppingFood.Domain]
        DOM_Entities[Entities Models]
        DOM_Enums[Enums]
        DOM_Db[DbContext Migrations]
    end

    subgraph PKG_DTO [ShoppingFood.Dto]
        DTO_Items[Request Response DTOs]
    end

    subgraph PKG_CORE [ShoppingFood.Core]
        CORE_Api[ApiResponse]
        CORE_Base[Interfaces Base]
    end

    subgraph PKG_TESTS [ShoppingFood.Tests]
        TEST_Unit[Handler Unit Tests]
        TEST_Fixture[TestDbFixture]
    end

    API_Ctrl --> APP_Features
    API_Program --> REPO_Repos
    APP_Features --> REPO_Repos
    APP_Features --> DTO_Items
    APP_Features --> CORE_Api
    APP_Features --> APP_Services
    APP_Features --> APP_Validators
    REPO_Repos --> DOM_Entities
    REPO_Repos --> DOM_Db
    REPO_Repos --> REPO_UoW
    DOM_Entities --> DOM_Enums
    DOM_Entities --> CORE_Base
    DTO_Items --> CORE_Api
    TEST_Unit --> APP_Features
    TEST_Unit --> REPO_Repos
    TEST_Unit --> TEST_Fixture
```

### Project references

| Project | Depends on |
|---------|------------|
| `ShoppingFood.API` | Application, Repository |
| `ShoppingFood.Application` | Domain, Dto, Core, Repository |
| `ShoppingFood.Repository` | Domain, Dto, Core |
| `ShoppingFood.Domain` | Core |
| `ShoppingFood.Dto` | Core |
| `ShoppingFood.Tests` | Application, Repository |

**Dependency direction (không đảo ngược):**  
`API → Application → Repository → Domain`  
`Dto` / `Core` dùng chung; `Tests` phụ thuộc Application + Repository.

### Application Features

`Admin`, `Carts`, `Chat`, `Coordinator`, `Discounts`, `Faqs`, `FlashSales`, `LoyaltyPoints`, `Notifications`, `Orders`, `Payments`, `Products`, `Promotions`, `Restaurants`, `Shippers`, `Support`, `System`, `UserAddresses`, `Users`

---

## 3. Frontend (ShoppingFood.FE)

```mermaid
flowchart TB
    subgraph FE_PRES [Presentation]
        FE_Pages[pages admin seller shipper coordinator]
        FE_Components[components]
        FE_Routes[routes]
    end

    subgraph FE_STATE [State and UX]
        FE_Contexts[contexts]
        FE_Hooks[hooks]
    end

    subgraph FE_DATA [Data Access]
        FE_Services[services Auth Order Cart Product Payment]
        FE_Base[services base Axios JWT]
    end

    subgraph FE_SHARED [Shared]
        FE_Interfaces[interfaces]
        FE_Config[config]
        FE_Utils[utils]
    end

    subgraph FE_QA [Quality]
        FE_UnitTests[unit tests]
        FE_E2E[e2e Playwright]
    end

    FE_Backend[ShoppingFood.API]

    FE_Pages --> FE_Components
    FE_Pages --> FE_Routes
    FE_Pages --> FE_Contexts
    FE_Pages --> FE_Hooks
    FE_Pages --> FE_Services
    FE_Hooks --> FE_Services
    FE_Services --> FE_Base
    FE_Services --> FE_Interfaces
    FE_Base --> FE_Backend
    FE_E2E --> FE_Pages
    FE_UnitTests --> FE_Services
    FE_Pages --> FE_Config
    FE_Pages --> FE_Utils
```

### `src/` layout

| Folder | Responsibility |
|--------|----------------|
| `pages/` | Màn hình theo role: `admin`, `seller`, `shipper`, `coordinator`, `shared`, `payment`, `support` |
| `components/` | UI tái sử dụng |
| `routes/` | React Router |
| `contexts/` | Auth / app state |
| `hooks/` | Custom hooks |
| `services/` | API clients (Auth, Order, Cart, Product, Payment, Admin, …) |
| `services/base/` | Axios instance + JWT |
| `interfaces/` | TypeScript contracts |
| `config/` | Env / app config |
| `utils/` | Helpers |
| `__tests__/` | Unit tests FE |
| `e2e/` | Playwright walkthrough / evidence |

---

## Cách xem diagram

1. Mở file này trong Cursor → **Markdown Preview** (`Ctrl+Shift+V`)
2. Hoặc copy từng block `mermaid` vào [https://mermaid.live](https://mermaid.live) → **Export PNG/SVG**
3. Nếu preview vẫn trắng: cài extension **Markdown Preview Mermaid Support**
