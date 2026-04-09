"""Регистрация покупателя по номеру телефона и паролю"""
import json
import os
import hashlib
import psycopg2

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}


def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()


def handler(event, context):
    """Регистрация нового покупателя"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {**CORS_HEADERS, 'Access-Control-Max-Age': '86400'}, 'body': ''}

    if event.get('httpMethod') != 'POST':
        return {'statusCode': 405, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Method not allowed'})}

    body = json.loads(event.get('body') or '{}')
    phone = (body.get('phone') or '').strip()
    password = (body.get('password') or '').strip()

    if not phone or not password:
        return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Телефон и пароль обязательны'})}

    if len(password) < 8:
        return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Пароль минимум 8 символов'})}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    cur.execute("SELECT id FROM customers WHERE phone = %s", (phone,))
    if cur.fetchone():
        cur.close()
        conn.close()
        return {'statusCode': 409, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Этот номер уже зарегистрирован'})}

    pwd_hash = hash_password(password)
    cur.execute(
        "INSERT INTO customers (phone, password_hash) VALUES (%s, %s) RETURNING id, phone, created_at",
        (phone, pwd_hash)
    )
    row = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()

    return {
        'statusCode': 201,
        'headers': CORS_HEADERS,
        'body': json.dumps({
            'id': row[0],
            'phone': row[1],
            'createdAt': str(row[2])[:10]
        })
    }
