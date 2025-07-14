function isDifferentNumber(a, b) {
  return Number(a || 0).toFixed(2) !== Number(b || 0).toFixed(2);
}

async function processCard(cardId) {
  const fields = await getCardFields(cardId);

  const qtdContas = getFieldValue(fields, ids.qtd_contas_ativas);

  // Lucro dinheiro
  let lucroDinheiro = null;
  if (fields.some(f => f.idCustomField === ids.lucro_total_dinheiro)) {
    lucroDinheiro = getFieldValue(fields, ids.lucro_total_dinheiro);
  } else if (fields.some(f => f.idCustomField === ids.lucro_total_dinheiro_depende)) {
    lucroDinheiro = getFieldValue(fields, ids.lucro_total_dinheiro_depende);
  } else {
    lucroDinheiro = 0;
  }
  const lucroEsperadoDinheiro = lucroDinheiro * qtdContas;

  const atualEsperadoDinheiro = getFieldValue(fields, ids.lucro_esperado_dinheiro);
  console.log(`[DEBUG] Card ${cardId} | Atual:`, atualEsperadoDinheiro, '| Novo:', lucroEsperadoDinheiro.toFixed(2));

  if (isDifferentNumber(atualEsperadoDinheiro, lucroEsperadoDinheiro)) {
    await setCustomField(cardId, ids.lucro_esperado_dinheiro, lucroEsperadoDinheiro.toFixed(2));
    console.log(`[Dinheiro] Card ${cardId} atualizado para ${lucroEsperadoDinheiro}`);
  }
}
