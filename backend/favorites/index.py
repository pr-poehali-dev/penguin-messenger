import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Управление избранными сообщениями
    Args: event - dict с httpMethod, body, queryStringParameters
          context - object с атрибутами request_id, function_name
    Returns: HTTP response dict со списком избранных сообщений
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    database_url = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(database_url)
    
    try:
        user_id = event.get('headers', {}).get('x-user-id')
        
        if method == 'GET':
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute('''
                    SELECT 
                        m.id,
                        m.chat_id,
                        m.sender_id,
                        m.text,
                        m.media_url,
                        m.media_type,
                        m.is_voice,
                        m.voice_duration,
                        m.created_at,
                        u.name as sender_name,
                        u.avatar as sender_avatar,
                        f.created_at as favorited_at
                    FROM favorites f
                    JOIN messages m ON f.message_id = m.id
                    JOIN users u ON m.sender_id = u.id
                    WHERE f.user_id = %s
                    ORDER BY f.created_at DESC
                ''', (user_id,))
                
                favorites = cur.fetchall()
                
                result = []
                for fav in favorites:
                    result.append({
                        'id': fav['id'],
                        'chatId': fav['chat_id'],
                        'senderId': fav['sender_id'],
                        'senderName': fav['sender_name'],
                        'senderAvatar': fav['sender_avatar'],
                        'text': fav['text'],
                        'mediaUrl': fav['media_url'],
                        'mediaType': fav['media_type'],
                        'isVoice': fav['is_voice'],
                        'voiceDuration': fav['voice_duration'],
                        'time': fav['created_at'].strftime('%H:%M'),
                        'favoritedAt': fav['favorited_at'].strftime('%d.%m.%Y %H:%M')
                    })
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps({'favorites': result})
                }
        
        if method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            message_id = body_data.get('messageId')
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    'INSERT INTO favorites (user_id, message_id) VALUES (%s, %s) ON CONFLICT DO NOTHING',
                    (user_id, message_id)
                )
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps({'success': True})
                }
        
        if method == 'DELETE':
            params = event.get('queryStringParameters', {})
            message_id = params.get('message_id')
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    'DELETE FROM favorites WHERE user_id = %s AND message_id = %s',
                    (user_id, message_id)
                )
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps({'success': True})
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
