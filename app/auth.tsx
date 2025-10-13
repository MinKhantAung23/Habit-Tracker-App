import { useAuth } from "@/lib/auth-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";

export default function AuthScreen() {
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const { signIn, signUp } = useAuth();

  const handleAuth = async () => {
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setError(null);
    if (isSignUp) {
      const error = await signUp(email, password);
      if (error) {
        setError(error);
        return;
      }
    } else {
      const error = await signIn(email, password);
      if (error) {
        setError(error);
        return;
      }

      router.replace("/");
    }
    console.log(isSignUp ? "Signing Up..." : "Signing In...");
  };
  const handleSwitchMode = () => {
    setIsSignUp(!isSignUp);
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 justify-center p-6 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View className="w-full max-w-sm mx-auto">
        <Text
          className="text-3xl font-bold mb-8 text-center"
          variant="headlineLarge"
        >
          {isSignUp ? "Create an account" : "Welcome Back"}
        </Text>

        <TextInput
          label={"Email"}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="example@gmail.com"
          mode="outlined"
          className="mb-4"
          onChangeText={(text) => setEmail(text)}
        />

        <TextInput
          label={"Password"}
          autoCapitalize="none"
          secureTextEntry={!isSignUp}
          placeholder="your password"
          mode="outlined"
          className="mb-4"
          onChangeText={(text) => setPassword(text)}
        />

        {error && (
          <Text className="text-red-500 mb-4 text-center">{error}</Text>
        )}

        <Button
          mode="contained"
          className="py-2 mb-4 mt-6"
          onPress={() => handleAuth()}
        >
          {isSignUp ? "Sign Up" : "Sign In"}
        </Button>

        <Button mode="text" onPress={handleSwitchMode}>
          {isSignUp
            ? "Already have an account? Sign In"
            : "Don't have an account? Sign Up"}
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}
