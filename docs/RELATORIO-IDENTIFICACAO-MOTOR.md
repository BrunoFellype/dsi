# Relatório 1 — Identificação do motor

Execução realizada em 10/11/2026 no DSI, usando o CSV de referência necessário
para o treino real.

- Alvo: `GPA`.
- Variáveis numéricas: `study_hours_per_day`, `sleep_hours`,
  `mental_stress_level`, `class_attendance_percent`, `social_media_hours` e
  `age`.
- Perfil comportamental: K-Means separado da regressão, com as cinco variáveis
  de hábitos, `n_clusters=3`, `random_state=42` e `n_init=10`.
- Tratamento de ausentes: média do treino para o K-Means e imputação mediana
  para variáveis numéricas da regressão.
- Transformações: `StandardScaler` nas variáveis numéricas e
  `OneHotEncoder(handle_unknown="ignore", sparse_output=False)` no perfil.
- Modelos comparados: Ridge (`alpha=1.0`), Random Forest (`250` árvores,
  `max_depth=8`, `min_samples_split=5`, `min_samples_leaf=4`) e
  `HistGradientBoostingRegressor` (`max_iter=150`, `learning_rate=0.03`,
  `max_depth=5`).
- Divisão: 80% treino e 20% teste, `random_state=42`.
- Seleção: maior R² no teste, com desempate pelo menor RMSE.
- Inferência: previsão limitada ao intervalo `[0.0, 4.0]`.

Não foram identificados filtros adicionais no código PISI além da seleção
explícita das variáveis acima e da remoção de registros sem `GPA` no treino.
