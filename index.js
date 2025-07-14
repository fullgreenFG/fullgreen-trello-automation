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

function getFieldValue(fields, id) {
  const field = fields.find(f => f.idCustomField === id);
  if (!field || !field.value) return 0;
  if (field.value.number !== undefined) return Number(field.value.number) || 0;
  if (field.value.text !== undefined) return Number(field.value.text) || 0;
  return 0;
}

function formatNumber(n) {
  if (n === undefined || n === null || n === '') return '0.00';
  return Number(n).toFixed(2);
}

// Atualiza campo personalizado do cartão
async function setCustomField(cardId, fieldId, value) {
  const url = `https://api.trello.com/1/cards/${cardId}/customField/${fieldId}/item?key=${API_KEY}&token=${TOKEN}`;
  await axios.put(url, { value: { number: value.toString() } });
}

// Busca campos personalizados do cartão
async function getCardFields(cardId) {
  const url = `https://api.trello.com/1/cards/${cardId}?customFieldItems=true&key=${API_KEY}&token=${TOKEN}`;
  const { data } = await axios.get(url);
  return data.customFieldItems || [];
}

// Função principal de processamento (SEM LOOP!)
async function processCard(cardId) {
  const fields = await getCardFields(cardId);

  const qtdContas = getFieldValue(fields, ids.qtd_contas_ativas);

  // --- Lógica do dinheiro
  let lucroDinheiro = null;
  if (fields.some(f => f.idCustomField === ids.lucro_total_dinheiro)) {
    lucroDinheiro = getFieldValue(fields, ids.lucro_total_dinheiro);
  } else if (fields.some(f => f.idCustomField === ids.lucro_total_dinheiro_depende)) {
    lucroDinheiro = getFieldValue(fields, ids.lucro_total_dinheiro_depende);
  } else {
    lucroDinheiro = 0;
  }
  const lucroEsperadoDinheiro = lucroDinheiro * qtdContas;

  const atualEsperadoDinheiroField = fields.find(f => f.idCustomField === ids.lucro_esperado_dinheiro);
  const atualEsperadoDinheiro = atualEsperadoDinheiroField && atualEsperadoDinheiroField.value && atualEsperadoDinheiroField.value.number !== undefined
    ? atualEsperadoDinheiroField.value.number
    : 0;

  console.log(`[DEBUG] Card ${cardId} | Dinheiro Atual: '${formatNumber(atualEsperadoDinheiro)}' | Novo: '${formatNumber(lucroEsperadoDinheiro)}'`);

  if (formatNumber(atualEsperadoDinheiro) !== formatNumber(lucroEsperadoDinheiro)) {
    await setCustomField(cardId, ids.lucro_esperado_dinheiro, formatNumber(lucroEsperadoDinheiro));
    console.log(`[Dinheiro] Card ${cardId} atualizado para ${formatNumber(lucroEsperadoDinheiro)}`);
  }

  // --- Lógica do brinde
  let lucroBrinde = null;
  if (fields.some(f => f.idCustomField === ids.lucro_total_brinde)) {
    lucroBrinde = getFieldValue(fields, ids.lucro_total_brinde);
  } else if (fields.some(f => f.idCustomField === ids.lucro_total_brinde_depende)) {
    lucroBrinde = getFieldValue(fields, ids.lucro_total_brinde_depende);
  } else {
    lucroBrinde = 0;
  }
  const lucroEsperadoBrinde = lucroBrinde * qtdContas;

  const atualEsperadoBrindeField = fields.find(f => f.idCustomField === ids.lucro_esperado_brinde);
  const atualEsperadoBrinde = atualEsperadoBrindeField && atualEsperadoBrindeField.value && atualEsperadoBrindeField.value.number !== undefined
    ? atualEsperadoBrindeField.value.number
    : 0;

  console.log(`[DEBUG] Card ${cardId} | Brinde Atual: '${formatNumber(atualEsperadoBrinde)}' | Novo: '${formatNumber(lucroEsperadoBrinde)}'`);

  if (formatNumber(atualEsperadoBrinde) !== formatNumber(lucroEsperadoBrinde)) {
    await setCustomField(cardId, ids.lucro_esperado_brinde, formatNumber(lucroEsperadoBrinde));
    console.log(`[Brinde] Card ${cardId} atualizado para ${formatNumber(lucroEsperadoBrinde)}`);
  }
}

// Webhook de verificação
app.head('/webhook', (req, res) => res.sendStatus(200));

// Webhook principal
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

// Endpoint GET para saúde/monitoramento
app.get('/', (req, res) => {
  res.send('Full Green Trello Webhook ativo!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor webhook ouvindo na porta ${PORT}`);
});
