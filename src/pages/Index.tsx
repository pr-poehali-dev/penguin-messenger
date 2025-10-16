import { useState, useEffect, useRef } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

type User = {
  id: string;
  name: string;
  avatar: string;
  online: boolean;
};

type Message = {
  id: string;
  senderId: string;
  senderName?: string;
  text: string;
  time: string;
  isOwn: boolean;
  isVoice?: boolean;
  voiceDuration?: number;
  mediaUrl?: string;
  mediaType?: string;
};

type Channel = {
  id: string;
  name: string;
  isPublic: boolean;
  members?: number;
  lastMessage?: string;
};

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingInterval, setRecordingInterval] = useState<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const session = api.auth.loadSession();
    if (session) {
      setCurrentUser({
        id: String(session.user.id),
        name: session.user.name,
        avatar: session.user.avatar,
        online: true
      });
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      loadChannels();
    }
  }, [isAuthenticated, currentUser]);

  useEffect(() => {
    if (selectedChannel) {
      loadMessages(selectedChannel.id);
      const interval = setInterval(() => {
        loadMessages(selectedChannel.id);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedChannel]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadChannels = async () => {
    if (!currentUser) return;
    try {
      const data = await api.chats.getAll(String(currentUser.id));
      const channelList: Channel[] = (data.chats || []).map((chat: any) => ({
        id: chat.id,
        name: chat.name || chat.user?.name || 'Канал',
        isPublic: chat.isGroup || false,
        members: chat.members || 2,
        lastMessage: chat.lastMessage
      }));
      
      const globalChannel: Channel = {
        id: '1',
        name: '# общий',
        isPublic: true,
        members: 100
      };
      
      setChannels([globalChannel, ...channelList]);
      
      if (!selectedChannel) {
        setSelectedChannel(globalChannel);
      }
    } catch (error) {
      console.error('Failed to load channels:', error);
    }
  };

  const loadMessages = async (channelId: string) => {
    if (!currentUser) return;
    try {
      const data = await api.messages.getAll(String(currentUser.id), channelId);
      const messagesList = (data.messages || []).map((msg: any) => ({
        id: msg.id || String(Date.now()),
        senderId: String(msg.sender_id || msg.senderId),
        senderName: msg.sender_name || msg.senderName,
        text: msg.text || msg.content || '',
        time: msg.created_at || msg.time || new Date().toLocaleTimeString(),
        isOwn: String(msg.sender_id || msg.senderId) === String(currentUser.id),
        isVoice: msg.is_voice || msg.isVoice || false,
        voiceDuration: msg.voice_duration || msg.voiceDuration,
        mediaUrl: msg.media_url || msg.mediaUrl,
        mediaType: msg.media_type || msg.mediaType
      }));
      setMessages(messagesList);
    } catch (error) {
      console.error('Failed to load messages:', error);
      setMessages([]);
    }
  };

  const handleLogin = async () => {
    if (!userName.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Введите ваше имя',
        variant: 'destructive'
      });
      return;
    }
    
    if (!userPhone.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Введите номер телефона',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const data = await api.auth.login(userPhone, userName);
      setCurrentUser({
        id: String(data.user.id),
        name: data.user.name,
        avatar: data.user.avatar,
        online: true
      });
      setIsAuthenticated(true);
      toast({
        title: 'Добро пожаловать!',
        description: `Привет, ${data.user.name}!`
      });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось войти',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !currentUser || !selectedChannel) return;

    try {
      const tempMessage: Message = {
        id: String(Date.now()),
        senderId: currentUser.id,
        senderName: currentUser.name,
        text: messageText,
        time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        isOwn: true
      };
      
      setMessages(prev => [...prev, tempMessage]);
      const text = messageText;
      setMessageText('');

      await api.messages.send(
        String(currentUser.id),
        selectedChannel.id,
        text,
        false
      );

      setTimeout(() => loadMessages(selectedChannel.id), 500);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось отправить сообщение',
        variant: 'destructive'
      });
    }
  };

  const handleVoiceRecord = async () => {
    if (isRecording) {
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        if (recordingInterval) {
          clearInterval(recordingInterval);
          setRecordingInterval(null);
        }
      }
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        
        reader.onloadend = async () => {
          const base64 = reader.result?.toString().split(',')[1];
          if (!base64 || !currentUser || !selectedChannel) return;
          
          try {
            await api.messages.send(
              String(currentUser.id),
              selectedChannel.id,
              '',
              true,
              recordingTime,
              `data:audio/webm;base64,${base64}`,
              'audio'
            );
            
            toast({
              title: 'Отправлено!',
              description: 'Голосовое сообщение отправлено'
            });
            
            setTimeout(() => loadMessages(selectedChannel.id), 500);
          } catch (error) {
            toast({
              title: 'Ошибка',
              description: 'Не удалось отправить',
              variant: 'destructive'
            });
          }
        };
        
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
        setRecordingTime(0);
        setIsRecording(false);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      
      let time = 0;
      const interval = setInterval(() => {
        time += 1;
        setRecordingTime(time);
      }, 1000);
      setRecordingInterval(interval);
      
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось получить доступ к микрофону',
        variant: 'destructive'
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser || !selectedChannel) return;
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result?.toString().split(',')[1];
      if (!base64) return;
      
      const mediaType = file.type.startsWith('image/') ? 'image' : 
                        file.type.startsWith('video/') ? 'video' : 'file';
      
      try {
        await api.messages.send(
          String(currentUser.id),
          selectedChannel.id,
          file.name,
          false,
          undefined,
          `data:${file.type};base64,${base64}`,
          mediaType
        );
        
        toast({
          title: 'Успешно!',
          description: 'Файл отправлен'
        });
        
        setTimeout(() => loadMessages(selectedChannel.id), 500);
      } catch (error) {
        toast({
          title: 'Ошибка',
          description: 'Не удалось отправить файл',
          variant: 'destructive'
        });
      }
    };
    
    reader.readAsDataURL(file);
  };

  const handleCreateChannel = async () => {
    if (!currentUser || !newChannelName.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Введите название канала',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      await api.chats.createGroup(String(currentUser.id), newChannelName, []);
      toast({
        title: 'Успешно!',
        description: `Канал "${newChannelName}" создан`
      });
      setShowCreateChannel(false);
      setNewChannelName('');
      await loadChannels();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать канал',
        variant: 'destructive'
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#313338' }}>
        <Card className="w-full max-w-md p-8" style={{ background: '#2b2d31', border: 'none' }}>
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🐧</div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#f2f3f5' }}>ПингвинГрамм</h1>
            <p style={{ color: '#b5bac1' }}>Добро пожаловать!</p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name" style={{ color: '#b5bac1' }}>Имя</Label>
              <Input
                id="name"
                type="text"
                placeholder="Введите имя"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                style={{ background: '#1e1f22', border: 'none', color: '#f2f3f5' }}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="phone" style={{ color: '#b5bac1' }}>Телефон</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+7 900 000 00 00"
                value={userPhone}
                onChange={(e) => setUserPhone(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                style={{ background: '#1e1f22', border: 'none', color: '#f2f3f5' }}
                className="mt-1"
              />
            </div>

            <Button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full"
              style={{ background: '#5865f2', color: 'white' }}
            >
              {isLoading ? 'Вход...' : 'Войти'}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen" style={{ background: '#313338' }}>
      <div className="w-72 flex flex-col" style={{ background: '#2b2d31' }}>
        <div className="p-4 border-b" style={{ borderColor: '#1e1f22' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg" style={{ color: '#f2f3f5' }}>Каналы</h2>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setShowCreateChannel(true)}
              style={{ color: '#b5bac1' }}
            >
              <Icon name="Plus" size={20} />
            </Button>
          </div>
          <div className="flex items-center gap-2 p-2 rounded" style={{ background: '#1e1f22' }}>
            <Avatar className="w-8 h-8">
              <AvatarFallback style={{ background: '#5865f2' }}>
                {currentUser?.avatar || '🐧'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: '#f2f3f5' }}>
                {currentUser?.name}
              </p>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-xs" style={{ color: '#b5bac1' }}>В сети</span>
              </div>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1">
          {channels.map((channel) => (
            <div
              key={channel.id}
              onClick={() => setSelectedChannel(channel)}
              className="px-3 py-2 mx-2 rounded cursor-pointer transition-colors"
              style={{
                background: selectedChannel?.id === channel.id ? '#404249' : 'transparent',
                color: selectedChannel?.id === channel.id ? '#fff' : '#b5bac1'
              }}
            >
              <div className="flex items-center gap-2">
                <Icon name={channel.isPublic ? 'Hash' : 'Lock'} size={16} />
                <span className="font-medium">{channel.name}</span>
              </div>
              {channel.lastMessage && (
                <p className="text-xs truncate mt-1" style={{ color: '#80848e' }}>
                  {channel.lastMessage}
                </p>
              )}
            </div>
          ))}
        </ScrollArea>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedChannel ? (
          <>
            <div className="h-16 px-4 flex items-center border-b" style={{ borderColor: '#1e1f22' }}>
              <Icon name={selectedChannel.isPublic ? 'Hash' : 'Lock'} size={20} style={{ color: '#b5bac1' }} />
              <h2 className="ml-2 font-bold text-lg" style={{ color: '#f2f3f5' }}>
                {selectedChannel.name}
              </h2>
              {selectedChannel.members && (
                <span className="ml-auto text-sm" style={{ color: '#b5bac1' }}>
                  <Icon name="Users" size={16} className="inline mr-1" />
                  {selectedChannel.members}
                </span>
              )}
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className="flex gap-3 hover:bg-black/10 p-2 rounded">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback style={{ background: '#5865f2' }}>
                        {msg.senderName?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm" style={{ color: '#f2f3f5' }}>
                          {msg.senderName || 'Пользователь'}
                        </span>
                        <span className="text-xs" style={{ color: '#80848e' }}>
                          {msg.time}
                        </span>
                      </div>
                      {msg.isVoice ? (
                        <div className="flex items-center gap-2 p-2 rounded" style={{ background: '#2b2d31' }}>
                          <Icon name="Mic" size={16} style={{ color: '#b5bac1' }} />
                          <span className="text-sm" style={{ color: '#b5bac1' }}>
                            Голосовое сообщение ({msg.voiceDuration}с)
                          </span>
                        </div>
                      ) : msg.mediaUrl && msg.mediaType === 'image' ? (
                        <img 
                          src={msg.mediaUrl} 
                          alt={msg.text}
                          className="max-w-md rounded"
                        />
                      ) : (
                        <p style={{ color: '#dbdee1' }}>{msg.text}</p>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <div className="p-4">
              {isRecording && (
                <div className="mb-2 flex items-center gap-2 text-sm" style={{ color: '#ed4245' }}>
                  <Icon name="Mic" size={16} />
                  <span>Запись... {recordingTime}с</span>
                  <Button size="sm" variant="ghost" onClick={handleVoiceRecord}>
                    Остановить
                  </Button>
                </div>
              )}
              <div className="flex gap-2 items-center p-2 rounded" style={{ background: '#383a40' }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept="image/*,video/*"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ color: '#b5bac1' }}
                >
                  <Icon name="Plus" size={20} />
                </Button>
                <Input
                  placeholder={`Сообщение в ${selectedChannel.name}`}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  disabled={isRecording}
                  style={{ background: 'transparent', border: 'none', color: '#f2f3f5' }}
                  className="flex-1"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleVoiceRecord}
                  style={{ color: isRecording ? '#ed4245' : '#b5bac1' }}
                >
                  <Icon name="Mic" size={20} />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p style={{ color: '#b5bac1' }}>Выберите канал</p>
          </div>
        )}
      </div>

      <Dialog open={showCreateChannel} onOpenChange={setShowCreateChannel}>
        <DialogContent style={{ background: '#2b2d31', border: 'none' }}>
          <DialogHeader>
            <DialogTitle style={{ color: '#f2f3f5' }}>Создать канал</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="channel-name" style={{ color: '#b5bac1' }}>Название канала</Label>
              <Input
                id="channel-name"
                placeholder="например: игры"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                style={{ background: '#1e1f22', border: 'none', color: '#f2f3f5' }}
                className="mt-1"
              />
            </div>
            <Button
              onClick={handleCreateChannel}
              className="w-full"
              style={{ background: '#5865f2', color: 'white' }}
              disabled={!newChannelName.trim()}
            >
              Создать
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
