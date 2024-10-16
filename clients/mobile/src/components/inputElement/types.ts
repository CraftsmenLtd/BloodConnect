export interface InputProps {
  label: string;
  value: string;
  placeholder: string;
  error?: string | null;
  name: string;
  isRequired?: boolean;
  onChangeText: (name: string | undefined, text: string) => void;
}
