-- =====================================================
-- DEBY E-Commerce Database Schema
-- PostgreSQL Database Creation and Tables
-- =====================================================

-- Create the database
CREATE DATABASE deby_ecommerce;

-- Connect to the database
\c deby_ecommerce;

-- Create extension for UUID support
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE: Users
-- =====================================================
CREATE TABLE "Users" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "firstName" VARCHAR(255) NOT NULL,
    "lastName" VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    profile JSONB,
    addresses JSONB,
    "paymentMethods" JSONB,
    "isActive" BOOLEAN DEFAULT true,
    "isVerified" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false,
    "phoneVerified" BOOLEAN DEFAULT false,
    "verificationToken" VARCHAR(255),
    "verificationExpires" TIMESTAMP WITH TIME ZONE,
    "resetPasswordToken" VARCHAR(255),
    "resetPasswordExpires" TIMESTAMP WITH TIME ZONE,
    preferences JSONB,
    "lastLogin" TIMESTAMP WITH TIME ZONE,
    "loginCount" INTEGER DEFAULT 0,
    "totalOrders" INTEGER DEFAULT 0,
    "totalSpent" DECIMAL(10, 2) DEFAULT 0,
    "socialLogin" JSONB,
    role VARCHAR(255) CHECK (role IN ('customer', 'admin', 'moderator')) DEFAULT 'customer',
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for Users table
CREATE INDEX idx_users_email ON "Users"(email);
CREATE INDEX idx_users_phone ON "Users"(phone);

-- =====================================================
-- TABLE: Customers
-- =====================================================
CREATE TABLE "Customers" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "firstName" VARCHAR(255) NOT NULL,
    "lastName" VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255),
    addresses JSONB,
    preferences JSONB,
    "isActive" BOOLEAN DEFAULT true,
    "phoneVerified" BOOLEAN DEFAULT false,
    "lastLogin" TIMESTAMP WITH TIME ZONE,
    "totalOrders" INTEGER DEFAULT 0,
    "totalSpent" DECIMAL(10, 2) DEFAULT 0,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =====================================================
-- TABLE: Categories
-- =====================================================
CREATE TABLE "Categories" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    slug VARCHAR(255),
    description TEXT,
    image VARCHAR(255),
    icon VARCHAR(255),
    "parentId" UUID,
    level INTEGER DEFAULT 0,
    path VARCHAR(255),
    "isActive" BOOLEAN DEFAULT true,
    "displayOrder" INTEGER DEFAULT 0,
    "metaTitle" VARCHAR(255),
    "metaDescription" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =====================================================
-- TABLE: Products
-- =====================================================
CREATE TABLE "Products" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(500) NOT NULL,
    slug VARCHAR(600) UNIQUE,
    description TEXT NOT NULL,
    "shortDescription" TEXT,
    price DECIMAL(10, 2) NOT NULL,
    "originalPrice" DECIMAL(10, 2),
    "discountPercentage" DECIMAL(5, 2) DEFAULT 0,
    "mainImage" TEXT NOT NULL,
    images TEXT[],
    video TEXT,
    "seoTitle" VARCHAR(500),
    "seoDescription" TEXT,
    "seoKeywords" VARCHAR(255)[],
    "metaTags" JSONB,
    category VARCHAR(300) NOT NULL,
    subcategory VARCHAR(300),
    brand VARCHAR(300) DEFAULT 'E-Gura Store',
    tags TEXT[],
    gender VARCHAR(255) CHECK (gender IN ('male', 'female', 'unisex')) DEFAULT 'female',
    "ageGroup" VARCHAR(255) CHECK ("ageGroup" IN ('kids', 'teen', 'adult')) DEFAULT 'adult',
    material TEXT[],
    care TEXT[],
    sizes TEXT[],
    colors TEXT[],
    variants JSONB,
    "stockQuantity" INTEGER DEFAULT 0,
    "lowStockThreshold" INTEGER DEFAULT 5,
    sku VARCHAR(300) UNIQUE,
    "isActive" BOOLEAN DEFAULT true,
    "isFeatured" BOOLEAN DEFAULT false,
    "isNew" BOOLEAN DEFAULT false,
    "isSale" BOOLEAN DEFAULT false,
    "isBestSeller" BOOLEAN DEFAULT false,
    reviews JSONB,
    "averageRating" DECIMAL(2, 1) DEFAULT 0,
    "totalReviews" INTEGER DEFAULT 0,
    "metaTitle" VARCHAR(500),
    "metaDescription" TEXT,
    keywords TEXT[],
    "viewCount" INTEGER DEFAULT 0,
    "salesCount" INTEGER DEFAULT 0,
    weight DECIMAL(10, 2),
    dimensions JSONB,
    "shippingClass" VARCHAR(255) CHECK ("shippingClass" IN ('standard', 'express', 'free')) DEFAULT 'standard',
    "careInstructions" TEXT[],
    "returnPolicy" TEXT,
    warranty TEXT,
    "bargainEnabled" BOOLEAN DEFAULT true,
    "minBargainPrice" DECIMAL(10, 2),
    "maxBargainDiscount" INTEGER DEFAULT 25,
    "bargainStrategy" VARCHAR(255) CHECK ("bargainStrategy" IN ('aggressive', 'balanced', 'conservative')) DEFAULT 'balanced',
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for Products table
CREATE INDEX idx_products_category_active ON "Products"(category, "isActive");
CREATE INDEX idx_products_featured_active ON "Products"("isFeatured", "isActive");
CREATE INDEX idx_products_new_active ON "Products"("isNew", "isActive");
CREATE INDEX idx_products_sale_active ON "Products"("isSale", "isActive");

-- =====================================================
-- TABLE: Orders
-- =====================================================
CREATE TABLE "Orders" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID,
    "orderNumber" VARCHAR(255) UNIQUE,
    "referenceNumber" VARCHAR(255),
    "externalId" VARCHAR(255),
    items JSONB,
    subtotal DECIMAL(10, 2) NOT NULL,
    tax DECIMAL(10, 2) DEFAULT 0,
    "shippingCost" DECIMAL(10, 2) DEFAULT 0,
    discount DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,
    "totalAmount" DECIMAL(10, 2),
    "paymentMethod" VARCHAR(255) NOT NULL,
    "paymentMode" VARCHAR(255),
    "paymentStatus" VARCHAR(255) CHECK ("paymentStatus" IN ('pending', 'processing', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
    "paymentDetails" JSONB,
    "shippingAddress" JSONB,
    "customerInfo" JSONB,
    status VARCHAR(255) CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned')) DEFAULT 'pending',
    "trackingNumber" VARCHAR(255),
    "estimatedDelivery" TIMESTAMP WITH TIME ZONE,
    "actualDelivery" TIMESTAMP WITH TIME ZONE,
    "mobileMoney" JSONB,
    "momoPay" JSONB,
    "cashOnDelivery" JSONB,
    notes JSONB,
    "orderDate" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "statusHistory" JSONB,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    FOREIGN KEY ("userId") REFERENCES "Users"(id) ON DELETE SET NULL
);

-- =====================================================
-- TABLE: Reviews
-- =====================================================
CREATE TABLE "Reviews" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "orderId" UUID,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    comment TEXT NOT NULL,
    images TEXT[] DEFAULT '{}',
    verified BOOLEAN DEFAULT false,
    helpful INTEGER DEFAULT 0,
    "notHelpful" INTEGER DEFAULT 0,
    status VARCHAR(255) CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    FOREIGN KEY ("userId") REFERENCES "Users"(id) ON DELETE CASCADE,
    FOREIGN KEY ("productId") REFERENCES "Products"(id) ON DELETE CASCADE,
    FOREIGN KEY ("orderId") REFERENCES "Orders"(id) ON DELETE SET NULL
);

-- Create indexes for Reviews table
CREATE INDEX idx_reviews_product ON "Reviews"("productId");
CREATE INDEX idx_reviews_user ON "Reviews"("userId");
CREATE INDEX idx_reviews_status ON "Reviews"(status);

-- =====================================================
-- TABLE: Addresses
-- =====================================================
CREATE TABLE "Addresses" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    type VARCHAR(255) CHECK (type IN ('shipping', 'billing', 'both')) DEFAULT 'both',
    "fullName" VARCHAR(255) NOT NULL,
    phone VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    "addressLine1" VARCHAR(255) NOT NULL,
    "addressLine2" VARCHAR(255),
    city VARCHAR(255) NOT NULL,
    district VARCHAR(255),
    province VARCHAR(255),
    "postalCode" VARCHAR(255),
    country VARCHAR(255) DEFAULT 'Rwanda',
    "isDefault" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    FOREIGN KEY ("userId") REFERENCES "Users"(id) ON DELETE CASCADE
);

-- Create indexes for Addresses table
CREATE INDEX idx_addresses_user ON "Addresses"("userId");
CREATE INDEX idx_addresses_default ON "Addresses"("isDefault");

-- =====================================================
-- TABLE: Wishlists
-- =====================================================
CREATE TABLE "Wishlists" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "addedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    FOREIGN KEY ("userId") REFERENCES "Users"(id) ON DELETE CASCADE,
    FOREIGN KEY ("productId") REFERENCES "Products"(id) ON DELETE CASCADE
);

-- Create indexes for Wishlists table
CREATE INDEX idx_wishlists_user ON "Wishlists"("userId");
CREATE INDEX idx_wishlists_product ON "Wishlists"("productId");
CREATE UNIQUE INDEX idx_wishlists_user_product ON "Wishlists"("userId", "productId");

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
SELECT 'Database deby_ecommerce schema created successfully!' AS status;
