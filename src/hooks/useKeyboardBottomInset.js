import { useState, useEffect } from 'react';
import { Keyboard, Platform } from 'react-native';

/**
 * Custom hook to dynamically monitor keyboard height across Android and iOS.
 * Helps ensure ScrollViews and form views dynamically adjust bottom padding
 * so input fields are never obscured by the virtual keyboard.
 */
export function useKeyboardBottomInset() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = (event) => {
      const height = event?.endCoordinates?.height || 0;
      setKeyboardHeight(height);
    };

    const onHide = () => {
      setKeyboardHeight(0);
    };

    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return keyboardHeight;
}

export default useKeyboardBottomInset;

