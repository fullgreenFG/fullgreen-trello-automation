const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

const API_KEY = '62d422d1557d79eed7835926aa21c62a';
const TOKEN = 'ATTA56b932b986afaee5001b97ec719d807659a38600748f8118bbfc858ef3c6d2f746A0A726';

// IDs dos campos personalizados
const ids = {
  lucro_total_dinheiro: '680a5df7578533f08e7c83ce',
  lucro_total_brinde: '680a5eb0cadcb4d1a09593ff',
  lucro_total_dinheiro_depende: '681d60021c12620c965fd883',
  lucro_total_brinde_depende: '681d60388430f7bfdb460282',
  qtd_contas_ativas: '6860e863316f986b8b4e4994',
  lucro_esperado_dinheiro: '68754ff1715e19ba964d0dd1',
  lucro_esperado_brinde: '68754fc9cc1d06da0409b1ee'
};

// Função para buscar os campos de um card
async function getCardFields(cardId) {
  const url = `https://api.trello.com/1/cards/${cardId}?customFieldItems=true&key=${API_KEY}&token=${TOKEN}`;
  const { data } = await axios.get(url);
  return data.customFieldItems || [];
}

// Função para atualizar campo personalizado
async function setCustomField(cardId, fieldId, value) {
  const url = `https://api.trello.com/1/cards/${cardId}/customField/${fieldId}/item?key=${API_KEY}&token=${TOKEN}`;
  await axios.put(url, { value: { number: value.toString() } });
}

// Função para extrair valor do campo
function getFieldValue(fields, id) {
  const field = fields.find(f => f.idCustomField === id);
  if (!field || !field.value) return 0;
  if (field.value.number !== undefined) return Number(field.value.number) || 0;
  if (field.value.text !== undefined) return Number(field.value.text) || 0;
  return 0;
}

// Lógica para processar 1 card
async function processCard(cardId) {
  const fields = await getCardFields(cardId);

  const qtdContas = getFieldValue(fields, ids.qtd_contas_ativas);

  // Lucro dinheiro
  let lucroDinheiro = getFieldValue(fields, ids.lucro_total_dinheiro);
  if (!lucroDinheiro) lucroDinheiro = getFieldValue(fields, ids.lucro_total_dinheiro_depende);
  const lucroEsperadoDinheiro = lucroDinheiro * qtdContas;

  // Lucro brinde
  let lucroBrinde = getFieldValue(fields, ids.lucro_total_brinde);
  if (!lucroBrinde) lucroBrinde = getFieldValue(fields, ids.lucro_total_brinde_depende);
  const lucroEsperadoBrinde = lucroBrinde * qtdContas;

  // Atualiza campos
  if (lucroDinheiro && qtdContas) {
    await setCustomField(cardId, ids.lucro_esperado_dinheiro, lucroEsperadoDinheiro.toFixed(2));
    console.log(`[Dinheiro] Card ${cardId} atualizado para ${lucroEsperadoDinheiro}`);
  }
  if (lucroBrinde && qtdContas) {
    await setCustomField(cardId, ids.lucro_esperado_brinde, lucroEsperadoBrinde.toFixed(2));
    console.log(`[Brinde] Card ${cardId} atualizado para ${lucroEsperadoBrinde}`);
  }
}

// Endpoint para validação do webhook do Trello
app.head('/webhook', (req, res) => res.sendStatus(200));

// Endpoint que recebe eventos do Trello
app.post('/webhook', async (req, res) => {
  const action = req.body.action || {};
  if (action.type === 'updateCustomFieldItem' && action.data && action.data.card && action.data.card.id) {
    try {
      await processCard(action.data.card.id);
    } catch (e) {
      console.error('Erro ao processar card:', e.message);
    }
  }
  res.sendStatus(200);
});

// Render usa process.env.PORT, local usa 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor webhook ouvindo na porta ${PORT}`);
});
