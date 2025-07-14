// ...código anterior...

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

  // Sempre atualiza se mudou, mesmo que seja zero
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
