import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { academicActivities } from '../constants/academicActivities';

import type {
    StyleProp,
    ViewStyle,
} from 'react-native';

export interface TelaCalendarioProps {
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function TelaCalendario(props: TelaCalendarioProps) {
  return (
    <View
      testID={props.testID ?? '101:25'}
      style={[styles.root, props.style]}
    >
      {/* Header */}
      <View
        testID="88:1035"
        style={styles.header}
      />

      {/* Parte superior */}
      <View
        testID="98:13"
        style={styles.telaSup}
      >
        <Image
          source={require('../../assets/images/straremovebgpreview2.png')}
          style={styles.astraImage}
        />

        <Image
          source={require('../../assets/images/profile.png')}
          style={styles.profileImage}
        />

        <Text
          testID="88:1041"
          style={styles.gradeAulasSemanal}
        >
          Grade de Aulas Semanal
        </Text>
      </View>

      {/* Seção de cards */}
      <View
        testID="99:15"
        style={styles.frame5}
      >
        <ScrollView style={styles.activitiesScroll} contentContainerStyle={styles.activitiesContent} showsVerticalScrollIndicator={false}>
          {academicActivities.map((activity) => (
            <View key={activity.id} style={[styles.activityCard, { borderLeftColor: activity.borderColor }]}>
              <Text style={styles.activityTitle}>{activity.title}</Text>
              <Text style={styles.activityDetails}>{activity.details}</Text>
              <Text style={styles.activitySource}>{activity.source}</Text>
              <Text style={[styles.activityDeadline, { color: activity.deadlineTextColor }]}>{activity.deadline}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Espaço flexível */}
      <View
        testID="101:29"
        style={styles.spacer}
      />

      {/* Barra inferior */}
      <View
        testID="100:24"
        style={styles.frame10}
      >
        <Image
          source={require('../../assets/images/homepage.png')}
          style={styles.navigationIcon}
        />

        <Image
          source={require('../../assets/images/calendar.png')}
          style={[styles.navigationIcon, { tintColor: '#6EA1C5'}]}
        />

        <Image
          source={require('../../assets/images/clock.png')}
          style={styles.navigationIcon}
        />

        <Image
          source={require('../../assets/images/doorbell.png')}
          style={styles.navigationIcon}
        />

        <Image
          source={require('../../assets/images/journal.png')}
          style={styles.navigationIcon}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    flex: 1,
    minHeight: 0,
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#FDFFFF',
  },

  header: {
    width: '100%',
    height: 64,
    flexShrink: 0,
    backgroundColor: '#9AD9EB',
    borderBottomWidth: 1,
    borderBottomColor: '#87C3D5',
  },

  telaSup: {
    position: 'relative',
    flexDirection: 'row',
    width: '100%',
    height: 96,
    paddingHorizontal: 16,
    alignItems: 'center',
    flexShrink: 0,
  },

  astraImage: {
    width: 90,
    height: 42,
  },

  profileImage: {
    width: 36,
    height: 36,
    marginLeft: 'auto',
  },

  gradeAulasSemanal: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 8,
    color: '#1D2A44',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },

  frame5: {
    width: '88%',
    maxWidth: 420,
    flex: 1,
    minHeight: 0,
    marginTop: 4,
    marginBottom: 12,
    backgroundColor: '#E5F4F8',
    borderWidth: 1,
    borderColor: '#C8E0E8',
    borderRadius: 10,
  },

  activitiesContent: {
    padding: 10,
    gap: 8,
  },

  activitiesScroll: {
    flex: 1,
    width: '100%',
  },

  activityCard: {
    padding: 10,
    borderLeftWidth: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE8EE',
    borderRadius: 10,
  },

  activityTitle: {
    color: '#1D2A44',
    fontSize: 14,
    fontWeight: '700',
  },

  activityDetails: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 3,
  },

  activitySource: {
    color: '#3873A0',
    fontSize: 11,
    marginTop: 6,
  },

  activityDeadline: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },

  spacer: {
    flex: 0,
    width: 100,
  },

  frame10: {
    width: '100%',
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 13,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    backgroundColor: '#F4F4FC',
    borderTopWidth: 1,
    borderTopColor: '#E2E6EE',
  },

  navigationIcon: {
    width: 28,
    height: 28,
  },
});

export default TelaCalendario;