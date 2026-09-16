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
    width: 402,
    height: 874,
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: 'rgba(253, 255, 255, 1)',
  },

  header: {
    width: 402,
    height: 70,
    flexShrink: 0,
    backgroundColor: 'rgba(154, 217, 235, 1)',
  },

  telaSup: {
    position: 'relative',
    flexDirection: 'row',
    width: 400,
    height: 115,
    paddingTop: 0,
    paddingLeft: 10,
    paddingRight: 20,
    paddingBottom: 30,
    alignItems: 'center',
    flexShrink: 0,
  },

  astraImage: {
    width: 133,
    height: 133,
    marginTop: 20,
  },

  profileImage: {
    width: 40,
    height: 40,
    marginLeft: 'auto',
  },

  gradeAulasSemanal: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    color: 'rgba(0, 0, 0, 1)',
    fontSize: 20,
    fontWeight: '500',
    textAlign: 'center',
  },

  frame5: {
    width: 335,
    height: 575,
    marginTop: 10,
    backgroundColor: 'rgba(229, 244, 248, 1)',
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
    flex: 1,
    width: 100,
  },

  frame10: {
    width: '100%',
    flexDirection: 'row',
    paddingTop: 20,
    paddingLeft: 13,
    paddingBottom: 20,
    paddingRight: 13,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(244, 244, 252, 1)',
  },

  navigationIcon: {
    width: 40,
    height: 40,
  },
});

export default TelaCalendario;