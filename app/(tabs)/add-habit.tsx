import { Text, View, ScrollView } from "react-native";
import { Button, SegmentedButtons, TextInput } from "react-native-paper";
import { useState } from "react";
import { DATABASE_ID, databases, HABITS_TABLE_ID } from "@/lib/appwrite";
import { ID } from "react-native-appwrite";
import { useRouter } from "expo-router";
import { useAuth } from "@/lib/auth-context";

const Frequencies = ["Daily", "Weekly", "Monthly"];
type Frequency = (typeof Frequencies)[number];

export default function AddHabitScreen() {
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [frequency, setFrequency] = useState<Frequency>("Daily");
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  const handleSubmit = async () => {
    if (!user) return;
    try {
      await databases.createDocument(
        DATABASE_ID,
        HABITS_TABLE_ID,
        ID.unique(),
        {
          user_id: user.$id,
          title,
          description,
          frequency,
          streak_count: 0,
          last_completed: new Date().toISOString(),
        }
      );
      router.back();
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
        return;
      }

      setError("An unexpected error occurred.");
    }
  };
  return (
    <ScrollView
      className="flex-1 bg-[#F5F7FA] p-5"
      contentContainerStyle={{ paddingBottom: 60 }}
    >
      <View className="mb-4">
        <TextInput
          label="Title"
          mode="outlined"
          value={title}
          onChangeText={setTitle}
          outlineStyle={{ borderRadius: 10 }}
          style={{
            backgroundColor: "#fff",
            elevation: 1,
          }}
        />
      </View>

      <View className="mb-4">
        <TextInput
          label="Description"
          mode="outlined"
          multiline
          numberOfLines={4}
          value={description}
          onChangeText={setDescription}
          outlineStyle={{ borderRadius: 10 }}
          style={{
            backgroundColor: "#fff",
            elevation: 1,
          }}
        />
      </View>

      <View className="mb-6">
        <Text className="text-gray-700 font-medium mb-2">Frequency</Text>
        <SegmentedButtons
          value={frequency}
          onValueChange={(value) => setFrequency(value as Frequency)}
          buttons={Frequencies.map((freq) => ({
            value: freq,
            label: freq,
          }))}
        />
      </View>

      <Button
        mode="contained"
        onPress={handleSubmit}
        style={{
          borderRadius: 10,
          paddingVertical: 6,
          elevation: 2,
        }}
        labelStyle={{
          fontSize: 16,
          fontWeight: "bold",
          letterSpacing: 0.5,
        }}
        disabled={!title || !description}
      >
        Add Habit
      </Button>

      {error && <Text className="text-red-500 text-center mt-4">{error}</Text>}
    </ScrollView>
  );
}
