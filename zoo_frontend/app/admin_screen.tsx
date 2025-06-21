import React, { useEffect, useState } from "react";
import {ScrollView, StyleSheet, Alert, View} from "react-native";
import { Card, Text, Button, useTheme, FAB, Avatar } from "react-native-paper";
import {Stack, useRouter} from "expo-router";
import api from "./api/api";

export default function AdminScreen() {
    const [animals, setAnimals] = useState([]);
    const theme = useTheme();
    const router = useRouter();

    useEffect(() => {
        api.get("/animals?all=true").then(res => setAnimals(res.data.items));
    }, []);

    const deleteAnimal = (id: number) => {
        Alert.alert(
            "Підтвердити видалення",
            "Ви дійсно хочете видалити цю тварину?",
            [
                { text: "Скасувати", style: "cancel" },
                {
                    text: "Видалити", style: "destructive", onPress: () => {
                        api.delete(`/animals/${id}`).then(() => {
                            // @ts-ignore
                            setAnimals(list => list.filter(a => a.id !== id));
                        });
                    }
                }
            ]
        );
    };


    return (
        <View style={{flex:1, backgroundColor: theme.colors.background }}>
            <Stack.Screen options={{
                title: 'Адмін панель',
                headerStyle: { backgroundColor: theme.colors.elevation.level1 },
                headerTintColor: theme.colors.primary,
                headerTitleStyle: { color: theme.colors.primary }, }} />
            <ScrollView style={{ backgroundColor: theme.colors.background }}>
                <Text style={styles.title}>Адмін-панель: Усі тварини</Text>
                {animals.map(animal => (
                    <Card key={animal.id} style={styles.card}>
                        <Card.Title
                            title={animal.name}
                            subtitle={animal.type + (animal.breed ? ` • ${animal.breed}` : "")}
                            left={props => <Avatar.Image {...props} source={{ uri: animal.photo_url }} />}
                        />
                        <Card.Cover source={{ uri: animal.photo_url }} style={styles.image} />
                        <Card.Actions>
                            <Button onPress={() => router.push(`/edit-animal/${animal.id}`)}>Редагувати</Button>
                            <Button onPress={() => deleteAnimal(animal.id)} textColor="red">Видалити</Button>
                        </Card.Actions>
                    </Card>
                ))}
            </ScrollView>
            <View style={styles.menu}>
                <Button icon="account" mode="text" onPress={() => router.push("/admin_users")}>
                    Користувачі
                </Button>
                <Button icon="message" mode="text" onPress={() => router.push("/admin_screen")}>
                    Тваринки
                </Button>
                <Button icon="message" mode="text" onPress={() => router.push("/admin_screen")}>
                    Тваринки
                </Button>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    title: { fontSize: 22, fontWeight: "bold", margin: 16 },
    card: { margin: 12, borderRadius: 18 },
    menu: { flexDirection: "row", justifyContent: "space-around", marginTop: 18 },
    image: { height: 160, borderRadius: 12, margin: 12 },
    fab: { position: "absolute", right: 24, bottom: 24 }
});