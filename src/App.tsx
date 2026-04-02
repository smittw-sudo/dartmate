import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { useAppStore } from './store/appStore';
import { AuthScreen } from './screens/AuthScreen';
import { HomeScreen } from './screens/HomeScreen';
import { PlayersScreen } from './screens/PlayersScreen';
import { PlayerDetailScreen } from './screens/PlayerDetailScreen';
import { NewGameScreen } from './screens/NewGameScreen';
import { ActiveGameScreen } from './screens/ActiveGameScreen';
import { EndGameScreen } from './screens/EndGameScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { CompetitionScreen } from './screens/CompetitionScreen';
import { DoublesSetupScreen } from './screens/DoublesSetupScreen';
import { DoublesGameScreen } from './screens/DoublesGameScreen';
import { DoublesEndScreen } from './screens/DoublesEndScreen';
import { Target } from 'lucide-react';

export default function App() {
  const [userId, setUserId] = useState<string | null | undefined>(undefined); // undefined = nog aan het laden
  const loadAll = useAppStore(s => s.loadAll);

  useEffect(() => {
    // Check huidige sessie
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user.id ?? null);
      if (data.session) loadAll();
    });

    // Luister naar auth-wijzigingen (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null);
      if (session) loadAll();
    });

    return () => subscription.unsubscribe();
  }, [loadAll]);

  // Laden
  if (userId === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Target size={48} className="text-accent animate-pulse" />
      </div>
    );
  }

  // Niet ingelogd
  if (userId === null) {
    return <AuthScreen />;
  }

  // Ingelogd
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/spelers" element={<PlayersScreen />} />
        <Route path="/speler/:id" element={<PlayerDetailScreen />} />
        <Route path="/nieuw-spel" element={<NewGameScreen />} />
        <Route path="/spel" element={<ActiveGameScreen />} />
        <Route path="/einde" element={<EndGameScreen />} />
        <Route path="/geschiedenis" element={<HistoryScreen />} />
        <Route path="/competitie" element={<CompetitionScreen />} />
        <Route path="/dubbels" element={<DoublesSetupScreen />} />
        <Route path="/dubbels/spel" element={<DoublesGameScreen />} />
        <Route path="/dubbels/einde" element={<DoublesEndScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
