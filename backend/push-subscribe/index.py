import json
import os
import psycopg2


def _escape(value):
    if value is None:
        return 'NULL'
    return "'" + str(value).replace("'", "''") + "'"


def handler(event, context):
    """Сохранение подписки на пуш-уведомления для администратора"""
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400',
            },
            'body': '',
        }

    method = event.get('httpMethod', 'GET')

    if method == 'GET':
        return {
            'statusCode': 200,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'vapid_public_key': os.environ.get('VAPID_PUBLIC_KEY', '')}),
        }

    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
        }

    try:
        body = json.loads(event.get('body') or '{}')
    except Exception:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid JSON'}),
        }

    endpoint = body.get('endpoint', '').strip()
    p256dh = body.get('p256dh', '').strip()
    auth_key = body.get('auth_key', '').strip()
    admin_id = body.get('admin_id')

    if not endpoint or not p256dh or not auth_key:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'endpoint, p256dh and auth_key are required'}),
        }

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    admin_id_val = 'NULL'
    if admin_id:
        try:
            admin_id_val = str(int(admin_id))
        except ValueError:
            admin_id_val = 'NULL'

    cur.execute(
        f"INSERT INTO push_subscriptions (admin_id, endpoint, p256dh, auth_key) "
        f"VALUES ({admin_id_val}, {_escape(endpoint)}, {_escape(p256dh)}, {_escape(auth_key)}) "
        f"ON CONFLICT (endpoint) DO UPDATE SET p256dh = {_escape(p256dh)}, auth_key = {_escape(auth_key)}, admin_id = {admin_id_val} "
        f"RETURNING id"
    )
    sub_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
        'body': json.dumps({'success': True, 'subscription_id': sub_id}),
    }
