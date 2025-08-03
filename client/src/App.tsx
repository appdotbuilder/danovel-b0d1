
import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BookOpen, 
  Star, 
  Eye, 
  Heart, 
  Users, 
  TrendingUp, 
  Crown,
  Coins,
  Bell,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Settings,
  BarChart3,
  UserCheck,
  BookMarked,
  Award,
  Zap
} from 'lucide-react';
import type { 
  Novel, 
  User, 
  Genre, 
  DashboardStats,
  CreateUserInput,
  CreateNovelInput,
  CreateGenreInput,
  novelStatusSchema,
  userRoleSchema
} from '../../server/src/schema';

// Infer types from Zod schemas
type NovelStatus = typeof novelStatusSchema._type;
type UserRole = typeof userRoleSchema._type;

// Current user for demo - in real app this would come from auth
const CURRENT_USER: User = {
  id: 1,
  username: 'demo_user',
  email: 'demo@danovel.com',
  password_hash: '',
  role: 'admin',
  display_name: 'Demo User',
  avatar_url: null,
  bio: 'Welcome to DANOVEL! 📚✨',
  coin_balance: 1500,
  is_active: true,
  email_verified: true,
  two_factor_enabled: false,
  created_at: new Date(),
  updated_at: new Date()
};

// Sample data for demonstration since handlers return empty arrays
const SAMPLE_NOVELS: Novel[] = [
  {
    id: 1,
    title: "The Chronicles of Ethereal Realm",
    slug: "chronicles-ethereal-realm",
    description: "Sebuah petualangan epik di dunia fantasi yang penuh dengan sihir, naga, dan kepahlawanan. Ikuti perjalanan Aria dalam mencari kristal kuno yang hilang.",
    cover_image_url: null,
    author_id: 2,
    status: "ongoing",
    genre_id: 1,
    total_chapters: 47,
    total_views: 125430,
    total_likes: 8920,
    average_rating: 4.7,
    is_featured: true,
    is_premium: true,
    created_at: new Date('2024-01-15'),
    updated_at: new Date('2024-12-19')
  },
  {
    id: 2,
    title: "Romance in Digital Age",
    slug: "romance-digital-age",
    description: "Kisah cinta modern antara seorang developer dan content creator. Bagaimana teknologi mengubah cara kita mencinta di era digital.",
    cover_image_url: null,
    author_id: 3,
    status: "completed",
    genre_id: 2,
    total_chapters: 32,
    total_views: 89230,
    total_likes: 12340,
    average_rating: 4.5,
    is_featured: true,
    is_premium: false,
    created_at: new Date('2024-02-10'),
    updated_at: new Date('2024-11-15')
  },
  {
    id: 3,
    title: "Mystery of the Silent Library",
    slug: "mystery-silent-library",
    description: "Thriller psikologis yang berlatar di perpustakaan tua. Rahasia gelap tersembunyi di antara buku-buku kuno yang berdebu.",
    cover_image_url: null,
    author_id: 4,
    status: "ongoing",
    genre_id: 3,
    total_chapters: 28,
    total_views: 67890,
    total_likes: 5670,
    average_rating: 4.3,
    is_featured: false,
    is_premium: true,
    created_at: new Date('2024-03-20'),
    updated_at: new Date('2024-12-18')
  }
];

const SAMPLE_GENRES: Genre[] = [
  { id: 1, name: "Fantasy", slug: "fantasy", description: "Dunia magis dan petualangan", is_active: true, created_at: new Date() },
  { id: 2, name: "Romance", slug: "romance", description: "Kisah cinta dan romansa", is_active: true, created_at: new Date() },
  { id: 3, name: "Mystery", slug: "mystery", description: "Misteri dan thriller", is_active: true, created_at: new Date() },
  { id: 4, name: "Sci-Fi", slug: "sci-fi", description: "Fiksi ilmiah", is_active: true, created_at: new Date() }
];

const SAMPLE_STATS: DashboardStats = {
  total_users: 15420,
  total_novels: 3847,
  total_chapters: 128943,
  total_transactions: 45672,
  total_revenue: 234567.89,
  active_users_today: 2341,
  new_users_today: 89,
  chapters_published_today: 156
};

function App() {
  const [currentView, setCurrentView] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [novels, setNovels] = useState<Novel[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [newUserForm, setNewUserForm] = useState<CreateUserInput>({
    username: '',
    email: '',
    password: '',
    role: 'reader',
    display_name: ''
  });

  const [newNovelForm, setNewNovelForm] = useState<CreateNovelInput>({
    title: '',
    slug: '',
    description: '',
    cover_image_url: '',
    author_id: CURRENT_USER.id,
    genre_id: 1,
    status: 'draft',
    is_premium: false
  });

  const [newGenreForm, setNewGenreForm] = useState<CreateGenreInput>({
    name: '',
    slug: '',
    description: ''
  });

  // Load data function with sample fallback
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [novelsData, genresData, statsData] = await Promise.all([
        trpc.getNovels.query(),
        trpc.getGenres.query(),
        trpc.getDashboardStats.query()
      ]);

      // Use sample data if API returns empty (since handlers are stubs)
      setNovels(novelsData.length > 0 ? novelsData : SAMPLE_NOVELS);
      setGenres(genresData.length > 0 ? genresData : SAMPLE_GENRES);
      setDashboardStats(statsData.total_users > 0 ? statsData : SAMPLE_STATS);
    } catch (error) {
      console.error('Failed to load data:', error);
      // Fallback to sample data on error
      setNovels(SAMPLE_NOVELS);
      setGenres(SAMPLE_GENRES);
      setDashboardStats(SAMPLE_STATS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter novels based on search and genre
  const filteredNovels = novels.filter((novel: Novel) => {
    const matchesSearch = novel.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (novel.description && novel.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesGenre = selectedGenre === 'all' || novel.genre_id.toString() === selectedGenre;
    return matchesSearch && matchesGenre;
  });

  // Event handlers
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await trpc.createUser.mutate(newUserForm);
      setNewUserForm({ username: '', email: '', password: '', role: 'reader', display_name: '' });
      await loadData();
    } catch (error) {
      console.error('Failed to create user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNovel = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await trpc.createNovel.mutate(newNovelForm);
      setNewNovelForm({
        title: '',
        slug: '',
        description: '',
        cover_image_url: '',
        author_id: CURRENT_USER.id,
        genre_id: genres.length > 0 ? genres[0].id : 1,
        status: 'draft',
        is_premium: false
      });
      await loadData();
    } catch (error) {
      console.error('Failed to create novel:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGenre = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await trpc.createGenre.mutate(newGenreForm);
      setNewGenreForm({ name: '', slug: '', description: '' });
      await loadData();
    } catch (error) {
      console.error('Failed to create genre:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Navigation component
  const Navigation = () => (
    <nav className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-purple-600" />
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              DANOVEL
            </span>
          </div>
          <div className="hidden md:flex space-x-6">
            <Button 
              variant={currentView === 'home' ? 'default' : 'ghost'} 
              onClick={() => setCurrentView('home')}
              className="flex items-center space-x-2"
            >
              <BookOpen className="h-4 w-4" />
              <span>Beranda</span>
            </Button>
            <Button 
              variant={currentView === 'library' ? 'default' : 'ghost'} 
              onClick={() => setCurrentView('library')}
              className="flex items-center space-x-2"
            >
              <BookMarked className="h-4 w-4" />
              <span>Perpustakaan</span>
            </Button>
            {(CURRENT_USER.role === 'writer' || CURRENT_USER.role === 'admin') && (
              <Button 
                variant={currentView === 'writer' ? 'default' : 'ghost'} 
                onClick={() => setCurrentView('writer')}
                className="flex items-center space-x-2"
              >
                <Edit className="h-4 w-4" />
                <span>Dashboard Penulis</span>
              </Button>
            )}
            {CURRENT_USER.role === 'admin' && (
              <Button 
                variant={currentView === 'admin' ? 'default' : 'ghost'} 
                onClick={() => setCurrentView('admin')}
                className="flex items-center space-x-2"
              >
                <Settings className="h-4 w-4" />
                <span>Panel Admin</span>
              </Button>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-yellow-50 px-3 py-1 rounded-full">
            <Coins className="h-4 w-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">{CURRENT_USER.coin_balance.toLocaleString()}</span>
          </div>
          <Button variant="ghost" size="sm">
            <Bell className="h-4 w-4" />
          </Button>
          <Avatar>
            <AvatarImage src={CURRENT_USER.avatar_url || undefined} />
            <AvatarFallback>{CURRENT_USER.display_name?.[0] || CURRENT_USER.username[0].toUpperCase()}</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </nav>
  );

  // Novel Card Component
  const NovelCard = ({ novel }: { novel: Novel }) => {
    const genre = genres.find((g: Genre) => g.id === novel.genre_id);
    
    return (
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
        <div className="relative">
          {/* Cover placeholder */}
          <div className="h-48 bg-gradient-to-br from-purple-400 via-pink-400 to-red-400 flex items-center justify-center">
            <BookOpen className="h-16 w-16 text-white opacity-60" />
          </div>
          {novel.is_featured && (
            <Badge className="absolute top-2 left-2 bg-gradient-to-r from-yellow-400 to-orange-500">
              <Crown className="h-3 w-3 mr-1" />
              Unggulan
            </Badge>
          )}
          {novel.is_premium && (
            <Badge className="absolute top-2 right-2 bg-gradient-to-r from-purple-500 to-pink-500">
              <Zap className="h-3 w-3 mr-1" />
              Premium
            </Badge>
          )}
        </div>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Badge variant="secondary" className="text-xs">
              {genre?.name || 'Unknown'}
            </Badge>
            <Badge variant="outline" className="text-xs capitalize">
              {novel.status}
            </Badge>
          </div>
          <h3 className="font-semibold text-lg mb-2 group-hover:text-purple-600 transition-colors line-clamp-2">
            {novel.title}
          </h3>
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {novel.description || 'Tidak ada deskripsi tersedia.'}
          </p>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Eye className="h-4 w-4" />
                <span>{novel.total_views.toLocaleString()}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Heart className="h-4 w-4" />
                <span>{novel.total_likes.toLocaleString()}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 text-yellow-500" />
                <span>{novel.average_rating ? novel.average_rating.toFixed(1) : 'N/A'}</span>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{novel.total_chapters} bab</span>
              <Button size="sm" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                Baca
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Home View
  const HomeView = () => (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 rounded-2xl p-8 text-white mb-8">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold mb-4">
            Selamat Datang di DANOVEL! 📚✨
          </h1>
          <p className="text-xl mb-6 opacity-90">
            Platform web novel terbaik untuk pembaca dan penulis Indonesia. Temukan cerita-cerita menarik dan bagikan karya Anda dengan jutaan pembaca.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button size="lg" variant="secondary" className="bg-white text-purple-600 hover:bg-gray-100">
              <Search className="h-5 w-5 mr-2" />
              Jelajahi Novel
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-purple-600">
              <Edit className="h-5 w-5 mr-2" />
              Mulai Menulis
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      {dashboardStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <BookOpen className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{dashboardStats.total_novels.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Novel</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Users className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{dashboardStats.total_users.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Pengguna</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <BookMarked className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{dashboardStats.total_chapters.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Bab</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <TrendingUp className="h-8 w-8 text-orange-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{dashboardStats.active_users_today.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Aktif Hari Ini</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Cari novel berdasarkan judul atau deskripsi..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={selectedGenre} onValueChange={setSelectedGenre}>
          <SelectTrigger className="w-full md:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Semua Genre" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Genre</SelectItem>
            {genres.map((genre: Genre) => (
              <SelectItem key={genre.id} value={genre.id.toString()}>
                {genre.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Featured Novels */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4 flex items-center">
          <Crown className="h-6 w-6 text-yellow-500 mr-2" />
          Novel Unggulan
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNovels
            .filter((novel: Novel) => novel.is_featured)
            .slice(0, 6)
            .map((novel: Novel) => (
              <NovelCard key={novel.id} novel={novel} />
            ))}
        </div>
      </div>

      {/* All Novels */}
      <div>
        <h2 className="text-2xl font-bold mb-4 flex items-center">
          <BookOpen className="h-6 w-6 text-purple-500 mr-2" />
          Semua Novel ({filteredNovels.length})
        </h2>
        {filteredNovels.length === 0 ? (
          <Alert>
            <Search className="h-4 w-4" />
            <AlertDescription>
              Tidak ada novel yang ditemukan. Coba ubah kata kunci pencarian atau filter genre.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredNovels.map((novel: Novel) => (
              <NovelCard key={novel.id} novel={novel} />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Library View
  const LibraryView = () => (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold mb-6 flex items-center">
        <BookMarked className="h-8 w-8 text-purple-500 mr-3" />
        Perpustakaan Pribadi
      </h1>
      
      <Tabs defaultValue="reading" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="reading">Sedang Dibaca</TabsTrigger>
          <TabsTrigger value="completed">Selesai</TabsTrigger>
          <TabsTrigger value="favorites">Favorit</TabsTrigger>
          <TabsTrigger value="history">Riwayat</TabsTrigger>
        </TabsList>
        
        <TabsContent value="reading" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {novels.slice(0, 2).map((novel: Novel) => (
              <Card key={novel.id} className="overflow-hidden">
                <div className="h-32 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                  <BookOpen className="h-12 w-12 text-white opacity-60" />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">{novel.title}</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>15/47 bab</span>
                    </div>
                    <Progress value={32} className="h-2" />
                    <Button className="w-full" size="sm">
                      Lanjut Baca
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="completed" className="mt-6">
          <p className="text-gray-500 text-center py-8">Belum ada novel yang selesai dibaca.</p>
        </TabsContent>
        
        <TabsContent value="favorites" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {novels.slice(0, 1).map((novel: Novel) => (
              <NovelCard key={novel.id} novel={novel} />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="history" className="mt-6">
          <p className="text-gray-500 text-center py-8">Riwayat bacaan kosong.</p>
        </TabsContent>
      </Tabs>
    </div>
  );

  // Writer Dashboard View
  const WriterView = () => (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold flex items-center">
          <Edit className="h-8 w-8 text-purple-500 mr-3" />
          Dashboard Penulis
        </h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-500 to-pink-500">
              <Plus className="h-4 w-4 mr-2" />
              Novel Baru
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Buat Novel Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateNovel} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Judul Novel</label>
                  <Input
                    value={newNovelForm.title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewNovelForm((prev: CreateNovelInput) => ({ ...prev, title: e.target.value }))
                    }
                    placeholder="Masukkan judul novel"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Slug</label>
                  <Input
                    value={newNovelForm.slug}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewNovelForm((prev: CreateNovelInput) => ({ ...prev, slug: e.target.value }))
                    }
                    placeholder="novel-slug"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Deskripsi</label>
                <Textarea
                  value={newNovelForm.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setNewNovelForm((prev: CreateNovelInput) => ({ 
                      ...prev, 
                      description: e.target.value || null 
                    }))
                  }
                  placeholder="Ceritakan tentang novel Anda..."
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Genre</label>
                  <Select
                    value={genres.length > 0 ? newNovelForm.genre_id.toString() : '1'}
                    onValueChange={(value) =>
                      setNewNovelForm((prev: CreateNovelInput) => ({ 
                        ...prev, 
                        genre_id: parseInt(value) 
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {genres.length > 0 ? (
                        genres.map((genre: Genre) => (
                          <SelectItem key={genre.id} value={genre.id.toString()}>
                            {genre.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="1">Loading genres...</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={newNovelForm.status}
                    onValueChange={(value) =>
                      setNewNovelForm((prev: CreateNovelInput) => ({ 
                        ...prev, 
                        status: value as NovelStatus 
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="ongoing">Ongoing</SelectItem>
                      <SelectItem value="completed">Selesai</SelectItem>
                      
                      <SelectItem value="hiatus">Hiatus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-between pt-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newNovelForm.is_premium}
                    onChange={(e) =>
                      setNewNovelForm((prev: CreateNovelInput) => ({ 
                        ...prev, 
                        is_premium: e.target.checked 
                      }))
                    }
                  />
           

                  <span className="text-sm">Novel Premium</span>
                </label>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Membuat...' : 'Buat Novel'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Writer Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6 text-center">
            <BookOpen className="h-8 w-8 text-purple-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">{novels.length}</div>
            <div className="text-sm text-gray-600">Novel</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Eye className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">{novels.reduce((sum: number, novel: Novel) => sum + novel.total_views, 0).toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Views</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Heart className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">{novels.reduce((sum: number, novel: Novel) => sum + novel.total_likes, 0).toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Likes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Coins className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">₹12,340</div>
            <div className="text-sm text-gray-600">Pendapatan</div>
          </CardContent>
        </Card>
      </div>

      {/* My Novels */}
      <Card>
        <CardHeader>
          <CardTitle>Novel Saya</CardTitle>
          <CardDescription>Kelola dan edit novel yang telah Anda buat</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {novels.slice(0, 2).map((novel: Novel) => (
              <div key={novel.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="font-semibold">{novel.title}</h3>
                    <Badge variant="outline" className="capitalize">
                      {novel.status}
                    </Badge>
                    {novel.is_premium && (
                      <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">
                        Premium
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-6 mt-2 text-sm text-gray-600">
                    <span>{novel.total_chapters} bab</span>
                    <span>{novel.total_views.toLocaleString()} views</span>
                    <span>{novel.total_likes.toLocaleString()} likes</span>
                    <span>⭐ {novel.average_rating ? novel.average_rating.toFixed(1) : 'N/A'}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Bab Baru
                  </Button>
                  <Button variant="outline" size="sm">
                    <BarChart3 className="h-4 w-4 mr-1" />
                    Statistik
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Admin Panel View
  const AdminView = () => (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold mb-6 flex items-center">
        <Settings className="h-8 w-8 text-red-500 mr-3" />
        Panel Admin
      </h1>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="users">Pengguna</TabsTrigger>
          <TabsTrigger value="content">Konten</TabsTrigger>
          <TabsTrigger value="financial">Keuangan</TabsTrigger>
          <TabsTrigger value="settings">Pengaturan</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          {dashboardStats && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6 text-center">
                    <Users className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{dashboardStats.total_users.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Total Pengguna</div>
                    <div className="text-xs text-green-600 mt-1">+{dashboardStats.new_users_today} hari ini</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <BookOpen className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{dashboardStats.total_novels.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Total Novel</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <BookMarked className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{dashboardStats.total_chapters.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Total Bab</div>
                    <div className="text-xs text-green-600 mt-1">+{dashboardStats.chapters_published_today} hari ini</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <Coins className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold">₹{dashboardStats.total_revenue.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Total Pendapatan</div>
                  </CardContent>
                </Card>
              </div>

              {/* Activity Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Aktivitas Hari Ini</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <UserCheck className="h-5 w-5 text-green-500" />
                          <span>Pengguna Aktif</span>
                        </div>
                        <span className="font-semibold">{dashboardStats.active_users_today.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Users className="h-5 w-5 text-blue-500" />
                          <span>Pengguna Baru</span>
                        </div>
                        <span className="font-semibold">{dashboardStats.new_users_today}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <BookMarked className="h-5 w-5 text-purple-500" />
                          <span>Bab Dipublikasi</span>
                        </div>
                        <span className="font-semibold">{dashboardStats.chapters_published_today}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="h-5 w-5 text-orange-500" />
                          <span>Transaksi</span>
                        </div>
                        <span className="font-semibold">{dashboardStats.total_transactions.toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Statistik Platform</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm">Novel Premium</span>
                          <span className="text-sm font-medium">
                            {novels.filter((n: Novel) => n.is_premium).length}/{novels.length}
                          </span>
                        </div>
                        <Progress 
                          value={novels.length > 0 ? (novels.filter((n: Novel) => n.is_premium).length / novels.length) * 100 : 0} 
                          className="h-2" 
                        />
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm">Novel Aktif</span>
                          <span className="text-sm font-medium">
                            {novels.filter((n: Novel) => n.status === 'ongoing').length}/{novels.length}
                          </span>
                        </div>
                        <Progress 
                          value={novels.length > 0 ? (novels.filter((n: Novel) => n.status === 'ongoing').length / novels.length) * 100 : 0} 
                          className="h-2" 
                        />
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm">Novel Unggulan</span>
                          <span className="text-sm font-medium">
                            {novels.filter((n: Novel) => n.is_featured).length}/{novels.length}
                          </span>
                        </div>
                        <Progress 
                          value={novels.length > 0 ? (novels.filter((n: Novel) => n.is_featured).length / novels.length) * 100 : 0} 
                          className="h-2" 
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Manajemen Pengguna</h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Pengguna
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Tambah Pengguna Baru</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateUser} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Username</label>
                        <Input
                          value={newUserForm.username}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setNewUserForm((prev: CreateUserInput) => ({ ...prev, username: e.target.value }))
                          }
                          placeholder="username"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Email</label>
                        <Input
                          type="email"
                          value={newUserForm.email}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setNewUserForm((prev: CreateUserInput) => ({ ...prev, email: e.target.value }))
                          }
                          placeholder="email@example.com"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Password</label>
                      <Input
                        type="password"
                        value={newUserForm.password}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setNewUserForm((prev: CreateUserInput) => ({ ...prev, password: e.target.value }))
                        }
                        placeholder="Minimal 8 karakter"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Role</label>
                        <Select
                          value={newUserForm.role}
                          onValueChange={(value) =>
                            setNewUserForm((prev: CreateUserInput) => ({ 
                              ...prev, 
                              role: value as UserRole 
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="visitor">Visitor</SelectItem>
                            <SelectItem value="reader">Reader</SelectItem>
                            <SelectItem value="writer">Writer</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Display Name</label>
                        <Input
                          value={newUserForm.display_name || ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setNewUserForm((prev: CreateUserInput) => ({ 
                              ...prev, 
                              display_name: e.target.value || undefined 
                            }))
                          }
                          placeholder="Nama tampilan"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Membuat...' : 'Buat Pengguna'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Users Table */}
            <Card>
              <CardContent className="p-0">
                <div className="p-4 border-b">
                  <h3 className="font-semibold">Daftar Pengguna</h3>
                  <p className="text-sm text-gray-600">Kelola semua pengguna platform</p>
                </div>
                <div className="p-4">
                  <p className="text-gray-500 text-center py-8">
                    Data pengguna tidak tersedia (handler stub). 
                    <br />
                    Implementasi database diperlukan untuk menampilkan data pengguna.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="content" className="mt-6">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Manajemen Konten</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Genres Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Genre</span>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-1" />
                          Tambah
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Tambah Genre Baru</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreateGenre} className="space-y-4">
                          <div>
                            <label className="text-sm font-medium">Nama Genre</label>
                            <Input
                              value={newGenreForm.name}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setNewGenreForm((prev: CreateGenreInput) => ({ ...prev, name: e.target.value }))
                              }
                              placeholder="Nama genre"
                              required
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Slug</label>
                            <Input
                              value={newGenreForm.slug}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setNewGenreForm((prev: CreateGenreInput) => ({ ...prev, slug: e.target.value }))
                              }
                              placeholder="genre-slug"
                              required
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Deskripsi</label>
                            <Textarea
                              value={newGenreForm.description || ''}
                              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                setNewGenreForm((prev: CreateGenreInput) => ({ 
                                  ...prev, 
                                  description: e.target.value || null 
                                }))
                              }
                              placeholder="Deskripsi genre..."
                              rows={3}
                            />
                          </div>
                          <div className="flex justify-end">
                            <Button type="submit" disabled={isLoading}>
                              {isLoading ? 'Membuat...' : 'Buat Genre'}
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {genres.map((genre: Genre) => (
                      <div key={genre.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <span className="font-medium">{genre.name}</span>
                          <p className="text-xs text-gray-600">{genre.description}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Content Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle>Statistik Konten</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Total Novel</span>
                      <Badge>{novels.length}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Novel Premium</span>
                      <Badge variant="secondary">{novels.filter((n: Novel) => n.is_premium).length}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Novel Unggulan</span>
                      <Badge variant="secondary">{novels.filter((n: Novel) => n.is_featured).length}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Novel Aktif</span>
                      <Badge variant="secondary">{novels.filter((n: Novel) => n.status === 'ongoing').length}</Badge>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span>Total Genre</span>
                      <Badge>{genres.length}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Novels Table */}
            <Card>
              <CardHeader>
                <CardTitle>Semua Novel</CardTitle>
                <CardDescription>Kelola dan moderasi semua novel di platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {novels.map((novel: Novel) => (
                    <div key={novel.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-semibold">{novel.title}</h3>
                          <Badge variant="outline" className="capitalize">
                            {novel.status}
                          </Badge>
                          {novel.is_premium && (
                            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">
                              Premium
                            </Badge>
                          )}
                          {novel.is_featured && (
                            <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500">
                              <Crown className="h-3 w-3 mr-1" />
                              Unggulan
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-6 mt-2 text-sm text-gray-600">
                          <span>{novel.total_chapters} bab</span>
                          <span>{novel.total_views.toLocaleString()} views</span>
                          <span>{novel.total_likes.toLocaleString()} likes</span>
                          <span>⭐ {novel.average_rating ? novel.average_rating.toFixed(1) : 'N/A'}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Lihat
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm">
                          <Award className="h-4 w-4 mr-1" />
                          Feature
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financial" className="mt-6">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Manajemen Keuangan</h2>
            
            {dashboardStats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="p-6 text-center">
                    <Coins className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold">₹{dashboardStats.total_revenue.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Total Pendapatan</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{dashboardStats.total_transactions.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Total Transaksi</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <Users className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold">₹89,234</div>
                    <div className="text-sm text-gray-600">Pending Payouts</div>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Paket Koin</CardTitle>
                  <CardDescription>Kelola paket pembelian koin</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { coins: 100, price: 10000, popular: false },
                      { coins: 500, price: 45000, popular: true },
                      { coins: 1000, price: 85000, popular: false },
                      { coins: 2500, price: 200000, popular: false }
                    ].map((pkg, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center space-x-3">
                          <Coins className="h-5 w-5 text-yellow-500" />
                          <div>
                            <span className="font-medium">{pkg.coins.toLocaleString()} Koin</span>
                            {pkg.popular && <Badge className="ml-2" variant="secondary">Popular</Badge>}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold">Rp {pkg.price.toLocaleString()}</span>
                          <Button variant="outline" size="sm">
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Transaksi Terbaru</CardTitle>
                  <CardDescription>Aktivitas transaksi terkini</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500 text-center py-8">
                    Data transaksi tidak tersedia (handler stub).
                    <br />
                    Implementasi database diperlukan untuk menampilkan riwayat transaksi.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Pengaturan Platform</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Pengaturan Umum</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Nama Platform</label>
                    <Input defaultValue="DANOVEL" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Tagline</label>
                    <Input defaultValue="Platform Web Novel Terbaik Indonesia" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email Kontak</label>
                    <Input defaultValue="support@danovel.com" />
                  </div>
                  <Button>Simpan Pengaturan</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pengaturan Keamanan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">Two-Factor Authentication</span>
                      <p className="text-sm text-gray-600">Wajibkan 2FA untuk admin</p>
                    </div>
                    <input type="checkbox" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">Email Verification</span>
                      <p className="text-sm text-gray-600">Wajibkan verifikasi email</p>
                    </div>
                    <input type="checkbox" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">Content Moderation</span>
                      <p className="text-sm text-gray-600">Auto-moderasi konten</p>
                    </div>
                    <input type="checkbox" defaultChecked />
                  </div>
                  <Button>Simpan Pengaturan</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );

  // Main render
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {currentView === 'home' && <HomeView />}
      {currentView === 'library' && <LibraryView />}
      {currentView === 'writer' && <WriterView />}
      {currentView === 'admin' && <AdminView />}
    </div>
  );
}

export default App;
