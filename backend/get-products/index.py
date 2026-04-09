import json
import os
import psycopg2


def handler(event, context):
    """Получение списка всех товаров с данными номенклатуры"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400'}, 'body': ''}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    cur.execute("""
        SELECT p.id, p.condition, p.condition_image_url, p.price_retail, p.created_at,
               n.id, n.name, n.article, n.description, n.image_url, n.base_price, n.wholesale_price, n.watts
        FROM products p
        JOIN nomenclature n ON n.id = p.nomenclature_id
        ORDER BY p.created_at DESC
    """)

    rows = cur.fetchall()
    cur.close()
    conn.close()

    products = []
    for r in rows:
        products.append({
            'id': r[0],
            'condition': r[1],
            'condition_image_url': r[2] or '',
            'price_retail': float(r[3] or 0),
            'created_at': str(r[4]),
            'nomenclature_id': r[5],
            'name': r[6],
            'article': r[7] or '',
            'description': r[8] or '',
            'image_url': r[9] or '',
            'base_price': float(r[10] or 0),
            'wholesale_price': float(r[11] or 0),
            'watts': r[12] or 0
        })

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
        'body': json.dumps({'products': products})
    }
