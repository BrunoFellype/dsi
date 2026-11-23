import { CarrosselImagens } from '@/components/carrossel';
import { Icone, Txt } from '@/components/ui';
import { adicionarImagem, MAX_IMAGENS_POR_AVISO, removerImagem } from '@/lib/galeria';
import { escolherImagem, PermissaoNegada, type OrigemImagem } from '@/lib/imagens';
import { useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, View } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

function confirmar(titulo: string, mensagem: string, acao: () => void) {
  if (Platform.OS === 'web') {
    if (globalThis.confirm?.(`${titulo}\n${mensagem}`)) acao();
    return;
  }
  Alert.alert(titulo, mensagem, [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Remover', style: 'destructive', onPress: acao },
  ]);
}

/**
 * Fotos de um aviso: carrossel + botões para anexar pela câmera ou pela galeria.
 * Quem guarda a lista é o store (editarAviso), este componente só devolve a lista nova.
 */
export function GaleriaAviso({
  imagens = [],
  onMudar,
}: {
  imagens?: string[];
  onMudar: (imagens: string[]) => void;
}) {
  const t = useTheme();
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState('');
  const cheio = imagens.length >= MAX_IMAGENS_POR_AVISO;

  async function anexar(origem: OrigemImagem) {
    setAviso('');
    setEnviando(true);
    try {
      const foto = await escolherImagem(origem);
      if (!foto) return;
      onMudar(adicionarImagem(imagens, foto.url));
      if (!foto.naNuvem) setAviso('Foto salva só neste aparelho (sem envio para a nuvem).');
    } catch (e) {
      setAviso(e instanceof PermissaoNegada ? e.message : 'Não foi possível anexar a foto. Tente de novo.');
    } finally {
      setEnviando(false);
    }
  }

  function remover(indice: number) {
    confirmar('Remover foto?', 'A foto sai deste aviso.', () => onMudar(removerImagem(imagens, indice)));
  }

  return (
    <View style={{ gap: 8 }}>
      <CarrosselImagens imagens={imagens} onRemover={remover} rotulo="Fotos do aviso" />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        {enviando ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 }}>
            <ActivityIndicator color={t.primary} />
            <Txt v="legenda" cor="textSecondary">
              Enviando foto...
            </Txt>
          </View>
        ) : cheio ? (
          <Txt v="legenda" cor="textMuted">
            Limite de {MAX_IMAGENS_POR_AVISO} fotos neste aviso.
          </Txt>
        ) : (
          <>
            {Platform.OS !== 'web' ? <BotaoFoto icone="camera-outline" rotulo="Tirar foto" onPress={() => anexar('camera')} /> : null}
            <BotaoFoto icone="images-outline" rotulo="Galeria" onPress={() => anexar('galeria')} />
          </>
        )}
      </View>

      {aviso ? (
        <Txt v="legenda" cor="textMuted">
          {aviso}
        </Txt>
      ) : null}
    </View>
  );
}

function BotaoFoto({ icone, rotulo, onPress }: { icone: 'camera-outline' | 'images-outline'; rotulo: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={`${rotulo} para anexar ao aviso`}
      style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 6 }}
    >
      <Icone nome={icone} tamanho={16} cor="primary" />
      <Txt v="legenda" cor="primary" style={{ fontWeight: '700' }}>
        {rotulo}
      </Txt>
    </Pressable>
  );
}
