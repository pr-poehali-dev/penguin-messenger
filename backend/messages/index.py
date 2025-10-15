import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Получение и отправка сообщений в чатах
    Args: event - dict с httpMethod, body, queryStringParameters
          context - object с атрибутами request_id, function_name
    Returns: HTTP response dict со списком сообщений
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
            params = event.get('queryStringParameters', {})
            chat_id = params.get('chat_id')
            user_id = event.get('headers', {}).get('x-user-id')
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute('''
                    SELECT 
                        m.id,
                        m.chat_id,
                        m.sender_id,
                        m.text,
                        m.media_url,
                        m.media_type,
                        m.created_at,
                        u.name as sender_name,
                        u.avatar as sender_avatar
                    FROM messages m
                    JOIN users u ON m.sender_id = u.id
                    WHERE m.chat_id = %s
                    ORDER BY m.created_at ASC
                ''', (chat_id,))
                
                messages = cur.fetchall()
                
                result = []
                for msg in messages:
                    result.append({
                        'id': msg['id'],
                        'chatId': msg['chat_id'],
                        'senderId': msg['sender_id'],
                        'senderName': msg['sender_name'],
                        'senderAvatar': msg['sender_avatar'],
                        'text': msg['text'],
                        'mediaUrl': msg['media_url'],
                        'mediaType': msg['media_type'],
                        'time': msg['created_at'].strftime('%H:%M'),
                        'isOwn': str(msg['sender_id']) == str(user_id)
                    })
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps({'messages': result})
                }
        
        if method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            chat_id = body_data.get('chatId')
            sender_id = event.get('headers', {}).get('x-user-id')
            text = body_data.get('text', '')
            media_url = body_data.get('mediaUrl')
            media_type = body_data.get('mediaType')
            is_voice = body_data.get('isVoice', False)
            voice_duration = body_data.get('voiceDuration')
            media_file = body_data.get('mediaFile')
            
            if media_file and not media_url:
                import uuid
                file_id = str(uuid.uuid4())
                media_url = f"data:{media_type};base64,{media_file}"
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute('''
                    INSERT INTO messages (chat_id, sender_id, text, media_url, media_type, is_voice, voice_duration)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    RETURNING *
                ''', (chat_id, sender_id, text, media_url, media_type, is_voice, voice_duration))
                
                message = cur.fetchone()
                conn.commit()
                
                cur.execute('SELECT name, avatar FROM users WHERE id = %s', (sender_id,))
                user = cur.fetchone()
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps({
                        'message': {
                            'id': message['id'],
                            'chatId': message['chat_id'],
                            'senderId': message['sender_id'],
                            'senderName': user['name'],
                            'senderAvatar': user['avatar'],
                            'text': message['text'],
                            'mediaUrl': message['media_url'],
                            'mediaType': message['media_type'],
                            'time': message['created_at'].strftime('%H:%M'),
                            'isOwn': True
                        }
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