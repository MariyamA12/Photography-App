-- CREATE TABLE IF NOT EXISTS orders_summary (
--     id SERIAL PRIMARY KEY,
--     order_id VARCHAR(255) NOT NULL UNIQUE,
--     user_id INT NOT NULL REFERENCES users(id),
--     user_name VARCHAR(255),
--     user_email VARCHAR(255),
--     transaction_id VARCHAR(255) NOT NULL,
--     total_amount NUMERIC(10,2) NOT NULL,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

ALTER TABLE orders_summary
ALTER COLUMN user_name DROP NOT NULL,
ALTER COLUMN transaction_id DROP NOT NULL;