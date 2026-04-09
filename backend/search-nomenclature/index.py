import json
import os
import psycopg2


def handler(event, context):
    """Поиск номенклатуры по названию или артикулу"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400'}, 'body': ''}

    params = event.get('queryStringParameters') or {}
    query = (params.get('q') or '').strip()
    search_by = params.get('by', 'name')

    if not query or len(query) < 2:
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'}, 'body': json.dumps({'results': []})}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    safe_query = query.replace("'", "''").lower()

    if search_by == 'article':
        cur.execute(f"SELECT id, name, article, description, image_url, base_price, wholesale_price, watts FROM nomenclature WHERE LOWER(article) LIKE '%{safe_query}%' ORDER BY name LIMIT 10")
    else:
        cur.execute(f"SELECT id, name, article, description, image_url, base_price, wholesale_price, watts FROM nomenclature WHERE LOWER(name) LIKE '%{safe_query}%' ORDER BY name LIMIT 10")

    rows = cur.fetchall()
    cur.close()
    conn.close()

    results = []
    for r in rows:
        results.append({
            'id': r[0],
            'name': r[1],
            'article': r[2] or '',
            'description': r[3] or '',
            'image_url': r[4] or '',
            'base_price': float(r[5] or 0),
            'wholesale_price': float(r[6] or 0),
            'watts': r[7] or 0
        })

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
        'body': json.dumps({'results': results})
    }
