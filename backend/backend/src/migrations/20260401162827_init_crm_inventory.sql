-- CRM: Customers & Leads
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT NOT NULL, -- Standardized for M-Pesa (254...)
    tin_number TEXT,     -- For KRA eTIMS compliance
    balance DECIMAL(12,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inventory: Products
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    tax_category CHAR(1) DEFAULT 'A', -- KRA Tax Categories (A, B, C, D, E)
    current_stock INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inventory: Audit Trail (Stock Movements)
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id),
    type TEXT CHECK (type IN ('IN', 'OUT', 'ADJUST')),
    quantity INT NOT NULL,
    reference TEXT, -- e.g., "Purchase Order #123"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
