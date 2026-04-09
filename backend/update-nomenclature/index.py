import json
import os
import psycopg2


ALLOWED_FIELDS = {'name', 'article', 'description', 'image_url', 'base_price', 'wholesale_price', 'watts', 'is_normalized'}


def _escape(value):
    if value is None:
        return 'NULL'
    if isinstance(value, bool):
        return 'true' if value else 'false'
    if isinstance(value, (int, float)):
        return str(value)
    return "'" + str(value).replace("'", "''") + "'"


def handler(event, context):
    """Пакетное обновление полей номенклатуры"""
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
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

    try:
        body = json.loads(event.get('body') or '{}')
    except Exception:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid JSON'}),
        }

    items = body.get('items')
    if not items or not isinstance(items, list):
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'items array is required'}),
        }

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    updated = 0

    for item in items:
        item_id = item.get('id')
        if not item_id:
            continue
        try:
            item_id = int(item_id)
        except ValueError:
            continue

        sets = []
        for field in ALLOWED_FIELDS:
            if field in item and field != 'id':
                val = item[field]
                if field in ('base_price', 'wholesale_price'):
                    try:
                        val = float(val)
                    except (ValueError, TypeError):
                        continue
                elif field == 'watts':
                    try:
                        val = int(val)
                    except (ValueError, TypeError):
                        continue
                elif field == 'is_normalized':
                    val = bool(val)
                sets.append(f"{field} = {_escape(val)}")

        if not sets:
            continue

        cur.execute(f"UPDATE nomenclature SET {', '.join(sets)} WHERE id = {item_id}")
        updated += max(cur.rowcount, 0)

    conn.commit()
    cur.close()
    conn.close()

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
        'body': json.dumps({'success': True, 'updated': updated}),
    }