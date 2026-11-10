import json
import os
import sys
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import HistGradientBoostingRegressor, RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler


RANDOM_STATE = 42
FEATURES_HABITOS_CLUSTER = [
    "study_hours_per_day",
    "sleep_hours",
    "mental_stress_level",
    "class_attendance_percent",
    "social_media_hours",
]
FEATURES_NUMERICAS = FEATURES_HABITOS_CLUSTER + ["age"]
NOMES_PERFIS = [
    "Perfil Comportamental A",
    "Perfil Comportamental B",
    "Perfil Comportamental C",
]


def _avaliar(real, previsto):
    return {
        "MAE": round(float(mean_absolute_error(real, previsto)), 4),
        "RMSE": round(float(np.sqrt(mean_squared_error(real, previsto))), 4),
        "R²": round(float(r2_score(real, previsto)), 4),
    }


def treinar_motor(df):
    if "GPA" not in df.columns:
        raise ValueError("A coluna GPA não foi encontrada no dataset.")

    dados = df.dropna(subset=["GPA"]).copy()
    treino, teste = train_test_split(dados, test_size=0.20, random_state=RANDOM_STATE)
    treino = treino.copy()
    teste = teste.copy()
    medias_habitos = treino[FEATURES_HABITOS_CLUSTER].mean()
    scaler_perfil = StandardScaler()
    X_habitos = scaler_perfil.fit_transform(
        treino[FEATURES_HABITOS_CLUSTER].fillna(medias_habitos)
    )
    kmeans = KMeans(n_clusters=3, random_state=RANDOM_STATE, n_init=10)
    ids_treino = kmeans.fit_predict(X_habitos)
    ordem = (
        pd.Series(treino["GPA"].to_numpy(), index=ids_treino)
        .groupby(level=0)
        .mean()
        .sort_values(ascending=False)
        .index.tolist()
    )
    mapa_perfis = {cluster_id: NOMES_PERFIS[pos] for pos, cluster_id in enumerate(ordem)}
    treino["cluster_perfil"] = pd.Series(ids_treino, index=treino.index).map(mapa_perfis)
    teste_habitos = teste[FEATURES_HABITOS_CLUSTER].fillna(medias_habitos)
    teste["cluster_perfil"] = pd.Series(
        kmeans.predict(scaler_perfil.transform(teste_habitos)), index=teste.index
    ).map(mapa_perfis)

    features = FEATURES_NUMERICAS + ["cluster_perfil"]
    transformers = [
        (
            "numericas",
            Pipeline(
                [
                    ("imputer", SimpleImputer(strategy="median")),
                    ("scaler", StandardScaler()),
                ]
            ),
            FEATURES_NUMERICAS,
        ),
        (
            "categoricas",
            Pipeline(
                [
                    ("imputer", SimpleImputer(strategy="constant", fill_value="Desconhecido")),
                    ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
                ]
            ),
            ["cluster_perfil"],
        ),
    ]
    preprocessor = ColumnTransformer(transformers=transformers)
    modelos = {
        "Regressão Ridge": Ridge(alpha=1.0, random_state=RANDOM_STATE),
        "Random Forest": RandomForestRegressor(
            n_estimators=250,
            max_depth=8,
            min_samples_split=5,
            min_samples_leaf=4,
            random_state=RANDOM_STATE,
            n_jobs=-1,
        ),
        "Gradient Boosting": HistGradientBoostingRegressor(
            max_iter=150,
            learning_rate=0.03,
            max_depth=5,
            random_state=RANDOM_STATE,
        ),
    }
    X_train, y_train = treino[features], treino["GPA"]
    X_test, y_test = teste[features], teste["GPA"]
    resultados = []
    pipelines = {}
    for nome, modelo in modelos.items():
        pipeline = Pipeline([("preprocessamento", preprocessor), ("modelo", modelo)])
        pipeline.fit(X_train, y_train)
        previsto_teste = np.clip(pipeline.predict(X_test), 0.0, 4.0)
        previsto_treino = np.clip(pipeline.predict(X_train), 0.0, 4.0)
        resultados.append(
            {
                "Modelo": nome,
                **_avaliar(y_test, previsto_teste),
                "R² (treino)": _avaliar(y_train, previsto_treino)["R²"],
                "RMSE (treino)": _avaliar(y_train, previsto_treino)["RMSE"],
            }
        )
        pipelines[nome] = pipeline
    resultados.sort(key=lambda item: (-item["R²"], item["RMSE"]))
    escolhido = resultados[0]
    return {
        "modelo": pipelines[escolhido["Modelo"]],
        "nome": escolhido["Modelo"],
        "features": features,
        "features_habitos_cluster": FEATURES_HABITOS_CLUSTER,
        "medias_habitos_treino": medias_habitos,
        "scaler_perfil": scaler_perfil,
        "kmeans_perfil": kmeans,
        "mapa_perfis": mapa_perfis,
        "resultados": resultados,
        "quantidade_treino": len(X_train),
        "quantidade_teste": len(X_test),
    }


def carregar_motor():
    dataset = Path(__file__).parent / "data" / "global_university_students_performance_habits_10000.csv"
    if not dataset.exists():
        raise FileNotFoundError(f"Dataset do motor não encontrado: {dataset}")
    return treinar_motor(pd.read_csv(dataset))


def prever(motor, entrada):
    if not isinstance(entrada, dict):
        raise ValueError("Os dados da previsão devem ser um objeto.")
    linha = {coluna: entrada.get(coluna) for coluna in FEATURES_NUMERICAS}
    habitos = pd.DataFrame([linha])[FEATURES_HABITOS_CLUSTER].fillna(
        motor["medias_habitos_treino"]
    )
    cluster_id = motor["kmeans_perfil"].predict(
        motor["scaler_perfil"].transform(habitos)
    )[0]
    linha["cluster_perfil"] = motor["mapa_perfis"][int(cluster_id)]
    frame = pd.DataFrame([linha], columns=motor["features"])
    valor = float(np.clip(motor["modelo"].predict(frame)[0], 0.0, 4.0))
    return {
        "gpa": round(valor, 4),
        "modelo": motor["nome"],
        "perfil": linha["cluster_perfil"],
        "features": motor["features"],
    }


def executar_requisicao(requisicao, motor):
    if requisicao.get("tipo") != "prever":
        raise ValueError("Tipo de requisição inválido.")
    return prever(motor, requisicao.get("dados"))


def main():
    motor = carregar_motor()
    for linha in sys.stdin:
        try:
            resposta = {"ok": True, "resultado": executar_requisicao(json.loads(linha), motor)}
        except (ValueError, TypeError, KeyError, FileNotFoundError) as erro:
            resposta = {"ok": False, "erro": str(erro)}
        print(json.dumps(resposta, ensure_ascii=False), flush=True)


if __name__ == "__main__":
    main()
