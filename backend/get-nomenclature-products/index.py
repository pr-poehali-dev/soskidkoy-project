import json
import os
import psycopg2


def handler(event, context):
    """Получение характеристик (products) одной номенклатуры по её id"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400'}, 'body': ''}

    params = event.get('queryStringParameters') or {}
    nom_id = params.get('nomenclature_id')

    if not nom_id:
        return {'statusCode': 400, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'nomenclature_id is required'})}

    try:
        nom_id_int = int(nom_id)
    except ValueError:
        return {'statusCode': 400, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'nomenclature_id must be integer'})}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    cur.execute(f"SELECT id, name, article, description, image_url, base_price, wholesale_price, watts FROM nomenclature WHERE id = {nom_id_int}")
    nom_row = cur.fetchone()

    if not nom_row:
        cur.close()
        conn.close()
        return {'statusCode': 404, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Nomenclature not found'})}

    nomenclature = {
        'id': nom_row[0],
        'name': nom_row[1],
        'article': nom_row[2] or '',
        'description': nom_row[3] or '',
        'image_url': nom_row[4] or '',
        'base_price': float(nom_row[5] or 0),
        'wholesale_price': float(nom_row[6] or 0),
        'watts': nom_row[7] or 0
    }

    cur.execute(f"SELECT id, condition, condition_image_url, price_retail, created_at FROM products WHERE nomenclature_id = {nom_id_int} ORDER BY created_at DESC")
    prod_rows = cur.fetchall()

    cur.close()
    conn.close()

    products = []
    for r in prod_rows:
        products.append({
            'id': r[0],
            'condition': r[1],
            'condition_image_url': r[2] or '',
            'price_retail': float(r[3] or 0),
            'created_at': str(r[4])
        })

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
        'body': json.dumps({'nomenclature': nomenclature, 'products': products})
    }
