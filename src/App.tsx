import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HomeScreen } from './screens/HomeScreen';
import { PlayersScreen } from './screens/PlayersScreen';
import { PlayerDetailScreen } from './screens/PlayerDetailScreen';
import { NewGameScreen } from './screens/NewGameScreen';
import { ActiveGameScreen } from './screens/ActiveGameScreen';
import { EndGameScreen } from './screens/EndGameScreen';
import { HistoryScreen } from './screens/HistoryScreen';

export default function App() {
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
