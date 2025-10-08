import { Link } from "expo-router";
import { Text, View } from "react-native";

export default function Index() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>Edit app/index.tsx to edit this screen.</Text>
      <Link href="/login">Go to Login</Link>
    </View>
  );
}
