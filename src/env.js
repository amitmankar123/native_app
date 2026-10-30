/**
 * App Environment Configuration
 * 
 * 🔌 USB Debugging (Recommended):
 * Run: adb reverse tcp:5001 tcp:5001
 * Then phone directly accesses PC backend via localhost:5001 over USB cable!
 * 
 * 📶 Wi-Fi Mode (Without USB):
 * Uses PC Wi-Fi IP: 192.168.1.4
 */

// If connected via USB cable with 'adb reverse tcp:5001 tcp:5001', set USE_USB_REVERSE = true:
export const USE_USB_REVERSE = true;

export const BASE_URL = USE_USB_REVERSE
  ? 'http://localhost:5001/api'
  : 'http://192.168.1.4:5001/api';
