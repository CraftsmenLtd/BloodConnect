import { useState, useRef } from 'react'
import { Animated, Easing } from 'react-native'

type ToastProps = {
  message: string;
  duration?: number;
  type?: 'success' | 'error' | 'info';
  toastAnimationFinished?: Animated.Value;
}

type ToastResponse = {
  showToastMessage: (props: ToastProps) => void;
  showToast: ToastProps | null;
  toastAnimationFinished?: Animated.Value;
}

const useToast = (): ToastResponse => {
  const [showToast, setShowToast] = useState<ToastProps | null>(null)
  const toastAnimationFinished = useRef(new Animated.Value(0)).current

  const showToastMessage = (props: ToastProps): void => {
    setShowToast(props)
    Animated.timing(toastAnimationFinished, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
      easing: Easing.ease
    }).start(() => {
      setTimeout(() => {
        Animated.timing(toastAnimationFinished, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.ease
        }).start(() => { setShowToast(null) })
      }, props.duration ?? 3000)
    })
  }

  return { showToastMessage, showToast, toastAnimationFinished }
}

export default useToast
