import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Linking, Platform, Pressable, TextInput, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { Cartao, Icone, Selo, Txt } from '@/components/ui';
import {
  CENTRO_UFRPE,
  LOCAIS_UFRPE,
  buscarLocais,
  encontrarLocalDoCurso,
  linkComoChegar,
  type LocalCampus,
} from '@/data/ufrpeCampus';
import { useTheme } from '@/hooks/use-theme';

const NativeWebView = WebView as React.ComponentType<any>;

/** Mensagem que o mapa (Leaflet) manda para o app: pino tocado ou falha ao carregar. */
type MensagemMapa = { tipo: 'selecionar'; id: string } | { tipo: 'erro' };

function lerMensagemDoMapa(bruto: unknown): MensagemMapa | null {
  if (typeof bruto !== 'string') return null;
  try {
    const msg = JSON.parse(bruto);
    if (msg?.origem !== 'astra-mapa') return null;
    if (msg.tipo === 'selecionar' && typeof msg.id === 'string') return { tipo: 'selecionar', id: msg.id };
    if (msg.tipo === 'erro') return { tipo: 'erro' };
    return null;
  } catch {
    return null;
  }
}

interface MapaCampusProps {
  cursoUsuario?: string | null;
  onIrParaPerfil?: () => void;
}

export function MapaCampus({ cursoUsuario, onIrParaPerfil }: MapaCampusProps) {
  const t = useTheme();
  const webViewRef = useRef<any>(null);
  const iframeRef = useRef<any>(null);

  const localDoCurso = useMemo(() => encontrarLocalDoCurso(cursoUsuario), [cursoUsuario]);
  const [selecionado, setSelecionado] = useState<LocalCampus>(localDoCurso ?? LOCAIS_UFRPE[0]);
  const [busca, setBusca] = useState('');
  const [mostrandoResultados, setMostrandoResultados] = useState(false);
  const [falhou, setFalhou] = useState(false);

  /** Executa uma função do mapa, tanto no celular (WebView) quanto no navegador (iframe). */
  const executarNoMapa = useCallback((codigo: string) => {
    if (Platform.OS === 'web') {
      try {
        iframeRef.current?.contentWindow?.eval?.(codigo);
      } catch {
        // iframe ainda carregando: o mapa abre no local inicial
      }
      return;
    }
    webViewRef.current?.injectJavaScript(`${codigo}; true;`);
  }, []);

  const focarLocal = useCallback(
    (local: LocalCampus) => {
      setSelecionado(local);
      setMostrandoResultados(false);
      executarNoMapa(
        `if (window.focarLocal) window.focarLocal(${local.latitude}, ${local.longitude}, ${JSON.stringify(local.id)})`
      );
    },
    [executarNoMapa]
  );

  const verCampusTodo = useCallback(() => {
    executarNoMapa('if (window.verCampusTodo) window.verCampusTodo()');
  }, [executarNoMapa]);

  const tratarMensagem = useCallback((msg: MensagemMapa | null) => {
    if (!msg) return;
    if (msg.tipo === 'erro') {
      setFalhou(true);
      return;
    }
    const achado = LOCAIS_UFRPE.find((l) => l.id === msg.id);
    if (achado) setSelecionado(achado);
  }, []);

  // Se o curso mudar no perfil, o pino selecionado passa a ser o novo prédio.
  // (O HTML do mapa é refeito com esse prédio no centro, então não precisa mover o mapa aqui.)
  const [cursoAnterior, setCursoAnterior] = useState(localDoCurso?.id);
  if (localDoCurso?.id !== cursoAnterior) {
    setCursoAnterior(localDoCurso?.id);
    if (localDoCurso) setSelecionado(localDoCurso);
  }

  // No navegador o mapa roda num iframe e conversa por window.postMessage
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const aoReceber = (e: MessageEvent) => {
      if (iframeRef.current && e.source !== iframeRef.current.contentWindow) return;
      tratarMensagem(lerMensagemDoMapa(e.data));
    };
    window.addEventListener('message', aoReceber);
    return () => window.removeEventListener('message', aoReceber);
  }, [tratarMensagem]);

  const resultadosBusca = useMemo(() => buscarLocais(busca.trim()), [busca]);

  function abrirComoChegar() {
    Linking.openURL(linkComoChegar(selecionado)).catch(() => {});
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

            // Envia a mensagem para o app: WebView no celular, janela pai (iframe) no navegador
            function enviar(msg) {
              msg.origem = 'astra-mapa';
              const texto = JSON.stringify(msg);
              if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(texto);
              else if (window.parent && window.parent !== window) window.parent.postMessage(texto, '*');
            }

            // Sem internet o Leaflet não carrega: avisa o app para mostrar a mensagem de erro
            if (typeof L === 'undefined') {
              enviar({ tipo: 'erro' });
              throw new Error('Leaflet indisponivel');
            }

            const map = L.map('map', {
              zoomControl: true,
              attributionControl: true
            }).setView([${inicialLat}, ${inicialLng}], 17);
            map.attributionControl.setPrefix(false);

            // A licença do OpenStreetMap exige o crédito visível no mapa
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              maxZoom: 19,
              attribution: '&copy; OpenStreetMap'
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
                enviar({ tipo: 'selecionar', id: local.id });
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
  }, [localDoCurso, t.primary]);

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
                Nenhum local encontrado para &quot;{busca}&quot;.
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
        {falhou ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16, gap: 6 }}>
            <Icone nome="cloud-offline-outline" tamanho={22} cor="textMuted" />
            <Txt v="legenda" cor="textSecondary" style={{ textAlign: 'center' }}>
              Não foi possível carregar o mapa. Verifique a internet.
            </Txt>
            <Pressable onPress={() => setFalhou(false)} hitSlop={8} accessibilityRole="button" style={{ minHeight: 44, justifyContent: 'center' }}>
              <Txt v="legenda" cor="primary" style={{ fontWeight: '700' }}>
                Tentar de novo
              </Txt>
            </Pressable>
          </View>
        ) : Platform.OS === 'web' ? (
          React.createElement('iframe', {
            ref: iframeRef,
            srcDoc: htmlMapa,
            title: 'Mapa do campus da UFRPE',
            style: { border: 0, width: '100%', height: '100%' },
          })
        ) : (
          <NativeWebView
            ref={webViewRef}
            source={{ html: htmlMapa }}
            style={{ flex: 1 }}
            nestedScrollEnabled
            javaScriptEnabled
            domStorageEnabled
            originWhitelist={['*']}
            onError={() => setFalhou(true)}
            onMessage={(event: WebViewMessageEvent) => tratarMensagem(lerMensagemDoMapa(event.nativeEvent.data))}
          />
        )}
      </View>

      {/* Atalhos do mapa */}
      <View style={{ flexDirection: 'row', gap: 16, flexWrap: 'wrap' }}>
        <AcaoMapa icone="navigate-outline" rotulo="Como chegar" onPress={abrirComoChegar} />
        <AcaoMapa icone="expand-outline" rotulo="Ver campus todo" onPress={verCampusTodo} />
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
function AcaoMapa({
  icone,
  rotulo,
  onPress,
}: {
  icone: 'navigate-outline' | 'expand-outline';
  rotulo: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 6 }}
    >
      <Icone nome={icone} tamanho={16} cor="primary" />
      <Txt v="legenda" cor="primary" style={{ fontWeight: '700' }}>
        {rotulo}
      </Txt>
    </Pressable>
  );
}
