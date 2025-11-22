import { TextInput } from "react-native";

export default function Input({ placeholder, value, onChangeText }) {
  return (
    <TextInput
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      style={{
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        marginBottom: 12,
      }}
    />
  );
}
