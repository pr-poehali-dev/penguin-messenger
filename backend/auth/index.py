import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any
import hashlib
import secrets
from datetime import datetime, timedelta
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Регистрация и вход пользователей по телефону или через Google OAuth
    Args: event - dict с httpMethod, body (phone/name для телефона или google_token для Google), queryStringParameters
          context - object с атрибутами request_id, function_name
    Returns: HTTP response dict с данными пользователя и токеном сессии
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
            google_token = body_data.get('google_token', '')
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                user = None
                
                if google_token:
                    client_id = os.environ.get('GOOGLE_CLIENT_ID')
                    if not client_id:
                        return {
                            'statusCode': 500,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'isBase64Encoded': False,
                            'body': json.dumps({'error': 'Google auth not configured'})
                        }
                    
                    try:
                        idinfo = id_token.verify_oauth2_token(google_token, google_requests.Request(), client_id)
                        google_id = idinfo['sub']
                        email = idinfo.get('email', '')
                        name = idinfo.get('name', 'User')
                        avatar = idinfo.get('picture', '')
                        
                        cur.execute(
                            "SELECT id, phone, name, avatar, online, email FROM users WHERE google_id = %s",
                            (google_id,)
                        )
                        user = cur.fetchone()
                        
                        if not user:
                            cur.execute(
                                "INSERT INTO users (google_id, email, name, avatar, online) VALUES (%s, %s, %s, %s, true) RETURNING id, phone, name, avatar, online, email",
                                (google_id, email, name, avatar)
                            )
                            user = cur.fetchone()
                        else:
                            cur.execute(
                                "UPDATE users SET online = true, last_seen = NOW() WHERE id = %s RETURNING id, phone, name, avatar, online, email",
                                (user['id'],)
                            )
                            user = cur.fetchone()
                    except Exception as e:
                        return {
                            'statusCode': 401,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'isBase64Encoded': False,
                            'body': json.dumps({'error': f'Invalid Google token: {str(e)}'})
                        }
                elif phone:
                    cur.execute(
                        "SELECT id, phone, name, avatar, online, email FROM users WHERE phone = %s",
                        (phone,)
                    )
                    user = cur.fetchone()
                    
                    if not user:
                        cur.execute(
                            "INSERT INTO users (phone, name, online) VALUES (%s, %s, true) RETURNING id, phone, name, avatar, online, email",
                            (phone, name)
                        )
                        user = cur.fetchone()
                    else:
                        cur.execute(
                            "UPDATE users SET online = true, last_seen = NOW() WHERE id = %s RETURNING id, phone, name, avatar, online, email",
                            (user['id'],)
                        )
                        user = cur.fetchone()
                else:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': 'Phone or Google token required'})
                    }
                
                session_token = secrets.token_urlsafe(32)
                expires_at = datetime.now() + timedelta(days=30)
                
                cur.execute(
                    "INSERT INTO user_sessions (user_id, session_token, expires_at) VALUES (%s, %s, %s)",
                    (user['id'], session_token, expires_at)
                )
                
                conn.commit()
                
                user_data = {
                    'id': user['id'],
                    'phone': user['phone'],
                    'name': user['name'],
                    'avatar': user['avatar'],
                    'online': user['online'],
                    'email': user.get('email')
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
                        'token': session_token
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