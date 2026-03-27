require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

// Teste
app.get('/', (req, res) => {
  res.json({ mensagem: 'API do MedFlow rodando 100%!' });
});

// --- ATENDIMENTOS (Coração da Triagem) ---

// 1. BUSCAR TODOS OS ATENDIMENTOS
app.get('/atendimentos', async (req, res) => {
  try {
    const atendimentos = await prisma.atendimento.findMany({
      include: {
        paciente: true,
        procedimento: true
      },
      orderBy: { criado_em: 'desc' }
    });
    res.json(atendimentos);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao buscar atendimentos.' });
  }
});

// 2. CRIAR NOVO ATENDIMENTO (Entrada na Fila)
app.post('/atendimentos', async (req, res) => {
  try {
    const { tipo, prioridade, paciente_id, procedimento_id } = req.body;
    const novoAtendimento = await prisma.atendimento.create({
      data: {
        tipo,
        prioridade: String(prioridade || 'PENDENTE'),
        paciente_id: parseInt(paciente_id),
        procedimento_id: parseInt(procedimento_id)
      }
    });
    res.status(201).json(novoAtendimento);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao criar atendimento.' });
  }
});

// 3. ATUALIZAR ATENDIMENTO (O que o seu botão "Finalizar" usa)
app.put('/atendimentos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, prioridade, medico_id } = req.body;
    
    const atualizado = await prisma.atendimento.update({
      where: { id: parseInt(id) },
      data: { 
        status, 
        prioridade,
        medico_id: medico_id ? parseInt(medico_id) : undefined 
      }
    });
    res.json(atualizado);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao atualizar atendimento.' });
  }
});

// 4. LIMPAR FILA (O comando que você pediu para o botão laranja)
app.delete('/atendimentos', async (req, res) => {
  try {
    console.log("⚠️ Solicitando limpeza total da fila de atendimentos...");
    await prisma.atendimento.deleteMany({});
    res.json({ mensagem: 'Fila limpa com sucesso!' });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao limpar a fila.' });
  }
});

// --- PACIENTES ---
app.post('/pacientes', async (req, res) => {
  try {
    const { nome, cpf, telefone } = req.body;
    const novo = await prisma.paciente.create({
      data: { nome, cpf, telefone }
    });
    res.status(201).json(novo);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao cadastrar paciente.' });
  }
});

app.get('/pacientes', async (req, res) => {
  try {
    const pacientes = await prisma.paciente.findMany();
    res.json(pacientes);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao buscar pacientes.' });
  }
});

// --- INICIALIZAÇÃO ---
const PORTA = 3333;
app.listen(PORTA, () => {
  console.log(`🚀 Servidor voando na porta http://localhost:${PORTA}`);
});