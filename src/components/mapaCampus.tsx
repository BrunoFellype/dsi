import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, TextInput, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

const NativeWebView = WebView as React.ComponentType<any>;

import { Cartao, Icone, Selo, Txt } from '@/components/ui';
import {
  CENTRO_UFRPE,
  LOCAIS_UFRPE,
  encontrarLocalDoCurso,
  type LocalCampus,
} from '@/data/ufrpeCampus';
import { useTheme } from '@/hooks/use-theme';

interface MapaCampusProps {
  cursoUsuario?: string | null;
  onIrParaPerfil?: () => void;
}

export function MapaCampus({ cursoUsuario, onIrParaPerfil }: MapaCampusProps) {
  const t = useTheme();
  const webViewRef = useRef<any>(null);

  const localDoCurso = useMemo(() => encontrarLocalDoCurso(cursoUsuario), [cursoUsuario]);
  const [selecionado, setSelecionado] = useState<LocalCampus>(localDoCurso ?? LOCAIS_UFRPE[0]);
  const [busca, setBusca] = useState('');
  const [mostrandoResultados, setMostrandoResultados] = useState(false);

  // Atualiza o foco automaticamente se o usuário alterar o curso no perfil
  useEffect(() => {
    if (localDoCurso) {
      focarLocal(localDoCurso);
    }
  }, [localDoCurso?.id]);

  const resultadosBusca = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return [];
    return LOCAIS_UFRPE.filter((item) => {
      const bateNome = item.nome.toLowerCase().includes(termo);
      const bateSigla = item.sigla?.toLowerCase().includes(termo);
      const bateCurso = item.cursosAtrelados?.some((c) => c.toLowerCase().includes(termo));
      return bateNome || bateSigla || bateCurso;
    });
  }, [busca]);

  function focarLocal(local: LocalCampus) {
    setSelecionado(local);
    setMostrandoResultados(false);
    const script = `
      if (window.focarLocal) {
        window.focarLocal(${local.latitude}, ${local.longitude}, "${local.id}");
      }
      true;
    `;
    webViewRef.current?.injectJavaScript(script);
  }

  const htmlMapa = useMemo(() => {
    const locaisJson = JSON.stringify(LOCAIS_UFRPE);
    const inicialLat = (localDoCurso ?? LOCAIS_UFRPE[0]).latitude;
    const inicialLng = (localDoCurso ?? LOCAIS_UFRPE[0]).longitude;
    const inicialId = (localDoCurso ?? LOCAIS_UFRPE[0]).id;
    const corPrimaria = t.primary || '#2563EB';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=yes" />
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
          <style>
            html, body, #map {
              height: 100%;
              width: 100%;
              margin: 0;
              padding: 0;
              background: #e5e7eb;
              font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            }
            .pino-custom {
              display: flex;
              align-items: center;
              justify-content: center;
              border-radius: 999px;
              font-weight: 700;
              font-size: 10px;
              color: #fff;
              border: 2px solid #fff;
              box-shadow: 0 2px 6px rgba(0,0,0,0.35);
            }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script>
            const locais = ${locaisJson};
            const corPrimaria = "${corPrimaria}";
            let idAtivo = "${inicialId}";

            const map = L.map('map', {
              zoomControl: true,
              attributionControl: false
            }).setView([${inicialLat}, ${inicialLng}], 17);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              maxZoom: 19
            }).addTo(map);

            const marcadores = {};

            function criarIcone(local, ativo) {
              const tamanho = ativo ? 34 : 26;
              const bg = ativo ? corPrimaria : '#475569';
              const texto = local.sigla ? local.sigla.slice(0, 4) : '•';
              return L.divIcon({
                className: '',
                html: '<div class="pino-custom" style="width:' + tamanho + 'px;height:' + tamanho + 'px;background:' + bg + ';">' + texto + '</div>',
                iconSize: [tamanho, tamanho],
                iconAnchor: [tamanho / 2, tamanho / 2]
              });
            }

            locais.forEach(local => {
              const marker = L.marker([local.latitude, local.longitude], {
                icon: criarIcone(local, local.id === idAtivo)
              }).addTo(map);

              marker.on('click', () => {
                window.ReactNativeWebView.postMessage(JSON.stringify({ tipo: 'selecionar', id: local.id }));
                window.focarLocal(local.latitude, local.longitude, local.id);
              });

              marcadores[local.id] = { marker, local };
            });

            window.focarLocal = function(lat, lng, novoId) {
              if (marcadores[idAtivo]) {
                marcadores[idAtivo].marker.setIcon(criarIcone(marcadores[idAtivo].local, false));
              }
              idAtivo = novoId;
              if (marcadores[idAtivo]) {
                marcadores[idAtivo].marker.setIcon(criarIcone(marcadores[idAtivo].local, true));
              }
              map.flyTo([lat, lng], 17, { duration: 0.6 });
            };

            window.verCampusTodo = function() {
              map.flyTo([${CENTRO_UFRPE.latitude}, ${CENTRO_UFRPE.longitude}], 15, { duration: 0.6 });
            };
          </script>
        </body>
      </html>
    `;
  }, [localDoCurso?.id, t.primary]);

  return (
    <Cartao style={{ gap: 12, padding: 14 }}>
      {/* Cabeçalho do bloco */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Txt v="subtitulo">Mapa do Campus · UFRPE</Txt>
          <Txt v="legenda" cor="textSecondary" numberOfLines={1}>
            {localDoCurso
              ? `Seu curso: ${cursoUsuario}`
              : 'Defina seu curso no perfil para destacar seu prédio'}
          </Txt>
        </View>

        {localDoCurso && selecionado.id !== localDoCurso.id ? (
          <Pressable
            onPress={() => focarLocal(localDoCurso)}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 999,
              backgroundColor: t.primarySoft,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Icone nome="locate-outline" tamanho={14} cor="primary" />
            <Txt v="legenda" cor="primary" style={{ fontWeight: '700' }}>
              Meu prédio
            </Txt>
          </Pressable>
        ) : !localDoCurso && onIrParaPerfil ? (
          <Pressable onPress={onIrParaPerfil}>
            <Selo rotulo="Configurar" tom="neutro" />
          </Pressable>
        ) : null}
      </View>

      {/* Barra de pesquisa interna do campus */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: t.border,
          backgroundColor: t.surface,
          borderRadius: 10,
          paddingHorizontal: 10,
          minHeight: 40,
          gap: 8,
        }}
      >
        <Icone nome="search-outline" tamanho={18} cor="textMuted" />
        <TextInput
          value={busca}
          onChangeText={(texto) => {
            setBusca(texto);
            setMostrandoResultados(true);
          }}
          onFocus={() => setMostrandoResultados(true)}
          placeholder="Buscar prédio, curso, RU, Biblioteca..."
          placeholderTextColor={t.textMuted}
          style={{ flex: 1, color: t.text, fontSize: 14, paddingVertical: 6 }}
        />
        {busca.length > 0 ? (
          <Pressable
            onPress={() => {
              setBusca('');
              setMostrandoResultados(false);
            }}
            hitSlop={8}
          >
            <Icone nome="close-circle" tamanho={18} cor="textMuted" />
          </Pressable>
        ) : null}
      </View>

      {/* Lista suspensa de resultados da pesquisa */}
      {mostrandoResultados && busca.trim().length > 0 ? (
        <View
          style={{
            borderWidth: 1,
            borderColor: t.border,
            borderRadius: 10,
            backgroundColor: t.surface,
            overflow: 'hidden',
          }}
        >
          {resultadosBusca.length === 0 ? (
            <View style={{ padding: 12 }}>
              <Txt v="legenda" cor="textMuted">
                Nenhum local encontrado para "{busca}".
              </Txt>
            </View>
          ) : (
            resultadosBusca.slice(0, 5).map((item, index) => (
              <Pressable
                key={item.id}
                onPress={() => {
                  setBusca(item.sigla ? `${item.sigla} - ${item.nome}` : item.nome);
                  focarLocal(item);
                }}
                style={{
                  padding: 10,
                  borderTopWidth: index === 0 ? 0 : 1,
                  borderTopColor: t.border,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Txt v="corpo" style={{ fontWeight: '600', fontSize: 14 }} numberOfLines={1}>
                    {item.nome}
                  </Txt>
                  {item.cursosAtrelados?.length ? (
                    <Txt v="legenda" cor="textSecondary" numberOfLines={1}>
                      {item.cursosAtrelados.join(' · ')}
                    </Txt>
                  ) : null}
                </View>
                <Icone nome="arrow-forward" tamanho={16} cor="primary" />
              </Pressable>
            ))
          )}
        </View>
      ) : null}

      {/* Mapa interativo */}
      <View
        style={{
          height: 230,
          borderRadius: 12,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: t.border,
        }}
      >
        {Platform.OS === 'web' ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
            <Txt v="legenda" cor="textSecondary" style={{ textAlign: 'center' }}>
              Mapa interativo disponível no aplicativo móvel (Expo Go).
            </Txt>
          </View>
        ) : (
          <NativeWebView
            ref={webViewRef}
            source={{ html: htmlMapa }}
            style={{ flex: 1 }}
            nestedScrollEnabled
            javaScriptEnabled
            domStorageEnabled
            onMessage={(event: WebViewMessageEvent) => {
              try {
                const msg = JSON.parse(event.nativeEvent.data);
                if (msg.tipo === 'selecionar') {
                  const achado = LOCAIS_UFRPE.find((l) => l.id === msg.id);
                  if (achado) setSelecionado(achado);
                }
              } catch {}
            }}
          />
        )}
      </View>

      {/* Card de resumo do pino selecionado */}
      <View
        style={{
          backgroundColor: t.surface,
          borderRadius: 10,
          padding: 10,
          borderWidth: 1,
          borderColor: t.border,
          gap: 4,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <Txt v="subtitulo" style={{ fontSize: 15, flex: 1 }} numberOfLines={1}>
            {selecionado.nome}
          </Txt>
          {localDoCurso?.id === selecionado.id ? (
            <Selo rotulo="Seu prédio" tom="neutro" />
          ) : null}
        </View>
        <Txt v="legenda" cor="textSecondary">
          {selecionado.descricao}
        </Txt>
      </View>
    </Cartao>
  );
}