import React from 'react'
import {
  TouchableWithoutFeedback,
  Modal,
  View,
  Text,
  StyleSheet,
  Image,
  ImageSourcePropType
} from 'react-native'
import Button from '../button/Button'
import { Theme } from '../../setup/theme'
import { useTheme } from '../../setup/theme/hooks/useTheme'

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
  onClose = () => {}
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
              {icon != null && (
                  <Image
                      source={icon}
                      style={{ width: iconSize, height: iconSize, marginBottom: 10 }}
                      resizeMode="contain"
                  />
              )}

              {/* Title */}
              <Text style={styles.title}>{title}</Text>

              {/* Message */}
              <Text style={styles.message}>{message}</Text>

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
    backgroundColor: theme.colors.blackFaded,
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContainer: {
    width: '80%',
    backgroundColor: theme.colors.white,
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    elevation: 5
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center'
  },
  message: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center'
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%'
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 5,
    backgroundColor: theme.colors.primary,
    borderRadius: 100,
    alignItems: 'center'
  },
  buttonText: {
    color: theme.colors.white,
    fontSize: 16
  }
})

export default GenericModal
