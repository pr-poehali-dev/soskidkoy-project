import json
import os
import psycopg2


def handler(event, context):
    """Создание карточки товара (номенклатура + товар с характеристикой)"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400'}, 'body': ''}

    if event.get('httpMethod') != 'POST':
        return {'statusCode': 405, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Method not allowed'})}

    raw_body = event.get('body') or '{}'
    body = json.loads(raw_body) if isinstance(raw_body, str) else raw_body

    name = (body.get('name') or '').strip()
    article = (body.get('article') or '').strip()
    description = (body.get('description') or '').strip()
    image_url = (body.get('image_url') or '').strip()
    base_price = body.get('base_price', 0)
    wholesale_price = body.get('wholesale_price', 0)
    watts = body.get('watts', 0)
    condition = (body.get('condition') or '').strip()
    condition_image_url = (body.get('condition_image_url') or '').strip()
    price_retail = body.get('price_retail', 0)
    nomenclature_id = body.get('nomenclature_id')

    if not name:
        return {'statusCode': 400, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Название обязательно'})}
    if condition not in ('как новый', 'отличный', 'хороший'):
        return {'statusCode': 400, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Укажите характеристику: как новый, отличный или хороший'})}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    if nomenclature_id:
        cur.execute(f"SELECT id, name, article, description, image_url, base_price, wholesale_price, watts FROM nomenclature WHERE id = {int(nomenclature_id)}")
        row = cur.fetchone()
        if not row:
            cur.close()
            conn.close()
            return {'statusCode': 404, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Номенклатура не найдена'})}
        nom_id = row[0]
    else:
        safe_name = name.replace("'", "''")
        safe_article = article.replace("'", "''")
        safe_desc = description.replace("'", "''")
        safe_img = image_url.replace("'", "''")

        cur.execute(f"INSERT INTO nomenclature (name, article, description, image_url, base_price, wholesale_price, watts) VALUES ('{safe_name}', '{safe_article}', '{safe_desc}', '{safe_img}', {float(base_price)}, {float(wholesale_price)}, {int(watts)}) RETURNING id")
        nom_id = cur.fetchone()[0]

    safe_cond = condition.replace("'", "''")
    safe_cond_img = condition_image_url.replace("'", "''")

    cur.execute(f"INSERT INTO products (nomenclature_id, condition, condition_image_url, price_retail) VALUES ({nom_id}, '{safe_cond}', '{safe_cond_img}', {float(price_retail)}) RETURNING id, created_at")
    prod = cur.fetchone()

    conn.commit()
    cur.close()
    conn.close()

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
        'body': json.dumps({
            'product_id': prod[0],
            'nomenclature_id': nom_id,
            'created_at': str(prod[1])
        })
    }