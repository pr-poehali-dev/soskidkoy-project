import json
import os
import psycopg2


ALLOWED_TYPES = {'sold', 'written_off', 'transferred', 'condition_changed'}
ALLOWED_CONDITIONS = {'новый', 'как новый', 'отличный', 'хороший', 'под ремонт', 'утиль'}
NEW_STATUS = {
    'sold': 'продан',
    'written_off': 'списан',
    'transferred': 'передан',
}


def _escape(value):
    if value is None:
        return 'NULL'
    if isinstance(value, (int, float)):
        return str(value)
    return "'" + str(value).replace("'", "''") + "'"


def handler(event, context):
    """Движения товара: продажа, списание, передача, смена состояния + история"""
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
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

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    if method == 'GET':
        params = event.get('queryStringParameters') or {}
        nom_id = params.get('nomenclature_id')
        if not nom_id:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'nomenclature_id is required'}),
            }
        try:
            nom_id_int = int(nom_id)
        except ValueError:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'nomenclature_id must be integer'}),
            }

        cur.execute(
            f"SELECT id, product_id, movement_type, condition_before, condition_after, comment, created_at "
            f"FROM product_movements WHERE nomenclature_id = {nom_id_int} ORDER BY created_at DESC LIMIT 200"
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()

        movements = []
        for r in rows:
            movements.append({
                'id': r[0],
                'product_id': r[1],
                'movement_type': r[2],
                'condition_before': r[3] or '',
                'condition_after': r[4] or '',
                'comment': r[5] or '',
                'created_at': str(r[6]),
            })

        return {
            'statusCode': 200,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'movements': movements}),
        }

    if method == 'POST':
        try:
            body = json.loads(event.get('body') or '{}')
        except Exception:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Invalid JSON'}),
            }

        product_id = body.get('product_id')
        movement_type = body.get('movement_type')
        comment = (body.get('comment') or '').strip()
        new_condition = body.get('new_condition')

        if not product_id or not movement_type:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'product_id and movement_type are required'}),
            }

        if movement_type not in ALLOWED_TYPES:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'invalid movement_type'}),
            }

        try:
            product_id_int = int(product_id)
        except ValueError:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'product_id must be integer'}),
            }

        cur.execute(
            f"SELECT nomenclature_id, condition, COALESCE(status, 'в наличии') FROM products WHERE id = {product_id_int}"
        )
        row = cur.fetchone()
        if not row:
            cur.close()
            conn.close()
            return {
                'statusCode': 404,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'product not found'}),
            }

        nom_id = row[0]
        condition_before = row[1]
        current_status = row[2]

        if current_status != 'в наличии':
            cur.close()
            conn.close()
            return {
                'statusCode': 409,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'product is not in stock'}),
            }

        condition_after = None

        if movement_type == 'condition_changed':
            if new_condition not in ALLOWED_CONDITIONS:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'invalid new_condition'}),
                }
            condition_after = new_condition
            cur.execute(
                f"UPDATE products SET condition = {_escape(new_condition)} WHERE id = {product_id_int}"
            )
        else:
            new_status = NEW_STATUS[movement_type]
            cur.execute(
                f"UPDATE products SET status = {_escape(new_status)} WHERE id = {product_id_int}"
            )

        cur.execute(
            "INSERT INTO product_movements (product_id, nomenclature_id, movement_type, condition_before, condition_after, comment) "
            f"VALUES ({product_id_int}, {nom_id}, {_escape(movement_type)}, {_escape(condition_before)}, {_escape(condition_after)}, {_escape(comment)}) RETURNING id"
        )
        movement_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()

        return {
            'statusCode': 200,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'success': True, 'movement_id': movement_id}),
        }

    cur.close()
    conn.close()
    return {
        'statusCode': 405,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'}),
    }
