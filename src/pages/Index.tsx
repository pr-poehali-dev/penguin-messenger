import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
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
};

type Chat = {
  id: string;
  name?: string;
  isGroup?: boolean;
  isGlobal?: boolean;
  user?: User;
  lastMessage: string;
  time: string;
  unread: number;
};

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState('');
  const [activeTab, setActiveTab] = useState('global');
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messageText, setMessageText] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [secretPhrase, setSecretPhrase] = useState('');
  const [fontSize, setFontSize] = useState(16);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [contacts, setContacts] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
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
      loadChats();
      loadContacts();
      loadGlobalMessages();
    }
  }, [isAuthenticated, currentUser]);

  useEffect(() => {
    if (selectedChat && currentUser && !selectedChat.isGlobal) {
      loadMessages(selectedChat.id);
    }
  }, [selectedChat, currentUser]);

  useEffect(() => {
    if (activeTab === 'favorites' && currentUser) {
      loadFavorites();
    }
  }, [activeTab, currentUser]);

  const loadGlobalMessages = async () => {
    if (!currentUser) return;
    setMessages([]);
  };

  const loadChats = async () => {
    if (!currentUser) return;
    try {
      const data = await api.chats.getAll(String(currentUser.id));
      setChats(data.chats || []);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить чаты',
        variant: 'destructive'
      });
    }
  };

  const loadContacts = async () => {
    if (!currentUser) return;
    try {
      const data = await api.contacts.getAll(String(currentUser.id));
      setContacts(data.contacts || []);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить контакты',
        variant: 'destructive'
      });
    }
  };

  const loadMessages = async (chatId: string) => {
    if (!currentUser) return;
    try {
      const data = await api.messages.getAll(String(currentUser.id), chatId);
      setMessages(data.messages || []);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить сообщения',
        variant: 'destructive'
      });
    }
  };

  const loadFavorites = async () => {
    if (!currentUser) return;
    try {
      const data = await api.favorites.getAll(String(currentUser.id));
      setFavorites(data.favorites || []);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить избранное',
        variant: 'destructive'
      });
    }
  };



  const handleGoogleLogin = async () => {
    if (!userName.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Введите ваше имя',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const randomPhone = `+7900${Math.floor(Math.random() * 10000000)}`;
      const data = await api.auth.login(randomPhone, userName);
      setCurrentUser({
        id: String(data.user.id),
        name: data.user.name,
        avatar: data.user.avatar,
        online: true
      });
      setIsAuthenticated(true);
      toast({
        title: 'Успешно!',
        description: `Добро пожаловать, ${data.user.name}!`
      });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось войти через Google',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (isVoice = false) => {
    if (!messageText.trim() && !isVoice) return;
    if (!currentUser) return;

    const chatId = selectedChat?.isGlobal || activeTab === 'global' ? '1' : selectedChat?.id || '1';
    
    try {
      const data = await api.messages.send(
        String(currentUser.id), 
        chatId, 
        messageText,
        isVoice,
        isVoice ? 5 : undefined
      );
      setMessages([...messages, data.message]);
      setMessageText('');
      await loadChats();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось отправить сообщение',
        variant: 'destructive'
      });
    }
  };

  const handleStartChat = async (contactId: string) => {
    if (!currentUser) return;
    
    try {
      const data = await api.chats.create(String(currentUser.id), contactId);
      await loadChats();
      setActiveTab('chats');
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать чат',
        variant: 'destructive'
      });
    }
  };

  const handleAddToFavorites = async (messageId: string) => {
    if (!currentUser) return;
    try {
      await api.favorites.add(String(currentUser.id), messageId);
      toast({
        title: 'Готово!',
        description: 'Сообщение добавлено в избранное'
      });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось добавить в избранное',
        variant: 'destructive'
      });
    }
  };

  const handleVoiceRecord = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      setTimeout(() => {
        setIsRecording(false);
        setMessageText('Голосовое сообщение');
        handleSendMessage(true);
      }, 2000);
    }
  };

  const checkSecretPhrase = () => {
    if (secretPhrase === 'Пингвин 25963') {
      setShowAdmin(true);
      setSecretPhrase('');
    }
  };

  const handleLogout = () => {
    api.auth.logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setChats([]);
    setContacts([]);
    setMessages([]);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md p-8 animate-fade-in border-border">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🐧</div>
            <h1 className="text-3xl font-bold text-gradient mb-2">ПингвинГрамм</h1>
            <p className="text-muted-foreground">пг!</p>
            <p className="text-sm text-muted-foreground mt-2">Secure Messaging</p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-foreground">Ваше имя</Label>
              <Input
                id="name"
                type="text"
                placeholder="Введите имя"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleGoogleLogin()}
                className="mt-1 bg-input border-border text-foreground"
              />
            </div>

            <Button
              className="w-full bg-gradient-primary hover:opacity-90 text-white flex items-center justify-center gap-2"
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              <Icon name="Chrome" size={20} />
              {isLoading ? 'Вход...' : 'Войти через Google'}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Ваша сессия будет сохранена в браузере
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex flex-col bg-background text-foreground"
      style={{ fontSize: `${fontSize}px` }}
    >
      <div className="bg-gradient-primary text-white p-4 shadow-lg">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🐧</div>
            <div>
              <h1 className="text-xl font-bold">ПингвинГрамм</h1>
              <p className="text-xs opacity-80">{currentUser?.name}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => setShowSettings(true)}
            >
              <Icon name="Settings" size={20} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={handleLogout}
            >
              <Icon name="LogOut" size={20} />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden max-w-7xl mx-auto w-full">
        <div className="w-full md:w-96 border-r border-border flex flex-col bg-card">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid grid-cols-4 w-full rounded-none border-b border-border bg-card">
              <TabsTrigger value="global" className="gap-1">
                <Icon name="Globe" size={16} />
                <span className="hidden sm:inline">Общий</span>
              </TabsTrigger>
              <TabsTrigger value="chats" className="gap-1">
                <Icon name="MessageSquare" size={16} />
                <span className="hidden sm:inline">Чаты</span>
              </TabsTrigger>
              <TabsTrigger value="contacts" className="gap-1">
                <Icon name="Users" size={16} />
                <span className="hidden sm:inline">Контакты</span>
              </TabsTrigger>
              <TabsTrigger value="favorites" className="gap-1">
                <Icon name="Star" size={16} />
                <span className="hidden sm:inline">Избранное</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="global" className="flex-1 m-0">
              <div className="flex flex-col h-[calc(100vh-180px)]">
                <div className="p-3 border-b border-border bg-muted/30">
                  <p className="text-sm text-muted-foreground">Общий чат для всех пользователей</p>
                </div>
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-3">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'} animate-fade-in`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                            msg.isOwn
                              ? 'message-bubble-own text-white'
                              : 'message-bubble-other'
                          }`}
                        >
                          {!msg.isOwn && msg.senderName && (
                            <p className="text-xs font-semibold mb-1 opacity-80">
                              {msg.senderName}
                            </p>
                          )}
                          {msg.isVoice ? (
                            <div className="flex items-center gap-2">
                              <Icon name="Mic" size={16} />
                              <span className="text-sm">Голосовое сообщение ({msg.voiceDuration}с)</span>
                            </div>
                          ) : (
                            <p>{msg.text}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <p className={`text-xs ${msg.isOwn ? 'text-white/70' : 'text-muted-foreground'}`}>
                              {msg.time}
                            </p>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              onClick={() => handleAddToFavorites(msg.id)}
                            >
                              <Icon name="Star" size={12} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="p-4 border-t border-border bg-card">
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className={isRecording ? 'bg-destructive text-white' : ''}
                      onClick={handleVoiceRecord}
                    >
                      <Icon name="Mic" size={18} />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Icon name="Image" size={18} />
                    </Button>
                    <Input
                      placeholder="Сообщение в общий чат..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1 bg-input border-border"
                      disabled={isRecording}
                    />
                    <Button 
                      size="icon" 
                      onClick={() => handleSendMessage()}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Icon name="Send" size={18} />
                    </Button>
                  </div>
                  {isRecording && (
                    <p className="text-xs text-destructive mt-2 animate-pulse">
                      Идёт запись голосового сообщения...
                    </p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="chats" className="flex-1 m-0">
              <ScrollArea className="h-[calc(100vh-180px)]">
                {chats.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground">
                    Нет чатов. Начните общение из раздела Контакты!
                  </div>
                )}
                {chats.map((chat) => (
                  <div
                    key={chat.id}
                    className="p-4 hover:bg-muted cursor-pointer border-b border-border transition-colors"
                    onClick={() => {
                      setSelectedChat(chat);
                      loadMessages(chat.id);
                    }}
                  >
                    <div className="flex gap-3">
                      <div className="relative">
                        <Avatar>
                          <AvatarFallback className="text-2xl bg-muted">{chat.user?.avatar || '🐧'}</AvatarFallback>
                        </Avatar>
                        {chat.user?.online && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-semibold truncate">{chat.name || chat.user?.name || 'Чат'}</p>
                          <span className="text-xs text-muted-foreground">{chat.time}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
                          {chat.unread > 0 && (
                            <Badge className="bg-primary ml-2">{chat.unread}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="contacts" className="flex-1 m-0">
              <ScrollArea className="h-[calc(100vh-180px)]">
                {contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="p-4 hover:bg-muted cursor-pointer border-b border-border transition-colors"
                  >
                    <div className="flex gap-3 items-center">
                      <div className="relative">
                        <Avatar>
                          <AvatarFallback className="text-2xl bg-muted">{contact.avatar}</AvatarFallback>
                        </Avatar>
                        {contact.online && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{contact.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {contact.online ? 'В сети' : 'Не в сети'}
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleStartChat(contact.id)}
                      >
                        <Icon name="MessageSquare" size={18} />
                      </Button>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="favorites" className="flex-1 m-0 p-4">
              <div className="space-y-4">
                <div className="border rounded-lg p-4 bg-muted/30 border-border">
                  <Label htmlFor="secret">Секретная фраза для админ-панели</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="secret"
                      type="password"
                      value={secretPhrase}
                      onChange={(e) => setSecretPhrase(e.target.value)}
                      placeholder="Введите секретную фразу"
                      className="bg-input border-border"
                    />
                    <Button onClick={checkSecretPhrase} className="bg-primary">
                      <Icon name="Key" size={18} />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  {favorites.length === 0 && (
                    <p className="text-muted-foreground text-center py-8">
                      Избранные сообщения появятся здесь
                    </p>
                  )}
                  {favorites.map((fav) => (
                    <Card key={fav.id} className="p-4 bg-card border-border">
                      <div className="flex gap-3">
                        <Avatar>
                          <AvatarFallback className="text-xl bg-muted">{fav.senderAvatar}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{fav.senderName}</p>
                          {fav.isVoice ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Icon name="Mic" size={14} />
                              <span>Голосовое ({fav.voiceDuration}с)</span>
                            </div>
                          ) : (
                            <p className="text-sm">{fav.text}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            Добавлено: {fav.favoritedAt}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {selectedChat && !selectedChat.isGlobal && (
          <div className="hidden md:flex flex-col flex-1 bg-background">
            <div className="p-4 border-b border-border bg-gradient-primary text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="text-2xl bg-white/20">{selectedChat.user?.avatar || '🐧'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{selectedChat.name || selectedChat.user?.name}</p>
                    <p className="text-xs opacity-80">
                      {selectedChat.user?.online ? 'В сети' : 'Не в сети'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                    <Icon name="Phone" size={18} />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                    <Icon name="Video" size={18} />
                  </Button>
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'} animate-fade-in`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                        msg.isOwn
                          ? 'message-bubble-own text-white'
                          : 'message-bubble-other'
                      }`}
                    >
                      {msg.isVoice ? (
                        <div className="flex items-center gap-2">
                          <Icon name="Mic" size={16} />
                          <span className="text-sm">Голосовое ({msg.voiceDuration}с)</span>
                        </div>
                      ) : (
                        <p>{msg.text}</p>
                      )}
                      <p className={`text-xs mt-1 ${msg.isOwn ? 'text-white/70' : 'text-muted-foreground'}`}>
                        {msg.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="icon"
                  className={isRecording ? 'bg-destructive text-white' : ''}
                  onClick={handleVoiceRecord}
                >
                  <Icon name="Mic" size={18} />
                </Button>
                <Button variant="ghost" size="icon">
                  <Icon name="Image" size={18} />
                </Button>
                <Button variant="ghost" size="icon">
                  <Icon name="Paperclip" size={18} />
                </Button>
                <Input
                  placeholder="Сообщение..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 bg-input border-border"
                  disabled={isRecording}
                />
                <Button onClick={() => handleSendMessage()} className="bg-gradient-primary">
                  <Icon name="Send" size={18} />
                </Button>
              </div>
            </div>
          </div>
        )}

        {!selectedChat && (
          <div className="hidden md:flex flex-1 items-center justify-center bg-background">
            <div className="text-center">
              <div className="text-6xl mb-4">🐧</div>
              <p className="text-xl font-semibold mb-2">ПингвинГрамм</p>
              <p className="text-muted-foreground">Выберите чат или начните общение в общем чате</p>
            </div>
          </div>
        )}
      </div>

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Настройки</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Размер текста</Label>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">А</span>
                <Slider
                  value={[fontSize]}
                  onValueChange={(value) => setFontSize(value[0])}
                  min={12}
                  max={24}
                  step={1}
                  className="flex-1"
                />
                <span className="text-lg text-muted-foreground">А</span>
              </div>
              <p className="text-xs text-muted-foreground">Текущий размер: {fontSize}px</p>
            </div>

            <div className="space-y-2">
              <Label>Приватность</Label>
              <div className="flex items-center justify-between">
                <span className="text-sm">Показывать статус "В сети"</span>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Читать уведомления</span>
                <Switch defaultChecked />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAdmin} onOpenChange={setShowAdmin}>
        <DialogContent className="max-w-2xl bg-card border-border">
          <DialogHeader>
            <DialogTitle>Админ-панель 🔐</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Доступ к системным данным пользователей
            </p>
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {contacts.map((contact) => (
                  <Card key={contact.id} className="p-4 bg-card border-border">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="text-2xl bg-muted">{contact.avatar}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold">{contact.name}</p>
                        <p className="text-xs text-muted-foreground">ID: {contact.id}</p>
                        <p className="text-xs text-muted-foreground">
                          Телефон: {(contact as any).phone || 'Не указан'}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" className="border-border">
                        <Icon name="MessageSquare" size={14} className="mr-1" />
                        Сообщения
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;