import json
import os
import psycopg2
from pywebpush import webpush, WebPushException


def handler(event, context):
    """Отправка пуш-уведомлений всем подписанным администраторам (только для владельца)"""
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Role',
                'Access-Control-Max-Age': '86400',
            },
            'body': '',
        }

    if event.get('httpMethod') != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
        }

    headers = event.get('headers') or {}
    role = headers.get('X-User-Role') or headers.get('x-user-role') or ''
    if role != 'owner':
        return {
            'statusCode': 403,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Only owner can send push notifications'}),
        }

    try:
        body = json.loads(event.get('body') or '{}')
    except Exception:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid JSON'}),
        }

    title = (body.get('title') or '').strip()
    message = (body.get('message') or '').strip()

    if not title or not message:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'title and message are required'}),
        }

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    cur.execute("SELECT id, endpoint, p256dh, auth_key FROM push_subscriptions")
    subs = cur.fetchall()

    if not subs:
        cur.close()
        conn.close()
        return {
            'statusCode': 200,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'success': True, 'sent': 0, 'failed': 0, 'message': 'No subscriptions found'}),
        }

    vapid_private = os.environ.get('VAPID_PRIVATE_KEY', '')
    vapid_public = os.environ.get('VAPID_PUBLIC_KEY', '')

    payload = json.dumps({'title': title, 'body': message})
    sent = 0
    failed = 0
    expired_ids = []

    for sub in subs:
        sub_id, endpoint, p256dh, auth_key = sub
        subscription_info = {
            'endpoint': endpoint,
            'keys': {
                'p256dh': p256dh,
                'auth': auth_key,
            },
        }
        try:
            webpush(
                subscription_info=subscription_info,
                data=payload,
                vapid_private_key=vapid_private,
                vapid_claims={'sub': 'mailto:admin@poehali.dev'},
                ttl=86400,
                headers={'Urgency': 'high', 'Topic': 'admin'},
            )
            sent += 1
        except WebPushException as e:
            if '410' in str(e) or '404' in str(e):
                expired_ids.append(str(sub_id))
            failed += 1
        except Exception:
            failed += 1

    if expired_ids:
        cur.execute(f"UPDATE push_subscriptions SET admin_id = NULL WHERE id IN ({','.join(expired_ids)})")
        conn.commit()

    cur.close()
    conn.close()

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
        'body': json.dumps({'success': True, 'sent': sent, 'failed': failed}),
    }