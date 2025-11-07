# 🛍️ E-Commerce WPH API - Challenge Ezar WPH048

A modern RESTful API built for the **E-Commerce Project - With Custom Backend (Swagger) **.  
This backend powers the **Next.js + TypeScript + Tailwind** frontend, enabling buyer–seller interactions, product management, checkout, and order workflows.

---

## 🚀 Tech Stack

| Layer              | Technology                    |
| ------------------ | ----------------------------- |
| Framework          | Next.js (App Router)          |
| Library            | React 19                      |
| Language           | TypeScript                    |
| Styling            | Tailwind CSS v4               |
| UI Components      | ShadCN UI (Radix Primitives)  |
| Forms & Validation | React Hook Form + Zod         |
| HTTP Client        | Axios (custom `api()` helper) |
| Optimistic UI      | TanStack React Query          |
| Image Handling     | Cloudinary                    |

---

## 🧩 Features

### 👤 Authentication

- **POST** `/api/auth/register` – Register new user (buyer by default)
- **POST** `/api/auth/login` – Login and receive access token
- **GET** `/api/me` – Retrieve logged-in user info
- **PATCH** `/api/me` – Update profile (name, avatar, etc.)

> 🔐 All private routes require a valid JWT token in the `Authorization` header.

---

### 🏪 Seller Management

- **POST** `/api/seller/activate` – Convert buyer → seller (open store)
- **GET** `/api/seller/shop` – Get seller’s shop info
- **PATCH** `/api/seller/shop` – Update shop name or logo

---

### 🛒 Product Management

- **GET** `/api/products` – Get paginated product list (with query filters)
- **GET** `/api/products/:id` – Get product details + reviews
- **POST** `/api/products` – Add new product _(seller only)_
- **PATCH** `/api/products/:id` – Update product _(seller only)_
- **DELETE** `/api/products/:id` – Delete product _(seller only)_

> 🖼️ Image uploads handled via **Cloudinary** integration.  
> FE uses multipart/form-data via Swagger or Axios.

---

### 🧺 Cart System

- **GET** `/api/cart` – Retrieve cart items for buyer
- **POST** `/api/cart` – Add product to cart
- **PATCH** `/api/cart/:id` – Update quantity
- **DELETE** `/api/cart/:id` – Remove item from cart

---

### 💳 Checkout & Orders

- **POST** `/api/orders/checkout`  
  Create a new order and simulate payment (mocked as `PAID`).  
  **Body Example:**
  ```json
  {
    "address": "Jl. Merdeka No. 123",
    "shipping": "JNE",
    "payment": "BCA"
  }
  ```

## 🧾 License

**Free to Use — Open for Learning and Portfolio Projects**  
You are free to **modify, reuse, and distribute** this project for **educational or non-commercial** purposes.

Attribution to the original creator **Manggala Eleazar** is appreciated but not required.
