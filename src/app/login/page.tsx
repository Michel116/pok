
'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PackageCheck, User, Lock, EyeOff, Eye, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { type FormEvent, useState } from 'react';
import { useUser } from '@/context/user-context';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

function BackgroundCard({ className }: { className?: string }) {
  return (
    <div
      className={`absolute bg-white/5 backdrop-blur-sm rounded-lg shadow-lg border border-white/10 ${className}`}
    >
      <div className="p-4">
        <div className="w-8 h-2 mb-2 rounded bg-white/10"></div>
        <div className="w-16 h-2 rounded bg-white/10"></div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { login } = useUser();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);
    const success = await login(username, password);
    setIsLoading(false);
    if (success) {
      router.push('/dashboard');
    } else {
      setError('Неверный логин или пароль. Попробуйте снова.');
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-login-gradient p-4 overflow-hidden relative">
      
      <div className="absolute inset-0 w-full h-full z-0">
          <BackgroundCard className="top-[15%] left-[10%] rotate-[-15deg] w-48 h-24" />
          <BackgroundCard className="top-[25%] right-[5%] rotate-[10deg] w-56 h-28" />
          <BackgroundCard className="bottom-[20%] left-[-5%] rotate-[5deg] w-64 h-32" />
          <BackgroundCard className="bottom-[10%] right-[15%] rotate-[-10deg] w-40 h-20" />
      </div>

      <div className="z-10 flex flex-col items-center text-center w-full max-w-md">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm">
          <PackageCheck className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-4xl font-bold text-foreground">
          Порядок
        </h1>
        <p className="mt-2 text-muted-foreground">
          Система отслеживания и учета терминалов
        </p>

        <Card className="mt-8 w-full shadow-2xl bg-card/80 backdrop-blur-lg border-card/20">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Авторизация</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Ошибка входа</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="login-main"
                      type="text"
                      placeholder="Ваш логин"
                      className="pl-10"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      autoComplete="username"
                    />
                </div>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="password-main"
                      type={showPassword ? "text" : "password"}
                      placeholder="Пароль"
                      className="pl-10 pr-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground cursor-pointer">
                      {showPassword ? <EyeOff /> : <Eye />}
                    </button>
                </div>
                <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
                    {isLoading && <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                    Войти
                </Button>
                </div>
            </form>
            <div className="mt-6 flex justify-between items-center text-sm">
              <Link href="#" className="text-primary hover:underline">
                Забыли пароль?
              </Link>
              <Link href="#" className="font-semibold text-primary hover:underline">
                Регистрация &gt;
              </Link>
            </div>
          </CardContent>
        </Card>

        <footer className="mt-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Порядок. Все права защищены.</p>
        </footer>
      </div>
    </div>
  );
}
