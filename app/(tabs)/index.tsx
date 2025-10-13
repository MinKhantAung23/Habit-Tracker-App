import {
  client,
  COMPLECTIONS_TABLE_ID,
  DATABASE_ID,
  databases,
  HABITS_TABLE_ID,
  RealtimeResponse,
} from "@/lib/appwrite";
import { useAuth } from "@/lib/auth-context";
import { Completion, Habit } from "@/types/database.type";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { ID, Query } from "react-native-appwrite";
import { Swipeable } from "react-native-gesture-handler";
import { Button, Surface } from "react-native-paper";

export default function Index() {
  const { signOut, user } = useAuth();

  const [habits, setHabits] = useState<Habit[]>();
  const [completedHabits, setCompletedHabits] = useState<string[]>();

  const swipeableRefs = useRef<{ [key: string]: Swipeable | null }>({});

  useEffect(() => {
    if (user) {
      const habitChannel = `databases.${DATABASE_ID}.collections.${HABITS_TABLE_ID}.documents`;
      const habitsSubscription = client.subscribe(
        habitChannel,
        (response: RealtimeResponse) => {
          if (
            response.events.includes(
              "databases.*.collections.*.documents.*.create"
            ) ||
            response.events.includes(
              "databases.*.collections.*.documents.*.update"
            ) ||
            response.events.includes(
              "databases.*.collections.*.documents.*.delete"
            )
          ) {
            fetchHabits();
          }
        }
      );

      const completionChannel = `databases.${DATABASE_ID}.collections.${COMPLECTIONS_TABLE_ID}.documents`;
      const completionsSubscription = client.subscribe(
        completionChannel,
        (response: RealtimeResponse) => {
          if (
            response.events.includes(
              "databases.*.collections.*.documents.*.create"
            )
          ) {
            fetchTodayCompletions();
          }
        }
      );
      fetchHabits();
      fetchTodayCompletions();
      return () => {
        habitsSubscription();
        completionsSubscription();
      };
    }
  }, [user]);
  const fetchHabits = async () => {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        HABITS_TABLE_ID,
        [Query.equal("user_id", user?.$id ?? "")]
      );
      setHabits(response.documents as unknown as Habit[]);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchTodayCompletions = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const response = await databases.listDocuments(
        DATABASE_ID,
        COMPLECTIONS_TABLE_ID,
        [
          Query.equal("user_id", user?.$id ?? ""),
          Query.greaterThanEqual("completed_at", today.toISOString()),
        ]
      );
      const completions = response.documents as unknown as Completion[];
      setCompletedHabits(completions.map((c) => c.habit_id));
    } catch (error) {
      console.error(error);
    }
  };

  const isHabitCompleted = (habitId: string) => {
    return completedHabits?.includes(habitId);
  };

  const renderLeftActions = () => {
    return (
      <View className="bg-red-500 justify-center items-start mb-6 px-4 w-2/3 rounded-l-2xl">
        <Ionicons name="trash" size={24} color="white" />
      </View>
    );
  };
  const renderRightActions = (habitId: string) => {
    return (
      <View className="bg-green-500 justify-center items-end px-4 mb-6 w-2/3 rounded-r-2xl">
        {isHabitCompleted(habitId) ? (
          <Ionicons name="checkmark-done" size={24} color="white" />
        ) : (
          <Ionicons name="checkmark-circle" size={24} color="white" />
        )}
      </View>
    );
  };

  const handleDeleteHabit = async (id: string) => {
    try {
      await databases.deleteDocument(DATABASE_ID, HABITS_TABLE_ID, id);
    } catch (error) {
      console.error(error);
    }
  };
  const handleCompleteHabit = async (id: string) => {
    if (!user || completedHabits?.includes(id)) return;
    try {
      await databases.createDocument(
        DATABASE_ID,
        COMPLECTIONS_TABLE_ID,
        ID.unique(),
        {
          habit_id: id,
          user_id: user?.$id,
          completed_at: new Date().toISOString(),
        }
      );

      const habit = habits?.find((habit) => habit.$id === id);
      if (!habit) return;
      await databases.updateDocument(DATABASE_ID, HABITS_TABLE_ID, id, {
        streak_count: habit.streak_count + 1,
        last_completed: new Date().toISOString(),
      });
      fetchHabits();
    } catch (error) {
      console.error(error);
    }
  };
  return (
    <View className="flex-1 p-4 bg-gray-50">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-lg font-bold text-gray-900">Today’s Habits</Text>
        <Button
          mode="outlined"
          onPress={signOut}
          icon="logout"
          textColor="#2563eb"
          style={{ borderColor: "#2563eb" }}
        >
          Sign Out
        </Button>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} className="mt-4">
        {habits?.length === 0 ? (
          <View className="p-4 bg-white rounded-lg shadow-sm">
            <Text className="text-base text-gray-500">
              No habits found. Time to add some new habits!
            </Text>
          </View>
        ) : (
          habits?.map((habit, key) => (
            <Swipeable
              ref={(ref) => {
                swipeableRefs.current[habit.$id] = ref;
              }}
              key={key}
              overshootLeft={false}
              overshootRight={false}
              renderLeftActions={renderLeftActions}
              renderRightActions={() => renderRightActions(habit.$id)}
              onSwipeableOpen={(direction) => { 
                if (direction === "left") {
                  handleDeleteHabit(habit.$id);
                } else if (direction === "right") {
                  handleCompleteHabit(habit.$id);
                }
                swipeableRefs.current[habit.$id]?.close();
              }}
             
            >
              <Surface
                elevation={1}
                style={{ marginBottom: 20, borderRadius: 16 }}
              >
                <View
                  className={`space-y-2 p-4 rounded-2xl  shadow-md ${isHabitCompleted(habit.$id) ? "bg-green-400" : "bg-white"}`}
                >
                  <Text className="text-lg font-semibold text-gray-900">
                    {habit.title}
                  </Text>
                  <Text className="text-sm text-gray-600">
                    {habit.description}
                  </Text>

                  <View className="flex-row items-center justify-between pt-2 mt-2">
                    <View className="flex-row items-center space-x-1 bg-orange-100 px-2 py-1 rounded-full">
                      <Ionicons name="flame" size={20} color="#ff9800" />
                      <Text className="text-sm font-medium text-orange-600 ">
                        {habit.streak_count} day streak
                      </Text>
                    </View>

                    <View>
                      <Text className="text-sm font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                        {habit.frequency}
                      </Text>
                    </View>
                  </View>
                </View>
              </Surface>
            </Swipeable>
          ))
        )}
      </ScrollView>
    </View>
  );
}
