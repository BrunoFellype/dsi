/**
 * Componentes de interface do ASTRA. Todas as telas usam só estes blocos,
 * assim o visual fica consistente e as cores seguem o tema claro/escuro.
 */
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { FonteId } from '@/lib/types';

export type IconName = React.ComponentProps<typeof Ionicons>['name'];

/* ---------- Texto ---------- */

type Variante = 'titulo' | 'subtitulo' | 'corpo' | 'legenda' | 'rotulo';

const TAMANHOS: Record<Variante, TextStyle> = {
  titulo: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  subtitulo: { fontSize: 17, fontWeight: '700' },
  corpo: { fontSize: 15, lineHeight: 22 },
  legenda: { fontSize: 13, lineHeight: 18 },
  rotulo: { fontSize: 12, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' },
};

export function Txt({
  v = 'corpo',
  cor = 'text',
  style,
  ...props
}: React.ComponentProps<typeof Text> & {
  v?: Variante;
  cor?: 'text' | 'textSecondary' | 'textMuted' | 'primary' | 'danger' | 'success' | 'warning';
}) {
  const t = useTheme();
  return <Text {...props} style={[TAMANHOS[v], { color: t[cor] }, style]} />;
}

/* ---------- Tela ---------- */

export function Tela({
  children,
  rolavel = true,
  rodape,
  style,
}: {
  children: React.ReactNode;
  rolavel?: boolean;
  rodape?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const conteudo = <View style={[estilos.coluna, style]}>{children}</View>;
  return (
    <SafeAreaView style={[estilos.tela, { backgroundColor: t.background }]} edges={['top', 'left', 'right']}>
      {rolavel ? (
        <ScrollView
          contentContainerStyle={estilos.rolagem}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {conteudo}
        </ScrollView>
      ) : (
        <View style={estilos.rolagem}>{conteudo}</View>
      )}
      {rodape}
    </SafeAreaView>
  );
}

export function Cabecalho({
  titulo,
  subtitulo,
  voltar,
  acao,
}: {
  titulo: string;
  subtitulo?: string;
  voltar?: () => void;
  acao?: React.ReactNode;
}) {
  return (
    <View style={estilos.cabecalho}>
      <View style={{ flex: 1, gap: 2 }}>
        {voltar ? (
          <Pressable
            onPress={voltar}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            hitSlop={12}
            style={estilos.voltar}
          >
            <Icone nome="chevron-back" tamanho={20} cor="primary" />
            <Txt v="legenda" cor="primary" style={{ fontWeight: '700' }}>
              Voltar
            </Txt>
          </Pressable>
        ) : null}
        <Txt v="titulo" accessibilityRole="header">
          {titulo}
        </Txt>
        {subtitulo ? (
          <Txt v="corpo" cor="textSecondary">
            {subtitulo}
          </Txt>
        ) : null}
      </View>
      {acao}
    </View>
  );
}

export function Icone({
  nome,
  tamanho = 20,
  cor = 'text',
}: {
  nome: IconName;
  tamanho?: number;
  cor?: 'text' | 'textSecondary' | 'textMuted' | 'primary' | 'danger' | 'success' | 'warning' | 'onPrimary';
}) {
  const t = useTheme();
  return <Ionicons name={nome} size={tamanho} color={t[cor]} />;
}

/* ---------- Cartão e seção ---------- */

export function Cartao({
  children,
  style,
  onPress,
  destaque,
  accessibilityLabel,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  destaque?: boolean;
  accessibilityLabel?: string;
}) {
  const t = useTheme();
  const base = [
    estilos.cartao,
    { backgroundColor: destaque ? t.primarySoft : t.surface, borderColor: t.border },
    style,
  ];
  if (!onPress) return <View style={base}>{children}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [base, pressed && { opacity: 0.75 }]}
    >
      {children}
    </Pressable>
  );
}

export function Secao({
  titulo,
  acao,
  onAcao,
  children,
}: {
  titulo: string;
  acao?: string;
  onAcao?: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={{ gap: Spacing.md }}>
      <View style={estilos.linhaEntre}>
        <Txt v="subtitulo" accessibilityRole="header">
          {titulo}
        </Txt>
        {acao && onAcao ? (
          <Pressable onPress={onAcao} hitSlop={10} accessibilityRole="button" accessibilityLabel={acao}>
            <Txt v="legenda" cor="primary" style={{ fontWeight: '700' }}>
              {acao}
            </Txt>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

/* ---------- Botões, chips, selos ---------- */

export function Botao({
  titulo,
  onPress,
  variante = 'primario',
  carregando,
  desabilitado,
  icone,
  style,
}: {
  titulo: string;
  onPress: () => void;
  variante?: 'primario' | 'secundario' | 'texto' | 'perigo';
  carregando?: boolean;
  desabilitado?: boolean;
  icone?: IconName;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const cores = {
    primario: { bg: t.primary, fg: t.onPrimary, borda: t.primary },
    secundario: { bg: t.surface, fg: t.primary, borda: t.border },
    texto: { bg: 'transparent', fg: t.primary, borda: 'transparent' },
    perigo: { bg: t.surface, fg: t.danger, borda: t.border },
  }[variante];
  const inativo = carregando || desabilitado;
  return (
    <Pressable
      onPress={onPress}
      disabled={inativo}
      accessibilityRole="button"
      accessibilityLabel={titulo}
      accessibilityState={{ disabled: inativo, busy: carregando }}
      style={({ pressed }) => [
        estilos.botao,
        { backgroundColor: cores.bg, borderColor: cores.borda },
        (pressed || inativo) && { opacity: inativo ? 0.5 : 0.8 },
        style,
      ]}
    >
      {carregando ? (
        <ActivityIndicator color={cores.fg} />
      ) : (
        <>
          {icone ? <Ionicons name={icone} size={18} color={cores.fg} /> : null}
          <Text style={{ color: cores.fg, fontSize: 15, fontWeight: '700' }}>{titulo}</Text>
        </>
      )}
    </Pressable>
  );
}

export function Chip({
  rotulo,
  ativo,
  onPress,
}: {
  rotulo: string;
  ativo: boolean;
  onPress: () => void;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      accessibilityState={{ selected: ativo }}
      style={[
        estilos.chip,
        { backgroundColor: ativo ? t.primary : t.surface, borderColor: ativo ? t.primary : t.border },
      ]}
    >
      <Text style={{ color: ativo ? t.onPrimary : t.textSecondary, fontSize: 13, fontWeight: '700' }}>
        {rotulo}
      </Text>
    </Pressable>
  );
}

export function Selo({
  rotulo,
  tom = 'neutro',
}: {
  rotulo: string;
  tom?: 'neutro' | 'sucesso' | 'alerta' | 'perigo' | 'primario';
}) {
  const t = useTheme();
  const cores = {
    neutro: { bg: t.surfaceAlt, fg: t.textSecondary },
    sucesso: { bg: t.successSoft, fg: t.success },
    alerta: { bg: t.warningSoft, fg: t.warning },
    perigo: { bg: t.dangerSoft, fg: t.danger },
    primario: { bg: t.primarySoft, fg: t.primary },
  }[tom];
  return (
    <View style={[estilos.selo, { backgroundColor: cores.bg }]}>
      <Text style={{ color: cores.fg, fontSize: 12, fontWeight: '700' }}>{rotulo}</Text>
    </View>
  );
}

export function Vazio({
  icone,
  titulo,
  texto,
  acao,
  onAcao,
}: {
  icone: IconName;
  titulo: string;
  texto: string;
  acao?: string;
  onAcao?: () => void;
}) {
  return (
    <View style={estilos.vazio}>
      <Icone nome={icone} tamanho={36} cor="textMuted" />
      <Txt v="subtitulo" style={{ textAlign: 'center' }}>
        {titulo}
      </Txt>
      <Txt v="corpo" cor="textSecondary" style={{ textAlign: 'center' }}>
        {texto}
      </Txt>
      {acao && onAcao ? <Botao titulo={acao} onPress={onAcao} style={{ marginTop: Spacing.sm }} /> : null}
    </View>
  );
}

/* ---------- Campos ---------- */

export function Campo({
  rotulo,
  erro,
  style,
  ...props
}: TextInputProps & { rotulo: string; erro?: string }) {
  const t = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <Txt v="legenda" cor="textSecondary" style={{ fontWeight: '700' }}>
        {rotulo}
      </Txt>
      <TextInput
        accessibilityLabel={rotulo}
        placeholderTextColor={t.textMuted}
        {...props}
        style={[
          estilos.campo,
          {
            backgroundColor: t.surface,
            borderColor: erro ? t.danger : t.border,
            color: t.text,
          },
          props.multiline && { minHeight: 120, textAlignVertical: 'top' },
          style,
        ]}
      />
      {erro ? (
        <Txt v="legenda" cor="danger">
          {erro}
        </Txt>
      ) : null}
    </View>
  );
}

export function Mensagem({ texto, tom }: { texto: string; tom: 'erro' | 'sucesso' }) {
  const t = useTheme();
  return (
    <View
      accessibilityRole="alert"
      style={[
        estilos.mensagem,
        { backgroundColor: tom === 'erro' ? t.dangerSoft : t.successSoft },
      ]}
    >
      <Icone nome={tom === 'erro' ? 'alert-circle' : 'checkmark-circle'} cor={tom === 'erro' ? 'danger' : 'success'} />
      <Txt v="legenda" cor={tom === 'erro' ? 'danger' : 'success'} style={{ flex: 1, fontWeight: '600' }}>
        {texto}
      </Txt>
    </View>
  );
}

/* ---------- Fontes ---------- */

export const FONTES: Record<FonteId, { nome: string; icone: IconName }> = {
  sigaa: { nome: 'SIGAA', icone: 'school-outline' },
  classroom: { nome: 'Classroom', icone: 'book-outline' },
  whatsapp: { nome: 'WhatsApp', icone: 'chatbubble-ellipses-outline' },
  telegram: { nome: 'Telegram', icone: 'paper-plane-outline' },
  discord: { nome: 'Discord', icone: 'game-controller-outline' },
  email: { nome: 'E-mail', icone: 'mail-outline' },
  manual: { nome: 'Manual', icone: 'create-outline' },
};

export function SeloFonte({ fonte }: { fonte: FonteId }) {
  const t = useTheme();
  return (
    <View style={estilos.fonte}>
      <Ionicons name={FONTES[fonte].icone} size={13} color={t.textMuted} />
      <Txt v="legenda" cor="textMuted">
        {FONTES[fonte].nome}
      </Txt>
    </View>
  );
}

export { estilos as estilosUi };

const estilos = StyleSheet.create({
  tela: { flex: 1 },
  rolagem: { flexGrow: 1, alignItems: 'center' },
  coluna: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.xl,
  },
  cabecalho: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  voltar: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xs, marginLeft: -4 },
  cartao: { borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.lg, gap: Spacing.sm },
  linhaEntre: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  botao: {
    minHeight: 48,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: Radius.pill,
    borderWidth: 1,
    justifyContent: 'center',
  },
  selo: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.pill },
  vazio: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xxl, paddingHorizontal: Spacing.lg },
  campo: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
  },
  mensagem: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.md,
  },
  fonte: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
