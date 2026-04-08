"""Вход в систему. Проверяет телефон и пароль, возвращает данные пользователя."""
import json
import os
import hashlib
import psycopg2

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def get_conn():
    dsn = os.environ['DATABASE_URL']
    if '?' not in dsn:
        dsn += '?sslmode=disable'
    return psycopg2.connect(dsn)

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {**CORS_HEADERS, 'Access-Control-Max-Age': '86400'}, 'body': ''}

    body = json.loads(event.get('body') or '{}')
    phone = (body.get('phone') or '').strip()
    password = (body.get('password') or '').strip()

    if not phone or not password:
        return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Телефон и пароль обязательны'})}

    schema = os.environ['MAIN_DB_SCHEMA']
    conn = get_conn()
    cur = conn.cursor()
    pwd_hash = hash_password(password)

    cur.execute(f"SELECT id FROM {schema}.admins WHERE phone = %s AND role = 'owner' AND password_hash = 'OWNER_PLACEHOLDER'", (phone,))
    if cur.fetchone():
        cur.execute(f"UPDATE {schema}.admins SET password_hash = %s WHERE phone = %s AND password_hash = 'OWNER_PLACEHOLDER'", (pwd_hash, phone))
        conn.commit()

    cur.execute(f"SELECT id, phone, role, created_at FROM {schema}.admins WHERE phone = %s AND password_hash = %s", (phone, pwd_hash))
    row = cur.fetchone()
    cur.close(); conn.close()

    if not row:
        return {'statusCode': 401, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Неверный телефон или пароль'})}

    return {
        'statusCode': 200,
        'headers': CORS_HEADERS,
        'body': json.dumps({
            'id': row[0],
            'phone': row[1],
            'role': row[2],
            'createdAt': str(row[3])[:10]
        })
    }