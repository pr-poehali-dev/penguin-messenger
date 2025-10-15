import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Получение списка чатов пользователя
    Args: event - dict с httpMethod, queryStringParameters
          context - object с атрибутами request_id, function_name
    Returns: HTTP response dict со списком чатов
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
                    SELECT DISTINCT
                        c.id,
                        c.name,
                        c.is_group,
                        c.is_global,
                        (
                            SELECT u2.id 
                            FROM chat_members cm2 
                            JOIN users u2 ON cm2.user_id = u2.id
                            WHERE cm2.chat_id = c.id AND cm2.user_id != %s
                            LIMIT 1
                        ) as other_user_id,
                        (
                            SELECT u2.name 
                            FROM chat_members cm2 
                            JOIN users u2 ON cm2.user_id = u2.id
                            WHERE cm2.chat_id = c.id AND cm2.user_id != %s
                            LIMIT 1
                        ) as other_user_name,
                        (
                            SELECT u2.avatar 
                            FROM chat_members cm2 
                            JOIN users u2 ON cm2.user_id = u2.id
                            WHERE cm2.chat_id = c.id AND cm2.user_id != %s
                            LIMIT 1
                        ) as other_user_avatar,
                        (
                            SELECT u2.online 
                            FROM chat_members cm2 
                            JOIN users u2 ON cm2.user_id = u2.id
                            WHERE cm2.chat_id = c.id AND cm2.user_id != %s
                            LIMIT 1
                        ) as other_user_online,
                        (
                            SELECT m.text
                            FROM messages m
                            WHERE m.chat_id = c.id
                            ORDER BY m.created_at DESC
                            LIMIT 1
                        ) as last_message,
                        (
                            SELECT m.created_at
                            FROM messages m
                            WHERE m.chat_id = c.id
                            ORDER BY m.created_at DESC
                            LIMIT 1
                        ) as last_message_time
                    FROM chats c
                    JOIN chat_members cm ON c.id = cm.chat_id
                    WHERE cm.user_id = %s
                    ORDER BY last_message_time DESC NULLS LAST
                ''', (user_id, user_id, user_id, user_id, user_id))
                
                chats = cur.fetchall()
                
                result = []
                for chat in chats:
                    result.append({
                        'id': chat['id'],
                        'name': chat['name'] or chat['other_user_name'] or 'Чат',
                        'isGroup': chat['is_group'],
                        'isGlobal': chat['is_global'],
                        'user': {
                            'id': chat['other_user_id'],
                            'name': chat['other_user_name'],
                            'avatar': chat['other_user_avatar'],
                            'online': chat['other_user_online']
                        } if not chat['is_group'] else None,
                        'lastMessage': chat['last_message'] or '',
                        'time': chat['last_message_time'].strftime('%H:%M') if chat['last_message_time'] else '',
                        'unread': 0
                    })
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps({'chats': result})
                }
        
        if method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            user_id = event.get('headers', {}).get('x-user-id')
            contact_id = body_data.get('contactId')
            is_group = body_data.get('isGroup', False)
            group_name = body_data.get('groupName', '')
            group_avatar = body_data.get('groupAvatar', '')
            member_ids = body_data.get('memberIds', [])
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                if is_group:
                    cur.execute(
                        'INSERT INTO chats (is_group, group_name, group_avatar) VALUES (true, %s, %s) RETURNING id',
                        (group_name, group_avatar)
                    )
                    new_chat = cur.fetchone()
                    chat_id = new_chat['id']
                    
                    cur.execute(
                        'INSERT INTO chat_members (chat_id, user_id) VALUES (%s, %s)',
                        (chat_id, user_id)
                    )
                    
                    for member_id in member_ids:
                        if member_id != int(user_id):
                            cur.execute(
                                'INSERT INTO chat_members (chat_id, user_id) VALUES (%s, %s)',
                                (chat_id, member_id)
                            )
                    
                    conn.commit()
                    
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'isBase64Encoded': False,
                        'body': json.dumps({'chatId': chat_id, 'groupName': group_name})
                    }
                else:
                    cur.execute('''
                        SELECT c.id 
                        FROM chats c
                        JOIN chat_members cm1 ON c.id = cm1.chat_id
                        JOIN chat_members cm2 ON c.id = cm2.chat_id
                        WHERE cm1.user_id = %s 
                        AND cm2.user_id = %s 
                        AND c.is_group = false
                        LIMIT 1
                    ''', (user_id, contact_id))
                    
                    existing_chat = cur.fetchone()
                    
                    if existing_chat:
                        return {
                            'statusCode': 200,
                            'headers': {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*'
                            },
                            'isBase64Encoded': False,
                            'body': json.dumps({'chatId': existing_chat['id']})
                        }
                    
                    cur.execute('INSERT INTO chats (is_group) VALUES (false) RETURNING id')
                    new_chat = cur.fetchone()
                    chat_id = new_chat['id']
                    
                    cur.execute(
                        'INSERT INTO chat_members (chat_id, user_id) VALUES (%s, %s), (%s, %s)',
                        (chat_id, user_id, chat_id, contact_id)
                    )
                    
                    conn.commit()
                    
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'isBase64Encoded': False,
                        'body': json.dumps({'chatId': chat_id})
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