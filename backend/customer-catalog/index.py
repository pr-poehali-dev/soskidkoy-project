"""Каталог товаров для покупателя — только в наличии, без под ремонт и утиль"""
import json
import os
import psycopg2

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}


def handler(event, context):
    """Получение каталога товаров для покупателя"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {**CORS_HEADERS, 'Access-Control-Max-Age': '86400'}, 'body': ''}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    cur.execute("""
        SELECT n.id, n.name, n.article, n.image_url,
               n.base_price,
               COUNT(p.id) AS products_count,
               MIN(p.price_retail) AS min_retail,
               MAX(p.price_retail) AS max_retail,
               MAX(p.created_at) AS latest_product_date
        FROM nomenclature n
        INNER JOIN products p ON p.nomenclature_id = n.id
            AND COALESCE(p.status, 'в наличии') = 'в наличии'
            AND p.condition NOT IN ('под ремонт', 'утиль')
        GROUP BY n.id
        HAVING COUNT(p.id) > 0
        ORDER BY MAX(p.created_at) DESC
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
            'image_url': r[3] or '',
            'base_price': float(r[4] or 0),
            'products_count': int(r[5] or 0),
            'min_retail': float(r[6] or 0),
            'max_retail': float(r[7] or 0),
            'latest_product_date': str(r[8]) if r[8] else ''
        })

    return {
        'statusCode': 200,
        'headers': {**CORS_HEADERS, 'Content-Type': 'application/json'},
        'body': json.dumps({'items': items})
    }
