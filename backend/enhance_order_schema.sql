-- Add new columns to orders table
ALTER TABLE orders
ADD COLUMN initial_amount DECIMAL(10,2) DEFAULT NULL AFTER total_amount,
ADD COLUMN bill_amount DECIMAL(10,2) DEFAULT NULL AFTER initial_amount,
ADD COLUMN net_amount DECIMAL(10,2) DEFAULT NULL AFTER bill_amount;

-- Add new columns to order_items table
ALTER TABLE order_items
ADD COLUMN initial_pc_quantity INT NOT NULL DEFAULT 0 AFTER product_id,
ADD COLUMN initial_cs_quantity INT NOT NULL DEFAULT 0 AFTER initial_pc_quantity,
ADD COLUMN net_quantity INT NOT NULL DEFAULT 0 AFTER initial_cs_quantity,
ADD COLUMN initial_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER net_quantity,
ADD COLUMN bill_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER initial_amount,
ADD COLUMN net_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER bill_amount;