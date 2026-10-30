/**
 * App Environment Configuration
 * 
 * 🌐 Production (Render Cloud Backend):
 * https://native-app-thn3.onrender.com/api
 * 
 * 🔌 USB Debugging (Local Dev):
 * Run: adb reverse tcp:5001 tcp:5001 -> http://localhost:5001/api
 * 
 * 📶 Wi-Fi Mode (Local Dev without USB):
 * http://192.168.1.4:5001/api
 */

// Set to: 'production' | 'usb' | 'wifi'
export const ENV_MODE = 'production';

export const BASE_URL =
  ENV_MODE === 'production'
    ? 'https://native-app-thn3.onrender.com/api'
    : ENV_MODE === 'usb'
    ? 'http://localhost:5001/api'
    : 'http://192.168.1.4:5001/api';

