import React, { useState, useEffect } from 'react';
import './DashboardTriagem.css';

const API_BASE_URL = 'http://localhost:3333';

const DashboardTriagem = () => {
  const [atendimentos, setAtendimentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [itemSelecionado, setItemSelecionado] = useState(null);
  const [sinaisVitais, setSinaisVitais] = useState({ temp: '', pa: '', sat: '', fc: '', fr: '', dor: '0', queixa: '' });
  const [riscoSugerido, setRiscoSugerido] = useState({ label: 'PENDENTE', color: '#7f8c8d' });

  // Lógica de ordenação (Quanto menor o peso, mais alto na lista)
  const prioridadePesos = { 'EMERGÊNCIA': 0, 'MUITO URGENTE': 1, 'URGENTE': 2, 'POUCO URGENTE': 3, 'NÃO URGENTE': 4, 'PENDENTE': 5 };

  const getCorPrioridade = (p) => {
    const cores = { 'EMERGÊNCIA': '#ff0000', 'MUITO URGENTE': '#ff8c00', 'URGENTE': '#ffff00', 'POUCO URGENTE': '#008000', 'NÃO URGENTE': '#3498db', 'PENDENTE': '#7f8c8d' };
    return cores[p] || '#7f8c8d';
  };

  const buscarFila = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/atendimentos`);
      const dados = await res.json();
      
      // Ordenação: Prioridade primeiro, depois tempo de espera
      const ordenada = dados.sort((a, b) => {
        const pesoA = prioridadePesos[a.prioridade] ?? 5;
        const pesoB = prioridadePesos[b.prioridade] ?? 5;
        if (pesoA !== pesoB) return pesoA - pesoB;
        return new Date(a.criado_em) - new Date(b.criado_em);
      });
      setAtendimentos(ordenada);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleLimparFila = async () => {
    if (window.confirm("⚠️ Apagar todos os atendimentos?")) {
      await fetch(`${API_BASE_URL}/atendimentos`, { method: 'DELETE' });
      buscarFila();
    }
  };

  const handleFinalizar = async () => {
    await fetch(`${API_BASE_URL}/atendimentos/${itemSelecionado.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prioridade: riscoSugerido.label, status: "TRIADO" })
    });
    setShowModal(false);
    buscarFila();
  };

  useEffect(() => {
    buscarFila();
    const interval = setInterval(buscarFila, 30000);
    return () => clearInterval(interval);
  }, []);

  // Manchester Logic
  useEffect(() => {
    const { temp, sat, fc, dor } = sinaisVitais;
    const t = parseFloat(temp); const s = parseFloat(sat); const f = parseInt(fc); const d = parseInt(dor);
    if (s < 90 || d === 10 || f > 140) setRiscoSugerido({ label: 'EMERGÊNCIA', color: '#ff0000' });
    else if (t >= 39 || s < 94 || f > 120) setRiscoSugerido({ label: 'MUITO URGENTE', color: '#ff8c00' });
    else if (t >= 38 || d >= 7) setRiscoSugerido({ label: 'URGENTE', color: '#ffff00' });
    else if (t >= 37.5 || d >= 4) setRiscoSugerido({ label: 'POUCO URGENTE', color: '#008000' });
    else if (t > 0) setRiscoSugerido({ label: 'NÃO URGENTE', color: '#3498db' });
  }, [sinaisVitais]);

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>MedFlow | Painel de Triagem</h1>
        <div className="header-buttons">
          <button className="btn-refresh" onClick={buscarFila}>🔄 Sincronizar</button>
          <button className="btn-clear" onClick={handleLimparFila}>🗑️ Limpar Fila</button>
        </div>
      </header>

      <main className="dashboard-content">
        {loading ? <p>Carregando...</p> : (
          <table className="triage-table">
            <thead>
              <tr><th>Paciente</th><th>Classificação</th><th>Ação</th></tr>
            </thead>
            <tbody>
              {atendimentos.length > 0 ? atendimentos.map((item) => (
                <tr key={item.id} className={item.prioridade === 'EMERGÊNCIA' ? 'linha-emergencia' : ''}>
                  <td><strong>{item.paciente?.nome}</strong></td>
                  <td><span className="badge-prioridade" style={{ backgroundColor: getCorPrioridade(item.prioridade) }}>{item.prioridade}</span></td>
                  <td><button className="btn-triage" onClick={() => { setItemSelecionado(item); setShowModal(true); }}>Classificar</button></td>
                </tr>
              )) : <tr><td colSpan="3" style={{textAlign: 'center', padding: '20px'}}>Fila vazia.</td></tr>}
            </tbody>
          </table>
        )}
      </main>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Triagem: {itemSelecionado?.paciente?.nome}</h2>
            <div className="modal-body">
              <div className="input-grid">
                <div className="form-group"><label>Temp.</label><input type="number" step="0.1" value={sinaisVitais.temp} onChange={(e) => setSinaisVitais({...sinaisVitais, temp: e.target.value})} /></div>
                <div className="form-group"><label>Sat.</label><input type="number" value={sinaisVitais.sat} onChange={(e) => setSinaisVitais({...sinaisVitais, sat: e.target.value})} /></div>
              </div>
              <div className="form-group"><label>Dor: {sinaisVitais.dor}</label><input type="range" min="0" max="10" value={sinaisVitais.dor} onChange={(e) => setSinaisVitais({...sinaisVitais, dor: e.target.value})} /></div>
            </div>
            <div className="modal-footer">
              <button className="btn-confirmar" onClick={handleFinalizar}>Finalizar</button>
              <button className="btn-cancelar" onClick={() => setShowModal(false)}>Voltar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardTriagem;