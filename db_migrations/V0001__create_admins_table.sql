CREATE TABLE t_p8954954_soskidkoy_project.admins (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(10) NOT NULL DEFAULT 'admin' CHECK (role IN ('owner', 'admin')),
    created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO t_p8954954_soskidkoy_project.admins (phone, password_hash, role)
VALUES ('+7 (900) 000-00-00', 'OWNER_PLACEHOLDER', 'owner');
