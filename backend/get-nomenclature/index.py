import json
import os
import psycopg2


def handler(event, context):
    """Получение списка номенклатуры с агрегацией по характеристикам"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400'}, 'body': ''}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    cur.execute("""
        SELECT n.id, n.name, n.article, n.description, n.image_url,
               n.base_price, n.wholesale_price, n.watts, n.created_at, n.normalization_status,
               COUNT(p.id) FILTER (WHERE COALESCE(p.status, 'в наличии') = 'в наличии') AS products_count,
               MIN(p.price_retail) FILTER (WHERE COALESCE(p.status, 'в наличии') = 'в наличии') AS min_retail,
               MAX(p.price_retail) FILTER (WHERE COALESCE(p.status, 'в наличии') = 'в наличии') AS max_retail,
               MAX(p.created_at) FILTER (WHERE p.condition NOT IN ('под ремонт', 'утиль')) AS latest_product_date
        FROM nomenclature n
        LEFT JOIN products p ON p.nomenclature_id = n.id
        GROUP BY n.id
        ORDER BY n.created_at DESC
    """)

    rows = cur.fetchall()
    cur.close()
    conn.close()

    items = []
    for r in rows:
        items.append({
            'id': r[0],
            'name': r[1],
            'article': r[2] or '',
            'description': r[3] or '',
            'image_url': r[4] or '',
            'base_price': float(r[5] or 0),
            'wholesale_price': float(r[6] or 0),
            'watts': r[7] or 0,
            'created_at': str(r[8]),
            'normalization_status': r[9] or 'unchecked',
            'products_count': int(r[10] or 0),
            'min_retail': float(r[11] or 0),
            'max_retail': float(r[12] or 0),
            'latest_product_date': str(r[13]) if r[13] else ''
        })

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
        'body': json.dumps({'items': items})
    }