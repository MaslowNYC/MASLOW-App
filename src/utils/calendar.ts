import { Alert, Platform, Linking } from 'react-native';
import * as Calendar from 'expo-calendar';

interface CalendarEventConfig {
  title: string;
  startDate: string; // ISO string
  endDate?: string; // ISO string
  location?: string;
  notes?: string;
}

async function getDefaultCalendarId(): Promise<string | null> {
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);

  // Try to find the default calendar
  const defaultCalendar = calendars.find(
    (cal) => cal.allowsModifications && cal.source?.name === 'Default'
  ) || calendars.find(
    (cal) => cal.allowsModifications && cal.isPrimary
  ) || calendars.find(
    (cal) => cal.allowsModifications
  );

  return defaultCalendar?.id || null;
}

export const addEventToCalendar = async (config: CalendarEventConfig): Promise<boolean> => {
  const { title, startDate, endDate, location, notes } = config;

  try {
    // Request calendar permissions
    const { status } = await Calendar.requestCalendarPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'Calendar Access Required',
        'Please enable calendar access in your device settings to add events.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: () => {
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              } else {
                Linking.openSettings();
              }
            },
          },
        ]
      );
      return false;
    }

    // Get the default calendar
    const calendarId = await getDefaultCalendarId();

    if (!calendarId) {
      Alert.alert('Error', 'No calendar found on this device.');
      return false;
    }

    // Parse dates
    const start = new Date(startDate);
    const end = endDate
      ? new Date(endDate)
      : new Date(start.getTime() + 2 * 60 * 60 * 1000); // Default 2 hour duration

    // Create the event
    await Calendar.createEventAsync(calendarId, {
      title,
      startDate: start,
      endDate: end,
      location: location || '',
      notes: notes || '',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });

    return true;
  } catch (error: any) {
    console.error('Calendar error:', error);
    Alert.alert('Error', 'Could not add event to calendar. Please try again.');
    return false;
  }
};

export const formatEventForCalendar = (event: {
  title: string;
  starts_at: string;
  ends_at?: string | null;
  location?: string | null;
  description?: string | null;
  host_name?: string | null;
}): CalendarEventConfig => {
  let notes = '';
  if (event.description) {
    notes += event.description;
  }
  if (event.host_name) {
    notes += notes ? '\n\n' : '';
    notes += `Hosted by: ${event.host_name}`;
  }
  notes += notes ? '\n\n' : '';
  notes += 'MASLOW Event';

  return {
    title: event.title,
    startDate: event.starts_at,
    endDate: event.ends_at || undefined,
    location: event.location || undefined,
    notes,
  };
};
