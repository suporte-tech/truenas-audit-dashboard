import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Search, Upload, Filter, LogOut, Eye, Trash2, FolderOpen, User, Calendar, Activity } from 'lucide-react';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [logData, setLogData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [actionFilter, setActionFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');

  const handleLogin = () => {
    if (username === 'admin' && password === 'admin123') {
      setIsAuthenticated(true);
    } else {
      alert('Credenciais inválidas! Use: admin / admin123');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      const parsedLogs = parseLogFile(content);
      setLogData(parsedLogs);
    };
    reader.readAsText(file);
  };

  const parseLogFile = (content) => {
    const lines = content.split('\n').filter(line => line.trim());
    return lines.map((line, index) => {
      const dateMatch = line.match(/(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4})/);
      const timeMatch = line.match(/(\d{2}:\d{2}:\d{2})/);
      const userMatch = line.match(/user[:\s]+([^\s,]+)/i) || line.match(/by\s+([^\s,]+)/i);
      const actionMatch = line.match(/\b(delete|removed|created|accessed|modified|read|write|uploaded|downloaded)\b/i);
      const pathMatch = line.match(/['"]([^'"]*\/[^'"]*)['"]/);

      return {
        id: index,
        timestamp: dateMatch ? `${dateMatch[0]} ${timeMatch ? timeMatch[0] : '00:00:00'}` : new Date().toISOString(),
        user: userMatch ? userMatch[1] : 'unknown',
        action: actionMatch ? actionMatch[0].toLowerCase() : 'other',
        path: pathMatch ? pathMatch[1] : 'N/A',
        rawLog: line
      };
    });
  };

  const generateSampleLogs = () => {
    const users = ['admin', 'jsilva', 'mcoast', 'rferreira', 'asouza'];
    const actions = ['delete', 'read', 'write', 'created', 'modified', 'accessed'];
    const paths = ['/mnt/pool1/dados', '/mnt/pool1/backup', '/mnt/pool2/projetos', '/mnt/pool1/documentos', '/mnt/pool2/videos'];
    
    const samples = [];
    const now = new Date();
    
    for (let i = 0; i < 100; i++) {
      const date = new Date(now - Math.random() * 30 * 24 * 60 * 60 * 1000);
      samples.push({
        id: i,
        timestamp: date.toISOString().replace('T', ' ').substring(0, 19),
        user: users[Math.floor(Math.random() * users.length)],
        action: actions[Math.floor(Math.random() * actions.length)],
        path: paths[Math.floor(Math.random() * paths.length)] + `/file${i}.txt`,
        rawLog: `[${date.toISOString()}] User activity detected`
      });
    }
    
    setLogData(samples);
  };

  const filteredLogs = useMemo(() => {
    return logData.filter(log => {
      const matchesSearch = searchTerm === '' || 
        log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesAction = actionFilter === 'all' || log.action === actionFilter;
      const matchesUser = userFilter === 'all' || log.user === userFilter;

      let matchesDate = true;
      if (dateFilter.start) {
        matchesDate = matchesDate && new Date(log.timestamp) >= new Date(dateFilter.start);
      }
      if (dateFilter.end) {
        matchesDate = matchesDate && new Date(log.timestamp) <= new Date(dateFilter.end);
      }

      return matchesSearch && matchesAction && matchesUser && matchesDate;
    });
  }, [logData, searchTerm, actionFilter, userFilter, dateFilter]);

  const actionCounts = useMemo(() => {
    const counts = {};
    filteredLogs.forEach(log => {
      counts[log.action] = (counts[log.action] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredLogs]);

  const userActivity = useMemo(() => {
    const activity = {};
    filteredLogs.forEach(log => {
      activity[log.user] = (activity[log.user] || 0) + 1;
    });
    return Object.entries(activity)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [filteredLogs]);

  const timelineData = useMemo(() => {
    const timeline = {};
    filteredLogs.forEach(log => {
      const date = log.timestamp.split(' ')[0];
      timeline[date] = (timeline[date] || 0) + 1;
    });
    return Object.entries(timeline)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [filteredLogs]);

  const uniqueUsers = useMemo(() => {
    return ['all', ...new Set(logData.map(log => log.user))];
  }, [logData]);

  const uniqueActions = useMemo(() => {
    return ['all', ...new Set(logData.map(log => log.action))];
  }, [logData]);

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Activity className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">TrueNAS Audit</h1>
            <p className="text-gray-600">Sistema de Auditoria e Monitoramento</p>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Usuário</label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Digite seu usuário"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Senha</label>
              <div className="relative">
                <Eye className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Digite sua senha"
                />
              </div>
            </div>
            
            <button
              onClick={handleLogin}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-200 shadow-lg"
            >
              Entrar
            </button>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600 text-center">
              <strong>Demo:</strong> admin / admin123
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="text-blue-600" size={32} />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Dashboard de Auditoria TrueNAS</h1>
              <p className="text-sm text-gray-600">Monitoramento e análise de logs</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Upload size={24} className="text-blue-600" />
            Importar Logs
          </h2>
          <div className="flex gap-4">
            <label className="flex-1 cursor-pointer">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 transition">
                <Upload className="mx-auto mb-2 text-gray-400" size={32} />
                <p className="text-sm text-gray-600">Clique para fazer upload do arquivo de log</p>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  accept=".log,.txt"
                  className="hidden"
                />
              </div>
            </label>
            <button
              onClick={generateSampleLogs}
              className="px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              Carregar Logs de Exemplo
            </button>
          </div>
        </div>

        {logData.length > 0 && (
          <>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Filter size={24} className="text-blue-600" />
                Filtros
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Buscar usuário, caminho ou ação..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <input
                  type="date"
                  value={dateFilter.start}
                  onChange={(e) => setDateFilter({ ...dateFilter, start: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Data início"
                />
                
                <input
                  type="date"
                  value={dateFilter.end}
                  onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Data fim"
                />
                
                <select
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {uniqueUsers.map(user => (
                    <option key={user} value={user}>
                      {user === 'all' ? 'Todos os usuários' : user}
                    </option>
                  ))}
                </select>
                
                <select
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {uniqueActions.map(action => (
                    <option key={action} value={action}>
                      {action === 'all' ? 'Todas as ações' : action}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Total de Eventos</p>
                    <p className="text-3xl font-bold text-blue-600">{filteredLogs.length}</p>
                  </div>
                  <Activity className="text-blue-600" size={40} />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Usuários Ativos</p>
                    <p className="text-3xl font-bold text-green-600">
                      {new Set(filteredLogs.map(log => log.user)).size}
                    </p>
                  </div>
                  <User className="text-green-600" size={40} />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Exclusões</p>
                    <p className="text-3xl font-bold text-red-600">
                      {filteredLogs.filter(log => log.action === 'delete').length}
                    </p>
                  </div>
                  <Trash2 className="text-red-600" size={40} />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Acessos</p>
                    <p className="text-3xl font-bold text-purple-600">
                      {filteredLogs.filter(log => log.action === 'accessed' || log.action === 'read').length}
                    </p>
                  </div>
                  <FolderOpen className="text-purple-600" size={40} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Distribuição de Ações</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={actionCounts}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {actionCounts.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Top 10 Usuários Mais Ativos</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={userActivity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Linha do Tempo de Atividades</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Registros de Auditoria</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Data/Hora</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Usuário</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Ação</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Caminho</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredLogs.slice(0, 50).map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600">{log.timestamp}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {log.user}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded ${
                            log.action === 'delete' ? 'bg-red-100 text-red-800' :
                            log.action === 'write' || log.action === 'created' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 font-mono">{log.path}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredLogs.length > 50 && (
                  <p className="text-center text-sm text-gray-500 mt-4">
                    Mostrando 50 de {filteredLogs.length} registros
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default App;
