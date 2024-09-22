export interface InputProps {
  label: string;
  value: string;
  placeholder: string;
  error?: string;
  name?: string;
  onChangeText: (name: string | undefined, text: string) => void;
}
