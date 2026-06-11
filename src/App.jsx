import { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { setNavigate } from "./utils/navigation";
import { useStreetViewVerifier } from "./hooks/useStreetViewVerifier";

import Home from './pages/Home'
import Game from './pages/Game'
import Navbar from './components/Navbar';

function App() {
  const navigate = useNavigate();
  useStreetViewVerifier();

  useEffect(() => {
    setNavigate(navigate);
  }, [navigate]);

  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/game" element={<Game />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </>
  )
}

export default App
