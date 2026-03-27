import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardTriagem from './pages/Triagem/DashboardTriagem';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redireciona a página inicial direto para a tela de triagem por enquanto */}
        <Route path="/" element={<Navigate to="/triagem" />} />

        {/* URL: localhost:5173/triagem -> Renderiza o código */}
        <Route path="/triagem" element={<DashboardTriagem />} />

        {/* URL: localhost:5173/recepcao -> Espaço reservado para ediçao posterior */}
        <Route path="/recepcao" element={<div style={{padding: '20px'}}><h1>Tela da Recepção (Em construção pelo colega)</h1></div>} />
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;