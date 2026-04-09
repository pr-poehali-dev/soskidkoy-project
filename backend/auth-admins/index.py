"""Список всех администраторов. Доступен только для владельца."""
import json
import os
import psycopg2

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-User-Role',
}

def get_conn():
    dsn = os.environ['DATABASE_URL']
    if '?' not in dsn:
        dsn += '?sslmode=disable'
    return psycopg2.connect(dsn)

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {**CORS_HEADERS, 'Access-Control-Max-Age': '86400'}, 'body': ''}

    headers = event.get('headers') or {}
    user_role = headers.get('X-User-Role') or headers.get('x-user-role') or ''

    if user_role != 'owner':
        return {'statusCode': 403, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Доступ запрещён'})}

    schema = os.environ['MAIN_DB_SCHEMA']
    conn = get_conn()
    cur = conn.cursor()
    method = event.get('httpMethod')

    if method == 'DELETE':
        params = event.get('queryStringParameters') or {}
        admin_id = params.get('id')
        if not admin_id:
            cur.close(); conn.close()
            return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'ID не указан'})}

        cur.execute(f"DELETE FROM {schema}.admins WHERE id = %s AND role != 'owner'", (int(admin_id),))
        conn.commit()
        cur.close(); conn.close()
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'success': True})}

    cur.execute(f"SELECT id, phone, role, created_at FROM {schema}.admins WHERE is_active = true ORDER BY role DESC, created_at ASC")
    rows = cur.fetchall()
    cur.close(); conn.close()

    admins = [
        {'id': r[0], 'phone': r[1], 'role': r[2], 'createdAt': str(r[3])[:10]}
        for r in rows
    ]

    return {
        'statusCode': 200,
        'headers': CORS_HEADERS,
        'body': json.dumps({'admins': admins})
    }