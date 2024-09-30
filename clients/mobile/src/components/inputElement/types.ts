export interface InputProps {
  label: string;
  value: string;
  placeholder: string;
  error?: string | null;
  name?: string;
  onChangeText: (name: string | undefined, text: string) => void;
}
