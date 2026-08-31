import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Shield } from 'lucide-react';

export const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(username, password);
      navigate('/command-center');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center bg-[url('/bg-pattern.svg')]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600/20 text-blue-500 rounded-2xl mb-4 border border-blue-500/30">
            <Shield size={32} />
          </div>
          <h1 className="text-3xl font-bold tracking-wider text-slate-100">IBVAP</h1>
          <p className="text-slate-400 text-sm mt-2">Intelligent Border Video Analytics Platform</p>
        </div>

        <Card className="glass">
          <CardHeader>
            <CardTitle>Secure Command Access</CardTitle>
            <CardDescription>Enter your credentials to access the system.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Input 
                  type="text" 
                  placeholder="Operator ID" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Input 
                  type="password" 
                  placeholder="Access Code" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Authenticating...' : 'SIGN IN'}
              </Button>
            </form>

            <div className="mt-8 space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center text-slate-400">
                <span>Auth Service</span>
                <span className="text-green-500">✓ ONLINE</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>AI Processing Node</span>
                <span className="text-green-500">✓ ONLINE</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Camera Gateway</span>
                <span className="text-green-500">✓ ONLINE</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
