"""Регистрация нового администратора. Принимает телефон и пароль, сохраняет в БД."""
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

    if len(password) < 8:
        return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Пароль слишком короткий'})}

    schema = os.environ['MAIN_DB_SCHEMA']
    conn = get_conn()
    cur = conn.cursor()

    cur.execute(f"SELECT id FROM {schema}.admins WHERE phone = %s", (phone,))
    if cur.fetchone():
        cur.close(); conn.close()
        return {'statusCode': 409, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Этот номер уже зарегистрирован'})}

    pwd_hash = hash_password(password)
    cur.execute(
        f"INSERT INTO {schema}.admins (phone, password_hash, role) VALUES (%s, %s, 'admin') RETURNING id, phone, role, created_at",
        (phone, pwd_hash)
    )
    row = cur.fetchone()
    conn.commit()
    cur.close(); conn.close()

    return {
        'statusCode': 201,
        'headers': CORS_HEADERS,
        'body': json.dumps({
            'id': row[0],
            'phone': row[1],
            'role': row[2],
            'createdAt': str(row[3])[:10]
        })
    }