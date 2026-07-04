import React from 'react'
import type {
  ImageSourcePropType
} from 'react-native'
import {
  TouchableWithoutFeedback,
  Modal,
  View,
  StyleSheet,
  Image
} from 'react-native'
import { Text } from '../text/AppText'
import Button from '../button/Button'
import type { Theme } from '../../setup/theme'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import { spacing, radius } from '../../setup/theme/tokens'

type ButtonType = {
  text: string;
  onPress: () => void;
  style?: object;
  loading?: boolean;
}

type GenericModalProps = {
  visible: boolean;
  title?: string;
  message?: string;
  icon?: ImageSourcePropType;
  iconSize?: number;
  buttons?: ButtonType[];
  onClose?: () => void;
}

/**
 * GenericModal Component
 *
 * A flexible and reusable modal component.
 * It supports customizable title, message, icon, and buttons.
 *
 * Props:
 *  - visible (boolean): Controls the visibility of the modal.
 *  - title (string): The title text displayed at the top of the modal.
 *  - message (string): The message or description displayed in the modal.
 *  - icon (ImageSourcePropType): Optional icon displayed above the title.
 *       - Can be a local image (require('./path/to/image.png')) or a remote URL.
 *  - iconSize (number): The width and height of the icon (default: 50px).
 *  - buttons (Array): Array of button objects for modal actions.
 *       - text (string): Label for the button.
 *       - onPress (function): Function triggered when the button is pressed.
 *       - style (object): Optional styling for individual buttons.
 *       - loading (boolean): Optional loading state for the button.
 *  - onClose (function): Callback function when the modal is dismissed.
 *
 * Usage Examples:
 *
 * 1. Basic Modal with a Single Button:
 *   ```ts
 *    <GenericModal
 *      visible={isVisible}
 *      title="Welcome"
 *      message="Hello, this is a modal!"
 *      buttons={[
 *        { text: "OK", onPress: handleClose }
 *      ]}
 *      onClose={handleClose}
 *    />
 *    ```
 *
 * 2. Modal with Multiple Buttons and Custom Styles:
 *    ```ts
 *    <GenericModal
 *      visible={isVisible}
 *      title="Confirmation"
 *      message="Are you sure you want to continue?"
 *      buttons={[
 *        { text: "Cancel", onPress: handleClose, style: { backgroundColor: 'gray' } },
 *        { text: "Confirm", onPress: handleConfirm, style: { backgroundColor: 'green' } }
 *      ]}
 *    />
 *    ```
 *
 * 3. Modal with an Icon:
 *    ```ts
 *    <GenericModal
 *      visible={isVisible}
 *      title="Success!"
 *      message="Your action was successful."
 *      icon={require('./assets/success.png')}
 *      iconSize={70}
 *      buttons={[
 *        { text: "OK", onPress: handleClose }
 *      ]}
 *    />
 *    ```
 */
const GenericModal: React.FC<GenericModalProps> = ({
  visible = false,
  title = 'Modal Title',
  message = 'This is a modal message',
  icon,
  iconSize = 50,
  buttons = [],
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onClose = () => { }
}) => {
  const styles = createStyles(useTheme())

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Backdrop Click Support */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
              {/* Conditional Rendering for Icon */}
              {icon !== null && (
                <Image
                  source={icon}
                  style={{ width: iconSize, height: iconSize, marginBottom: spacing.md }}
                  resizeMode="contain"
                />
              )}

              {/* Title */}
              <Text variant="h2" style={styles.title}>{title}</Text>

              {/* Message */}
              <Text variant="body" style={styles.message}>{message}</Text>

              {/* Buttons */}
              <View style={styles.buttonContainer}>
                {buttons.map((button, index) => (
                  <Button
                    key={`${button.text}-${index}`}
                    text={button.text}
                    onPress={button.onPress}
                    buttonStyle={[styles.button, button.style]}
                    textStyle={[styles.buttonText, button.style]}
                    loading={button.loading}
                  />
                ))}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  )
}

const createStyles = (theme: Theme) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.backdrop,
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContainer: {
    width: '80%',
    backgroundColor: theme.colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    ...theme.elevation.lg
  },
  title: {
    marginBottom: spacing.md,
    textAlign: 'center'
  },
  message: {
    marginBottom: spacing.xl,
    textAlign: 'center'
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%'
  },
  button: {
    flex: 1,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.xs,
    backgroundColor: theme.colors.primary,
    borderRadius: radius.pill,
    alignItems: 'center'
  },
  buttonText: {
    color: theme.colors.onPrimary,
    fontSize: 16
  }
})

export default GenericModal
