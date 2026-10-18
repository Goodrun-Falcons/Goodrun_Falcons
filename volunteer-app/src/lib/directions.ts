import { ActionSheetIOS, Linking, Platform } from 'react-native';

import { Coordinates } from '@/types/task';

// Plain map links — no API key or billing. Turn-by-turn happens in the maps app.
function appleMapsUrl({ lat, lng }: Coordinates) {
  return `https://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`;
}

// Opens the Google Maps app when it's installed, the website otherwise.
function googleMapsUrl({ lat, lng }: Coordinates) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
}

/**
 * Hands driving directions to `destination` over to the phone's maps app. iOS asks
 * Apple Maps or Google Maps; Android goes straight into Google Maps navigation.
 */
export function openDirections(destination: Coordinates) {
  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      { options: ['Apple Maps', 'Google Maps', 'Cancel'], cancelButtonIndex: 2 },
      (index) => {
        if (index === 0) Linking.openURL(appleMapsUrl(destination));
        if (index === 1) Linking.openURL(googleMapsUrl(destination));
      }
    );
    return;
  }

  if (Platform.OS === 'android') {
    // Starts navigation immediately; rejects if Google Maps isn't installed.
    Linking.openURL(`google.navigation:q=${destination.lat},${destination.lng}`).catch(() =>
      Linking.openURL(googleMapsUrl(destination))
    );
    return;
  }

  Linking.openURL(googleMapsUrl(destination));
}
