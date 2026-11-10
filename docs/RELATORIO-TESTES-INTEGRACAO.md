# Relatório 4 — Testes de integração

Testes executados exclusivamente no DSI:

- `pytest -q server/predictor/test_engine.py`: 4 aprovados.
- `npm test -- --test-reporter=dot`: 105 aprovados, 0 falhas.
- `python -m py_compile` nos arquivos Python do motor: aprovado.
- `node --check server/index.js`: aprovado.
- Rota `POST /predicao` com entrada válida: HTTP 200, GPA `3,7336`.
- Rota `POST /predicao` com `dados` inválido: HTTP 400.
- Comparação direta com o PISI: equivalente, diferença `0,0000112252`.

Correções realizadas: criação do motor Python isolado, serviço stdin/stdout,
rota interna da ponte, cliente TypeScript e apresentação na tela Desempenho.
Autenticação, login, Firebase, banco, SIGAA e K-Means de agrupamento de avisos
não foram modificados.

Limitações: o type-check TypeScript não foi executado porque o compilador local
não estava disponível neste checkout; a suíte existente e a validação sintática
dos arquivos JavaScript foram executadas. O serviço depende de Python com
`numpy`, `pandas` e `scikit-learn` instalados conforme
`server/predictor/requirements.txt`.
