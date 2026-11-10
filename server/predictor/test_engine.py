import math
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parents[1]))
from predictor.engine import FEATURES_HABITOS_CLUSTER, carregar_motor, prever


@pytest.fixture(scope="module")
def motor():
    return carregar_motor()


def test_treino_usa_modelos_e_divisao_do_pisi(motor):
    assert motor["quantidade_treino"] == 8000
    assert motor["quantidade_teste"] == 2000
    assert {item["Modelo"] for item in motor["resultados"]} == {
        "Regressão Ridge",
        "Random Forest",
        "Gradient Boosting",
    }
    assert motor["nome"] == "Gradient Boosting"


def test_previsao_tem_perfil_e_limites(motor):
    resultado = prever(
        motor,
        {
            "study_hours_per_day": 3.5,
            "sleep_hours": 7,
            "mental_stress_level": 4,
            "class_attendance_percent": 90,
            "social_media_hours": 2.8,
        },
    )
    assert 0.0 <= resultado["gpa"] <= 4.0
    assert resultado["perfil"] in {
        "Perfil Comportamental A",
        "Perfil Comportamental B",
        "Perfil Comportamental C",
    }


def test_previsao_imputa_dados_ausentes(motor):
    resultado = prever(motor, {FEATURES_HABITOS_CLUSTER[0]: None})
    assert math.isfinite(resultado["gpa"])


def test_entrada_invalida(motor):
    with pytest.raises(ValueError):
        prever(motor, [])
