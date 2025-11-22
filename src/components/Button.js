import { TouchableOpacity, Text } from "react-native";

export default function Button({ title, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: "#000",
        padding: 12,
        borderRadius: 12,
        alignItems: "center",
      }}
    >
      <Text style={{ color: "#fff", fontSize: 16 }}>{title}</Text>
    </TouchableOpacity>
  );
}
