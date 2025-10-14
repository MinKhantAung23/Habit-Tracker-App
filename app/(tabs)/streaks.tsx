import {
  COMPLECTIONS_TABLE_ID,
  DATABASE_ID,
  databases,
  HABITS_TABLE_ID,
} from "@/lib/appwrite";
import { useAuth } from "@/lib/auth-context";
import { Completion, Habit, StreakData } from "@/types/database.type";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Query } from "react-native-appwrite";
import { Card } from "react-native-paper";

export default function StreaksScreen() {
  const [habits, setHabits] = useState<Habit[]>();
  const [completedHabits, setCompletedHabits] = useState<Completion[]>([]);

  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchHabits();
      fetchCompletions();
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

  const fetchCompletions = async () => {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COMPLECTIONS_TABLE_ID,
        [Query.equal("user_id", user?.$id ?? "")]
      );
      const completions = response.documents as unknown as Completion[];
      setCompletedHabits(completions);
    } catch (error) {
      console.error(error);
    }
  };

  const getStrakData = (habitId: string): StreakData => {
    const habitCompletions = completedHabits
      ?.filter((c) => c.habit_id === habitId)
      .sort(
        (a, b) =>
          new Date(b.completed_at).getTime() -
          new Date(a.completed_at).getTime()
      );

    if (habitCompletions?.length === 0) {
      return {
        streak: 0,
        best: 0,
        total: 0,
      };
    }

    let streak = 0;
    let best = 0;
    let total = habitCompletions?.length;

    let lastDate: Date | null = null;
    let currentStreak = 0;

    habitCompletions?.forEach((c) => {
      const date = new Date(c.completed_at);
      if (lastDate) {
        const timeDiff =
          (date.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
        if (timeDiff <= 1.5) {
          currentStreak++;
        } else {
          currentStreak = 1;
        }
      } else {
        if (currentStreak > best) best = currentStreak;
        streak = currentStreak;
        lastDate = date;
      }
    });
    return {
      streak,
      best,
      total,
    };
  };

  const habitStreaks = habits?.map((habit) => {
    const { streak, best, total } = getStrakData(habit.$id);
    return {
      habit,
      best,
      streak,
      total,
    };
  });

  const rankHabits = habitStreaks?.sort(
    (a: StreakData, b: StreakData) => b.best - a.best
  );
  return (
    <View className="px-4 py-3">
      <Text className="text-2xl font-bold text-green-700 mb-3 text-center">
        🏆 Streaks Habits
      </Text>

      {habits?.length === 0 ? (
        <Text className="text-center text-gray-500">No habits found</Text>
      ) : (
        rankHabits?.map(({ habit, best, streak, total }, index) => (
          <Card
            key={index}
            style={{
              marginVertical: 8,
              borderRadius: 16,
              backgroundColor:
                index === 0
                  ? "#FFF8E1" 
                  : index === 1
                    ? "#ECEFF1" 
                    : index === 2
                      ? "#FFF3E0"
                      : "#FFFFFF",
              elevation: 3,
            }}
          >
            <Card.Content>

              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-lg font-bold text-gray-800">
                  #{index + 1} {habit.title}
                </Text>
                <Text className="text-base text-gray-600">
                  🥇 Best: <Text className="font-semibold">{best}</Text>
                </Text>
              </View>

              {habit.description && (
                <Text className="text-gray-600 mb-2">{habit.description}</Text>
              )}

              <View className="flex-row justify-between mt-1">
                <Text className="text-gray-700 text-base">
                  🔥 Streak: {streak}
                </Text>
                <Text className="text-gray-700 text-base">
                  ✅ Total: {total}
                </Text>
              </View>
            </Card.Content>
          </Card>
        ))
      )}
    </View>
  );
}
