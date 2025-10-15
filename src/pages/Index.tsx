import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';

type User = {
  id: string;
  name: string;
  avatar: string;
  online: boolean;
};

type Message = {
  id: string;
  senderId: string;
  text: string;
  time: string;
  isOwn: boolean;
};

type Chat = {
  id: string;
  user: User;
  lastMessage: string;
  time: string;
  unread: number;
};

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [phone, setPhone] = useState('');
  const [activeTab, setActiveTab] = useState('chats');
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messageText, setMessageText] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [secretPhrase, setSecretPhrase] = useState('');
  const [fontSize, setFontSize] = useState(16);
  const [darkMode, setDarkMode] = useState(false);

  const currentUser: User = {
    id: '1',
    name: 'Вы',
    avatar: '🐧',
    online: true
  };

  const mockChats: Chat[] = [
    {
      id: '1',
      user: { id: '2', name: 'Александр', avatar: '🐧', online: true },
      lastMessage: 'Привет! Как дела?',
      time: '12:34',
      unread: 2
    },
    {
      id: '2',
      user: { id: '3', name: 'Мария', avatar: '🐧', online: false },
      lastMessage: 'Спасибо за помощь!',
      time: '11:20',
      unread: 0
    },
    {
      id: '3',
      user: { id: '4', name: 'Дмитрий', avatar: '🐧', online: true },
      lastMessage: 'Созвонимся сегодня?',
      time: '10:15',
      unread: 1
    }
  ];

  const mockContacts: User[] = [
    { id: '2', name: 'Александр', avatar: '🐧', online: true },
    { id: '3', name: 'Мария', avatar: '🐧', online: false },
    { id: '4', name: 'Дмитрий', avatar: '🐧', online: true },
    { id: '5', name: 'Анна', avatar: '🐧', online: true }
  ];

  const mockMessages: Message[] = [
    { id: '1', senderId: '2', text: 'Привет!', time: '12:30', isOwn: false },
    { id: '2', senderId: '1', text: 'Привет! Как дела?', time: '12:31', isOwn: true },
    { id: '3', senderId: '2', text: 'Отлично, спасибо!', time: '12:32', isOwn: false },
    { id: '4', senderId: '1', text: 'Рад слышать 😊', time: '12:33', isOwn: true }
  ];

  const mockGlobalChat: Message[] = [
    { id: '1', senderId: '2', text: 'Всем привет в общем чате!', time: '10:00', isOwn: false },
    { id: '2', senderId: '3', text: 'Приветствую всех! 👋', time: '10:05', isOwn: false },
    { id: '3', senderId: '1', text: 'Здравствуйте!', time: '10:10', isOwn: true }
  ];

  const handleLogin = () => {
    if (phone.length >= 10) {
      setIsAuthenticated(true);
    }
  };

  const handleGoogleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleSendMessage = () => {
    if (messageText.trim()) {
      setMessageText('');
    }
  };

  const checkSecretPhrase = () => {
    if (secretPhrase === 'Пингвин 25963') {
      setShowAdmin(true);
      setSecretPhrase('');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-primary p-4">
        <Card className="w-full max-w-md p-8 animate-fade-in">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🐧</div>
            <h1 className="text-3xl font-bold text-gradient mb-2">ПингвинГрамм</h1>
            <p className="text-muted-foreground">пг!</p>
            <p className="text-sm text-muted-foreground mt-2">Secure Messaging</p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="phone">Номер телефона</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+7 (___) ___-__-__"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1"
              />
            </div>

            <Button 
              className="w-full bg-gradient-primary hover:opacity-90"
              onClick={handleLogin}
            >
              Войти
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">или</span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={handleGoogleLogin}
            >
              <Icon name="Chrome" className="mr-2" size={18} />
              Войти через Google
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div 
      className={`min-h-screen flex flex-col ${darkMode ? 'dark' : ''}`}
      style={{ fontSize: `${fontSize}px` }}
    >
      <div className="bg-gradient-primary text-white p-4 shadow-lg">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🐧</div>
            <div>
              <h1 className="text-xl font-bold">ПингвинГрамм</h1>
              <p className="text-xs opacity-80">пг!</p>
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
            >
              <Icon name="User" size={20} />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden max-w-6xl mx-auto w-full">
        <div className="w-full md:w-96 border-r flex flex-col bg-background">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid grid-cols-4 w-full rounded-none border-b">
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
              <TabsTrigger value="global" className="gap-1">
                <Icon name="Globe" size={16} />
                <span className="hidden sm:inline">Общий</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chats" className="flex-1 m-0">
              <ScrollArea className="h-[calc(100vh-180px)]">
                {mockChats.map((chat) => (
                  <div
                    key={chat.id}
                    className="p-4 hover:bg-muted cursor-pointer border-b transition-colors"
                    onClick={() => setSelectedChat(chat)}
                  >
                    <div className="flex gap-3">
                      <div className="relative">
                        <Avatar>
                          <AvatarFallback className="text-2xl">{chat.user.avatar}</AvatarFallback>
                        </Avatar>
                        {chat.user.online && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-semibold truncate">{chat.user.name}</p>
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
                {mockContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="p-4 hover:bg-muted cursor-pointer border-b transition-colors"
                  >
                    <div className="flex gap-3 items-center">
                      <div className="relative">
                        <Avatar>
                          <AvatarFallback className="text-2xl">{contact.avatar}</AvatarFallback>
                        </Avatar>
                        {contact.online && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{contact.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {contact.online ? 'В сети' : 'Не в сети'}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon">
                        <Icon name="MessageSquare" size={18} />
                      </Button>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="favorites" className="flex-1 m-0 p-4">
              <div className="space-y-4">
                <p className="text-muted-foreground text-center py-8">
                  Избранные сообщения появятся здесь
                </p>
                <div className="border rounded-lg p-4 bg-muted/30">
                  <Label htmlFor="secret">Секретная фраза</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="secret"
                      type="password"
                      value={secretPhrase}
                      onChange={(e) => setSecretPhrase(e.target.value)}
                      placeholder="Введите секретную фразу"
                    />
                    <Button onClick={checkSecretPhrase}>
                      <Icon name="Key" size={18} />
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="global" className="flex-1 m-0">
              <div className="flex flex-col h-[calc(100vh-180px)]">
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {mockGlobalChat.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                            msg.isOwn
                              ? 'bg-gradient-primary text-white'
                              : 'bg-muted'
                          }`}
                        >
                          {!msg.isOwn && (
                            <p className="text-xs font-semibold mb-1 opacity-70">
                              Пользователь {msg.senderId}
                            </p>
                          )}
                          <p>{msg.text}</p>
                          <p className={`text-xs mt-1 ${msg.isOwn ? 'text-white/70' : 'text-muted-foreground'}`}>
                            {msg.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Сообщение в общий чат..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <Button size="icon" onClick={handleSendMessage}>
                      <Icon name="Send" size={18} />
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {selectedChat && (
          <div className="hidden md:flex flex-col flex-1 bg-background">
            <div className="p-4 border-b bg-gradient-primary text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="text-2xl bg-white/20">{selectedChat.user.avatar}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{selectedChat.user.name}</p>
                    <p className="text-xs opacity-80">
                      {selectedChat.user.online ? 'В сети' : 'Не в сети'}
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
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                    <Icon name="MoreVertical" size={18} />
                  </Button>
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {mockMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'} animate-fade-in`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                        msg.isOwn
                          ? 'bg-gradient-primary text-white'
                          : 'bg-muted'
                      }`}
                    >
                      <p>{msg.text}</p>
                      <p className={`text-xs mt-1 ${msg.isOwn ? 'text-white/70' : 'text-muted-foreground'}`}>
                        {msg.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Button variant="ghost" size="icon">
                  <Icon name="Paperclip" size={18} />
                </Button>
                <Button variant="ghost" size="icon">
                  <Icon name="Image" size={18} />
                </Button>
                <Button variant="ghost" size="icon">
                  <Icon name="Mic" size={18} />
                </Button>
                <Input
                  placeholder="Сообщение..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1"
                />
                <Button onClick={handleSendMessage} className="bg-gradient-primary">
                  <Icon name="Send" size={18} />
                </Button>
              </div>
            </div>
          </div>
        )}

        {!selectedChat && (
          <div className="hidden md:flex flex-1 items-center justify-center bg-muted/20">
            <div className="text-center">
              <div className="text-6xl mb-4">🐧</div>
              <p className="text-xl font-semibold mb-2">ПингвинГрамм</p>
              <p className="text-muted-foreground">Выберите чат для начала общения</p>
            </div>
          </div>
        )}
      </div>

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
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

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="dark-mode">Тёмная тема</Label>
                <p className="text-xs text-muted-foreground">Переключение между светлой и тёмной темой</p>
              </div>
              <Switch
                id="dark-mode"
                checked={darkMode}
                onCheckedChange={setDarkMode}
              />
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Админ-панель 🔐</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Доступ к системным данным пользователей
            </p>
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {mockContacts.map((contact) => (
                  <Card key={contact.id} className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="text-2xl">{contact.avatar}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold">{contact.name}</p>
                        <p className="text-xs text-muted-foreground">ID: {contact.id}</p>
                        <p className="text-xs text-muted-foreground">Телефон: +7 900 000 00 0{contact.id}</p>
                      </div>
                      <Button variant="outline" size="sm">
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
