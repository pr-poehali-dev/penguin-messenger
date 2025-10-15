import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Получение списка контактов пользователя
    Args: event - dict с httpMethod, queryStringParameters
          context - object с атрибутами request_id, function_name
    Returns: HTTP response dict со списком контактов
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
        if method == 'GET':
            user_id = event.get('headers', {}).get('x-user-id')
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute('''
                    SELECT 
                        u.id,
                        u.name,
                        u.avatar,
                        u.online,
                        u.phone
                    FROM users u
                    WHERE u.id != %s
                    ORDER BY u.name ASC
                ''', (user_id,))
                
                contacts = cur.fetchall()
                
                result = []
                for contact in contacts:
                    result.append({
                        'id': contact['id'],
                        'name': contact['name'],
                        'avatar': contact['avatar'],
                        'online': contact['online'],
                        'phone': contact['phone']
                    })
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps({'contacts': result})
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
