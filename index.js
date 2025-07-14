async function processCard(cardId) {
  const fields = await getCardFields(cardId);

  const qtdContas = getFieldValue(fields, ids.qtd_contas_ativas);

  // Lucro dinheiro: PRIORIZE o campo preenchido (mesmo se for zero)
  let lucroDinheiro = null;
  if (fields.some(f => f.idCustomField === ids.lucro_total_dinheiro)) {
    lucroDinheiro = getFieldValue(fields, ids.lucro_total_dinheiro);
  } else if (fields.some(f => f.idCustomField === ids.lucro_total_dinheiro_depende)) {
    lucroDinheiro = getFieldValue(fields, ids.lucro_total_dinheiro_depende);
  } else {
    lucroDinheiro = 0;
  }
  const lucroEsperadoDinheiro = lucroDinheiro * qtdContas;

  // Lucro brinde: mesma lógica
  let lucroBrinde = null;
  if (fields.some(f => f.idCustomField === ids.lucro_total_brinde)) {
    lucroBrinde = getFieldValue(fields, ids.lucro_total_brinde);
  } else if (fields.some(f => f.idCustomField === ids.lucro_total_brinde_depende)) {
    lucroBrinde = getFieldValue(fields, ids.lucro_total_brinde_depende);
  } else {
    lucroBrinde = 0;
  }
  const lucroEsperadoBrinde = lucroBrinde * qtdContas;

  // Sempre atualiza se mudou, mesmo para zero
  const atualEsperadoDinheiro = getFieldValue(fields, ids.lucro_esperado_dinheiro);
  if (
    Number(atualEsperadoDinheiro).toFixed(2) !== lucroEsperadoDinheiro.toFixed(2)
  ) {
    await setCustomField(cardId, ids.lucro_esperado_dinheiro, lucroEsperadoDinheiro.toFixed(2));
    console.log(`[Dinheiro] Card ${cardId} atualizado para ${lucroEsperadoDinheiro}`);
  }

  const atualEsperadoBrinde = getFieldValue(fields, ids.lucro_esperado_brinde);
  if (
    Number(atualEsperadoBrinde).toFixed(2) !== lucroEsperadoBrinde.toFixed(2)
  ) {
    await setCustomField(cardId, ids.lucro_esperado_brinde, lucroEsperadoBrinde.toFixed(2));
    console.log(`[Brinde] Card ${cardId} atualizado para ${lucroEsperadoBrinde}`);
  }
}
