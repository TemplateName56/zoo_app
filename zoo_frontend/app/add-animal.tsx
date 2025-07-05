import React, { useState } from "react";
import { View, ScrollView, StyleSheet, Alert } from "react-native";
import {TextInput, Button, Text, Card, Avatar, useTheme} from "react-native-paper";
import * as ImagePicker from 'expo-image-picker';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {Stack, useRouter} from "expo-router";
import api from "./api/api";
import { Animal, AnimalPhoto } from "./types/animal";

export default function AddAnimalScreen() {
    const [animal, setAnimal] = useState<Animal>({
        name: "", type: "", breed: "", photo_url: "", sex: "male", age: "",
        description: "", lat: 0, lng: 0, status: "available"
    });
    const [extraPhotos, setExtraPhotos] = useState<AnimalPhoto[]>([]);
    const router = useRouter();
    const queryClient = useQueryClient();
    const theme = useTheme();

    const addAnimalMutation = useMutation({
        mutationFn: (newAnimal: any) => api.post("/animals/add", newAnimal),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["animals"] });
            queryClient.invalidateQueries({ queryKey: ["breeds"] });
            router.replace("/");
        },
        onError: () => {
            Alert.alert("Помилка", "Не вдалося додати тварину");
        }
    });

    const pickMainPhoto = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            base64: true,
            quality: 0.7,
        });
        // @ts-ignore
        if ((!result.canceled && result.assets && result.assets[0].base64) || (!result.cancelled && result.base64)) {
            // @ts-ignore
            const base64 = result.assets ? `data:image/jpeg;base64,${result.assets[0].base64}` : `data:image/jpeg;base64,${result.base64}`;
            setAnimal(a => ({ ...a, photo_url: base64 }));
        }
    };

    const pickExtraPhoto = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            base64: true,
            quality: 0.7,
        });
        // @ts-ignore
        if ((!result.canceled && result.assets && result.assets[0].base64) || (!result.cancelled && result.base64)) {
            // @ts-ignore
            const base64 = result.assets ? `data:image/jpeg;base64,${result.assets[0].base64}` : `data:image/jpeg;base64,${result.base64}`;
            setExtraPhotos(arr => [...arr, { photo_url: base64 }]);
        }
    };

    const addAnimal = () => {
        if (!animal.name || !animal.type || !animal.photo_url) {
            Alert.alert("Помилка", "Заповніть обовʼязкові поля та виберіть фото!");
            return;
        }
        addAnimalMutation.mutate({ ...animal, photos: extraPhotos });
    };

    // @ts-ignore
    return (
        <ScrollView style={{backgroundColor: theme.colors.background}} contentContainerStyle={styles.container}>
            <Stack.Screen
                options={{
                    title: 'Додати тваринку',
                    headerStyle: { backgroundColor: theme.colors.elevation.level1 },
                    headerTintColor: theme.colors.primary,
                    headerTitleStyle: { color: theme.colors.primary },
                }}
            />
            <Text variant="headlineMedium" style={{marginBottom: 20}}>Додавання тварини</Text>
            <TextInput
                label="Кличка"
                value={animal.name}
                onChangeText={v => setAnimal({ ...animal, name: v })}
                style={styles.input}
            />
            <TextInput
                label="Тип (Кіт/Собака/Інше)"
                value={animal.type}
                onChangeText={v => setAnimal({ ...animal, type: v })}
                style={styles.input}
            />
            <TextInput
                label="Порода"
                value={animal.breed}
                onChangeText={v => setAnimal({ ...animal, breed: v })}
                style={styles.input}
            />

            <Text style={{marginTop:10, marginBottom: 4}}>Основне фото</Text>
            {animal.photo_url
                ? <Card style={{ marginBottom: 10, alignSelf: "flex-start" }}>
                    <Avatar.Image size={100} source={{ uri: animal.photo_url }} />
                </Card>
                : null}
            <Button mode="outlined" icon="image" onPress={pickMainPhoto} style={{ marginBottom: 14 }}>
                Вибрати основне фото
            </Button>

            <Text style={{marginBottom: 4}}>Додаткові фото</Text>
            <ScrollView horizontal style={{marginBottom: 10}}>
                {extraPhotos.map((p, i) =>
                    <Avatar.Image key={i} size={60} source={{ uri: p.photo_url }} style={{ marginRight: 8 }} />
                )}
            </ScrollView>
            <Button mode="outlined" icon="camera" onPress={pickExtraPhoto} style={{ marginBottom: 18 }}>
                Додати додаткове фото
            </Button>

            <TextInput
                label="Опис"
                value={animal.description}
                onChangeText={v => setAnimal({ ...animal, description: v })}
                style={styles.input}
                multiline
            />

            <TextInput
                label="Вік (років)"
                value={animal.age ? animal.age.toString() : ""}
                onChangeText={v => setAnimal({ ...animal, age: v })}
                style={styles.input}
                keyboardType="numeric"
            />

            <Text style={{marginTop:10, marginBottom: 4}}>Координати</Text>
            <TextInput
                label="Широта (lat)"
                // @ts-ignore
                value={ animal.lat.toString() || 0}
                // @ts-ignore
                onChangeText={v => setAnimal({ ...animal, lat: v })}
                style={styles.input}
                keyboardType="numeric"
            />
            <TextInput
                label="Довгота (lng)"
                // @ts-ignore
                value={animal.lng.toString() || 0}
                // @ts-ignore
                onChangeText={v => setAnimal({ ...animal, lng: v })}
                style={styles.input}
                keyboardType="numeric"
            />

            <Text style={{marginTop: 10, marginBottom: 4}}>Стать</Text>
            <View style={styles.sexRow}>
                <Button
                    mode={animal.sex === "male" ? "contained" : "outlined"}
                    onPress={() => setAnimal(a => ({ ...a, sex: "male" }))}
                    style={styles.sexBtn}
                >
                    Чоловіча
                </Button>
                <Button
                    mode={animal.sex === "female" ? "contained" : "outlined"}
                    onPress={() => setAnimal(a => ({ ...a, sex: "female" }))}
                    style={styles.sexBtn}
                >
                    Жіноча
                </Button>
            </View>

            <Button
                mode="contained"
                style={styles.saveBtn}
                loading={addAnimalMutation.isPending}
                onPress={addAnimal}
            >
                Додати
            </Button>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { padding: 20, paddingBottom: 32 },
    input: { marginBottom: 14 },
    sexRow: { flexDirection: "row", marginBottom: 18, gap: 16 },
    sexBtn: { flex: 1 },
    saveBtn: { marginTop: 8, borderRadius: 10 },
});