-- Локации
CREATE TABLE IF NOT EXISTS locations (
                                         id SERIAL PRIMARY KEY,
                                         name VARCHAR(100) NOT NULL,
    location_type VARCHAR(50) NOT NULL, -- 'dorm', 'cafe'
    is_paid BOOLEAN DEFAULT true,
    price_per_week INTEGER DEFAULT 30000,
    free_minutes INTEGER DEFAULT 0,
    mikrotik_ip INET NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
    );

-- Пользователи
CREATE TABLE IF NOT EXISTS users (
                                     id SERIAL PRIMARY KEY,
                                     mac_address VARCHAR(17) UNIQUE NOT NULL,
    phone VARCHAR(20),
    phone_verified BOOLEAN DEFAULT false,
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
    );

CREATE INDEX IF NOT EXISTS idx_users_mac ON users(mac_address);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- Сессии пользователей
CREATE TABLE IF NOT EXISTS user_sessions (
                                             id SERIAL PRIMARY KEY,
                                             user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    location_id INTEGER REFERENCES locations(id),
    start_time TIMESTAMP DEFAULT NOW(),
    paid_until TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
    );

CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON user_sessions(is_active) WHERE is_active = true;

-- Платежи
CREATE TABLE IF NOT EXISTS payments (
                                        id SERIAL PRIMARY KEY,
                                        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    location_id INTEGER REFERENCES locations(id),
    amount INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    payment_id VARCHAR(100) UNIQUE,
    yookassa_payment_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
    );

CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_yookassa ON payments(yookassa_payment_id);

-- SMS коды верификации
CREATE TABLE IF NOT EXISTS sms_verifications (
                                                 id SERIAL PRIMARY KEY,
                                                 phone VARCHAR(20) NOT NULL,
    code VARCHAR(6) NOT NULL,
    verified BOOLEAN DEFAULT false,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
    );

CREATE INDEX IF NOT EXISTS idx_sms_phone ON sms_verifications(phone);

-- Начальные данные
INSERT INTO locations (name, location_type, is_paid, price_per_week, free_minutes, mikrotik_ip)
VALUES
    ('Общежитие', 'dorm', true, 30000, 0, '10.100.0.38'),
    ('Кафе', 'cafe', false, 0, 120, '10.100.0.39')
    ON CONFLICT DO NOTHING;
