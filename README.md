# 🚀 Full-Stack Food Delivery Ecosystem

I built an entire food delivery ecosystem from scratch — including the backend, real-time infrastructure, database architecture, geospatial systems, financial workflows, and **4 separate frontends**.

> **5 Platforms. 1 Shared Backend. Real-Time Synchronization Across Every Layer.**

This project was inspired by enterprise-scale food delivery platforms like Talabat. Instead of building only the UI, I wanted to understand what happens behind the scenes:

* Real-world business workflows
* Scalable data modeling
* Real-time communication
* Live driver dispatch
* Geospatial delivery zones
* Financial transactions
* Wallet and ledger systems
* Order lifecycle management

So I built the entire system myself as a learning project.

---

## 🏗️ Architecture

### 1. Backend

**Node.js · Express · PostgreSQL · Prisma**

The backend is organized into **19 isolated modules**, covering:

* Authentication
* Users
* Carts
* Orders
* Payments
* Drivers
* Stores
* Catalog
* Tracking
* Messaging
* Notifications
* Delivery zones
* Reviews
* Wishlists
* Wallets
* And more

The goal was to separate business domains while maintaining a single shared backend for all platforms.

---

### 2. Real-Time Engine

Built with **Socket.io** and organized into **4 dedicated namespaces**:

#### `/dispatch`

Nearest-driver matching using the **Haversine formula**, with automatic cascading when a driver does not respond within **60 seconds**.

#### `/tracking`

Real-time GPS location streaming with persistent location history.

#### `/chat`

Real-time messaging scoped to individual orders.

#### `/notifications`

Role-based real-time notifications for customers, drivers, store owners, and administrators.

---

### 3. Database Architecture

**1,431 lines of Prisma schema**

The database models complex relationships between users, stores, drivers, orders, wallets, transactions, and more.

#### 👤 Users

* Wallets
* Ledgers
* Addresses
* Saved cards

#### 🏪 Store Owners

* Authentication
* Wallets
* Automated commission splits

#### 🛵 Drivers

* KYC
* Delivery zones
* Wallets
* Automatic suspension when balance reaches **−1,500 EGP**

#### 💰 Platform Treasury

Financial transactions are designed around **atomic operations** to maintain consistency across wallets and ledgers.

#### 🧩 Dynamic Schemas

Key-value data modeling allows stores to define custom attributes without requiring database schema changes or migrations.

---

### 4. Spatial Geofencing

**PostGIS · Leaflet · PostgreSQL Geometry**

Administrators can draw delivery zones directly on a Leaflet map.

Zones are stored using native:

`geometry(Polygon, 4326)`

Stores and drivers can be associated with specific delivery zones, while delivery fees can be calculated dynamically based on whether an order falls inside or outside the supported delivery area.

---

### 5. Four Frontends

#### 🖥️ Admin Dashboard

* Analytics dashboard
* Fleet management
* Live driver map
* KYC management
* Delivery zone management

#### 📱 Customer App

* Browse stores and products
* Shopping cart
* Checkout
* Order management
* Live order tracking

#### 🛵 Driver App

* Driver onboarding
* Delivery management
* Order acceptance
* Live location sharing
* Wallet management

#### 🌐 Web Client

* Customer ordering portal
* Store browsing
* Cart and checkout
* Order tracking

All platforms communicate with the same backend and synchronize through the real-time infrastructure.

---

### 6. Complete Order Lifecycle

```text
Order Placed
     ↓
Zone Validation
     ↓
Driver Dispatch
     ↓
Driver Assignment
     ↓
Live GPS Tracking
     ↓
Delivery Completion
     ↓
Atomic Wallet Updates
     ↓
Audit Logging
```

The goal was to model the complete workflow rather than simply create a food ordering interface.

---

## 🎯 Why I Built This

I built this entirely as a learning project.

Every feature was an opportunity to go deeper into:

* System design
* Backend architecture
* Real-time systems
* Distributed workflows
* Geospatial data
* Database modeling
* Financial data modeling
* Event-driven communication
* Scalable application architecture

This project helped me understand how the different pieces of a large-scale delivery platform connect together — from the moment a customer places an order to the final financial settlement.

**Educational purposes only.**
