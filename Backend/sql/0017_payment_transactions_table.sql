-- ALTER TABLE payment_transactions
-- ALTER COLUMN item_id DROP NOT NULL,
-- ALTER COLUMN user_id DROP NOT NULL,
-- ALTER COLUMN user_name DROP NOT NULL,
-- ALTER COLUMN user_email DROP NOT NULL,
-- ALTER COLUMN payment_method DROP NOT NULL;

-- CREATE TABLE IF NOT EXISTS payment_transactions (
--     id SERIAL PRIMARY KEY,
--     order_id VARCHAR(255) NOT NULL,
--     item_id INT,
--     user_id INT NOT NULL REFERENCES users(id),
--     user_name VARCHAR(255),
--     user_email VARCHAR(255),
--     transaction_id VARCHAR(255) NOT NULL,
--     payment_method VARCHAR(50),
--     amount NUMERIC(10,2) NOT NULL,
--     payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- ALTER TABLE payment_transactions
-- DROP COLUMN IF EXISTS order_id,
-- DROP COLUMN IF EXISTS item_id,
-- DROP COLUMN IF EXISTS user_id,
-- DROP COLUMN IF EXISTS user_name,
-- DROP COLUMN IF EXISTS user_email,
-- DROP COLUMN IF EXISTS payment_method,
-- DROP COLUMN IF EXISTS payment_date;

-- ALTER TABLE payment_transactions
-- ADD COLUMN IF NOT EXISTS item_id INT,
-- ADD COLUMN IF NOT EXISTS user_name VARCHAR(255),
-- ADD COLUMN IF NOT EXISTS user_email VARCHAR(255),
-- ADD COLUMN IF NOT EXISTS user_id INT REFERENCES users(id),
-- ADD COLUMN IF NOT EXISTS order_id VARCHAR(255),
-- ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(255),
-- ADD COLUMN IF NOT EXISTS amount NUMERIC(10,2),
-- ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- UPDATE payment_transactions
-- SET created_at = NOW()
-- WHERE created_at IS NULL;

-- ALTER TABLE payment_transactions
--     ADD COLUMN IF NOT EXISTS quantity INT DEFAULT 1,
--     ADD COLUMN IF NOT EXISTS item_price NUMERIC(10,2),
--     ADD COLUMN IF NOT EXISTS total_item_amount NUMERIC(10,2),
--     ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- ALTER TABLE payment_transactions
--     ALTER COLUMN item_id TYPE VARCHAR(255) USING item_id::text,
--     ADD COLUMN IF NOT EXISTS item_name VARCHAR(255),
--     ADD COLUMN IF NOT EXISTS item_image TEXT;

ALTER TABLE payment_transactions
ALTER COLUMN transaction_id DROP NOT NULL;