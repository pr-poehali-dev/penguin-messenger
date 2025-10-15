import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Регистрация и вход пользователей по телефону
    Args: event - dict с httpMethod, body, queryStringParameters
          context - object с атрибутами request_id, function_name
    Returns: HTTP response dict с данными пользователя
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    database_url = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(database_url)
    
    try:
        if method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            phone = body_data.get('phone', '')
            name = body_data.get('name', 'Пользователь')
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    "SELECT id, phone, name, avatar, online FROM users WHERE phone = %s",
                    (phone,)
                )
                user = cur.fetchone()
                
                if not user:
                    cur.execute(
                        "INSERT INTO users (phone, name, online) VALUES (%s, %s, true) RETURNING id, phone, name, avatar, online",
                        (phone, name)
                    )
                    user = cur.fetchone()
                else:
                    cur.execute(
                        "UPDATE users SET online = true WHERE id = %s RETURNING id, phone, name, avatar, online",
                        (user['id'],)
                    )
                    user = cur.fetchone()
                
                conn.commit()
                
                user_data = {
                    'id': user['id'],
                    'phone': user['phone'],
                    'name': user['name'],
                    'avatar': user['avatar'],
                    'online': user['online']
                }
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps({
                        'user': user_data,
                        'token': f"user_{user['id']}"
                    })
                }
        
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    finally:
        conn.close()