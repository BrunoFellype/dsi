import { Icone, Txt } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { paginaDoDeslocamento } from '@/lib/galeria';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCallback, useRef, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

interface CarrosselProps {
  imagens: string[];
  /** Altura da faixa de imagens no cartão. */
  altura?: number;
  /** Quando informado, mostra o botão de remover a foto atual. */
  onRemover?: (indice: number) => void;
  /** Texto usado na leitura de tela (ex.: "Fotos do aviso"). */
  rotulo?: string;
}

/**
 * Carrossel horizontal de imagens com paginação, indicadores e visualização em tela cheia.
 * Usa só FlatList + expo-image (sem biblioteca extra), funciona no Android, iOS e web.
 */
export function CarrosselImagens({ imagens, altura = 190, onRemover, rotulo = 'Fotos' }: CarrosselProps) {
  const t = useTheme();
  const [telaCheia, setTelaCheia] = useState<number | null>(null);
  const [paginaAtual, setPaginaAtual] = useState(0);

  if (imagens.length === 0) return null;
  const pagina = Math.min(paginaAtual, imagens.length - 1);

  return (
    <View style={{ gap: 8 }}>
      <View style={{ borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: t.border, backgroundColor: t.surfaceAlt }}>
        <Faixa
          imagens={imagens}
          altura={altura}
          pagina={pagina}
          onPagina={setPaginaAtual}
          ajuste="cover"
          rotulo={rotulo}
          onToque={(i) => setTelaCheia(i)}
        />

        {imagens.length > 1 ? (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              backgroundColor: 'rgba(0,0,0,0.55)',
              borderRadius: 999,
              paddingHorizontal: 8,
              paddingVertical: 2,
            }}
          >
            <Txt v="legenda" style={{ color: '#fff', fontWeight: '700' }}>
              {pagina + 1}/{imagens.length}
            </Txt>
          </View>
        ) : null}

        {onRemover ? (
          <Pressable
            onPress={() => onRemover(pagina)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Remover foto ${pagina + 1}`}
            style={{
              position: 'absolute',
              top: 8,
              left: 8,
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: 'rgba(0,0,0,0.55)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icone nome="trash-outline" tamanho={16} cor="onPrimary" />
          </Pressable>
        ) : null}
      </View>

      {imagens.length > 1 ? <Indicadores total={imagens.length} pagina={pagina} /> : null}

      <Modal
        visible={telaCheia !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setTelaCheia(null)}
        statusBarTranslucent
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.94)', justifyContent: 'center' }}>
          {telaCheia !== null ? (
            <TelaCheia imagens={imagens} inicial={telaCheia} rotulo={rotulo} onFechar={() => setTelaCheia(null)} />
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

function TelaCheia({
  imagens,
  inicial,
  rotulo,
  onFechar,
}: {
  imagens: string[];
  inicial: number;
  rotulo: string;
  onFechar: () => void;
}) {
  const [pagina, setPagina] = useState(inicial);
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, justifyContent: 'center' }}>
      <Faixa imagens={imagens} altura="100%" pagina={pagina} onPagina={setPagina} ajuste="contain" rotulo={rotulo} />
      <View style={{ position: 'absolute', bottom: 24 + insets.bottom, left: 0, right: 0, alignItems: 'center', gap: 8 }}>
        {imagens.length > 1 ? <Indicadores total={imagens.length} pagina={pagina} claro /> : null}
        <Txt v="legenda" style={{ color: '#fff' }}>
          {pagina + 1} de {imagens.length}
        </Txt>
      </View>
      <Pressable
        onPress={onFechar}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Fechar fotos"
        style={{
          position: 'absolute',
          top: 16 + insets.top,
          right: 20,
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: 'rgba(255,255,255,0.15)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icone nome="close" tamanho={24} cor="onPrimary" />
      </Pressable>
    </View>
  );
}

/** Faixa paginada de imagens, compartilhada pelo cartão e pela tela cheia. */
function Faixa({
  imagens,
  altura,
  pagina,
  onPagina,
  ajuste,
  rotulo,
  onToque,
}: {
  imagens: string[];
  altura: number | '100%';
  pagina: number;
  onPagina: (p: number) => void;
  ajuste: 'cover' | 'contain';
  rotulo: string;
  onToque?: (indice: number) => void;
}) {
  const lista = useRef<FlatList<string>>(null);
  const [largura, setLargura] = useState(0);
  // Altura em pixels: no navegador, height '100%' dentro da FlatList vira 0
  const [alturaMedida, setAlturaMedida] = useState(0);
  const posicionado = useRef(false);

  const aoMedir = useCallback(
    (e: LayoutChangeEvent) => {
      const w = Math.round(e.nativeEvent.layout.width);
      const h = Math.round(e.nativeEvent.layout.height);
      if (h !== alturaMedida) setAlturaMedida(h);
      if (w === largura) return;
      setLargura(w);
      // Abre na foto tocada (tela cheia) assim que a largura for conhecida
      if (!posicionado.current && pagina > 0) {
        posicionado.current = true;
        requestAnimationFrame(() => lista.current?.scrollToOffset({ offset: pagina * w, animated: false }));
      }
    },
    [largura, alturaMedida, pagina]
  );

  const aoRolar = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const p = paginaDoDeslocamento(e.nativeEvent.contentOffset.x, largura, imagens.length);
    if (p !== pagina) onPagina(p);
  };

  const irPara = (p: number) => {
    const alvo = Math.min(Math.max(p, 0), imagens.length - 1);
    lista.current?.scrollToOffset({ offset: alvo * largura, animated: true });
    onPagina(alvo);
  };

  return (
    <View onLayout={aoMedir} style={{ height: altura, width: '100%' }}>
      {largura > 0 && alturaMedida > 0 ? (
        <FlatList
          ref={lista}
          data={imagens}
          keyExtractor={(url, i) => `${i}-${url}`}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={aoRolar}
          scrollEventThrottle={16}
          nestedScrollEnabled
          getItemLayout={(_, i) => ({ length: largura, offset: largura * i, index: i })}
          renderItem={({ item, index }) => (
            <Pressable
              onPress={onToque ? () => onToque(index) : undefined}
              disabled={!onToque}
              accessibilityRole={onToque ? 'imagebutton' : 'image'}
              accessibilityLabel={`${rotulo}: imagem ${index + 1} de ${imagens.length}${onToque ? ', toque para ampliar' : ''}`}
              style={{ width: largura, height: alturaMedida }}
            >
              <Image source={{ uri: item }} style={{ width: largura, height: alturaMedida }} contentFit={ajuste} transition={150} />
            </Pressable>
          )}
        />
      ) : null}

      {imagens.length > 1 && largura > 0 ? (
        <>
          {pagina > 0 ? <Seta lado="esquerda" onPress={() => irPara(pagina - 1)} /> : null}
          {pagina < imagens.length - 1 ? <Seta lado="direita" onPress={() => irPara(pagina + 1)} /> : null}
        </>
      ) : null}
    </View>
  );
}

function Seta({ lado, onPress }: { lado: 'esquerda' | 'direita'; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={lado === 'esquerda' ? 'Foto anterior' : 'Próxima foto'}
      style={{
        position: 'absolute',
        top: '50%',
        marginTop: -17,
        [lado === 'esquerda' ? 'left' : 'right']: 8,
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: 'rgba(0,0,0,0.45)',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icone nome={lado === 'esquerda' ? 'chevron-back' : 'chevron-forward'} tamanho={18} cor="onPrimary" />
    </Pressable>
  );
}

function Indicadores({ total, pagina, claro }: { total: number; pagina: number; claro?: boolean }) {
  const t = useTheme();
  const ativa = claro ? '#fff' : t.primary;
  const inativa = claro ? 'rgba(255,255,255,0.35)' : t.border;
  return (
    <View
      style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={{
            width: i === pagina ? 18 : 7,
            height: 7,
            borderRadius: 4,
            backgroundColor: i === pagina ? ativa : inativa,
          }}
        />
      ))}
    </View>
  );
}
