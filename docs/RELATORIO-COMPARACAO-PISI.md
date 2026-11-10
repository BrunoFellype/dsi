# Relatório 3 — Comparação com o PISI

O mesmo CSV, parâmetros e entrada foram processados pelo
`ASTRA_Dashboard/analysis/predicao.py` do PISI e pelo motor adaptado no DSI.

| Item | PISI | DSI |
|---|---:|---:|
| Modelo selecionado | Gradient Boosting | Gradient Boosting |
| MAE | 0,1528 | 0,1528 |
| RMSE | 0,2021 | 0,2021 |
| R² | 0,7365 | 0,7365 |
| Previsão de exemplo | 3,7335887748 | 3,7336 |

A diferença absoluta da previsão foi `0,0000112252`, causada pelo arredondamento
do valor retornado pela API do DSI. Os resultados são equivalentes dentro dessa
tolerância. O arquivo do PISI foi somente lido; nenhuma alteração foi feita
nele.
