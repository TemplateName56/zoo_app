import React, { useState, useEffect } from "react";
import { View, StyleSheet, RefreshControl, ScrollView } from "react-native";
import { Button, Card, Text, ActivityIndicator, Avatar, TextInput, Modal, Portal, HelperText, Menu } from "react-native-paper";
import { Stack, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import api from "./api/api";
import { Animal } from "./types/animal";

const PAGE_SIZE = 8;

const fetchBreeds = async () => {
    const res = await api.get(`/animals/breeds`);
    return res.data as string[];
};

const fetchAnimals = async (params: any) => {
    const res = await api.get(`/animals/search`, { params });
    return res.data as Animal[];
};

export default function AnimalsScreen() {
    const [page, setPage] = useState(1);
    const [filterVisible, setFilterVisible] = useState(false);

    // Параметри пошуку
    const [breed, setBreed] = useState("");
    const [breeds, setBreeds] = useState<string[]>([]);
    const [age, setAge] = useState("");
    const [lat, setLat] = useState("");
    const [lng, setLng] = useState("");
    const [breedMenuVisible, setBreedMenuVisible] = useState(false);

    const router = useRouter();

    // Завантажити список порід
    useEffect(() => { fetchBreeds().then(setBreeds); }, []);

    // Параметри для запиту
    const searchParams: any = { page, limit: PAGE_SIZE };
    if (breed) searchParams.breed = breed;
    if (age) searchParams.age = age;
    if (lat && lng) { searchParams.lat = lat; searchParams.lng = lng; }

    const { data, isLoading, isFetching, refetch } = useQuery({
        queryKey: ["animals-search", { ...searchParams }],
        queryFn: () => fetchAnimals(searchParams),
        keepPreviousData: true,
    });

    // Скинути сторінку при зміні фільтрів
    useEffect(() => { setPage(1); }, [breed, age, lat, lng]);

    // ПРАВИЛЬНО рахуй maxPage:
    const maxPage = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE));
    const animals = data?.items ?? [];

    return (
        <View style={{flex:1}}>
            <Stack.Screen options={{ title: 'Головна' }} />
            <Button
                icon="filter"
                mode="outlined"
                style={{margin: 10, alignSelf: "flex-end"}}
                onPress={() => setFilterVisible(true)}
            >Пошук</Button>

            <ScrollView
                style={styles.bg}
                contentContainerStyle={styles.container}
                refreshControl={
                    <RefreshControl refreshing={isFetching} onRefresh={() => refetch()} />
                }
            >
                {global.user != null && (
                    <Button
                        icon="plus"
                        mode="contained"
                        style={styles.addBtn}
                        onPress={() => router.push("/add-animal")}
                        contentStyle={{ flexDirection: "row-reverse" }}
                    >Додати тваринку</Button>
                )}

                {isLoading ? (
                    <ActivityIndicator animating size="large" style={{ marginTop: 40 }} />
                ) : (
                    <>
                        {animals && animals.length > 0 ? animals.map(animal => (
                            <Card
                                key={animal.id}
                                style={styles.card}
                                onPress={() => router.push(`/${animal.id}`)}
                            >
                                <Card.Title
                                    title={animal.name}
                                    subtitle={animal.type + (animal.breed ? ` • ${animal.breed}` : "")}
                                    left={(props) => (
                                        <Avatar.Image
                                            {...props}
                                            source={{ uri: animal.photo_url }}
                                            style={{ backgroundColor: "#eee" }}
                                        />
                                    )}
                                />
                                <Card.Cover source={{ uri: animal.photo_url }} style={styles.image} />
                                <Card.Content>
                                    <Text style={styles.desc} numberOfLines={2}>{animal.description}</Text>
                                </Card.Content>
                            </Card>
                        )) : (
                            <Text style={{ marginTop: 40, textAlign: "center" }}>Жодної тварини не знайдено.</Text>
                        )}
                    </>
                )}

                <View style={styles.pagination}>
                    <Button
                        disabled={page <= 1}
                        mode="outlined"
                        onPress={() => setPage(p => Math.max(1, p - 1))}
                    >Назад</Button>
                    <Text style={styles.pageNumber}>Сторінка {page} / {maxPage}</Text>
                    <Button
                        disabled={page >= maxPage}
                        mode="outlined"
                        onPress={() => setPage(p => p + 1)}
                    >Далі</Button>
                </View>
            </ScrollView>
            <View style={styles.menu}>
                <Button icon="account" mode="text" onPress={() => router.push("/profile")}>
                    Профіль
                </Button>
                <Button icon="message" mode="text" onPress={() => router.push("/chat-list")}>
                    Чати
                </Button>
                <Button icon="bookmark" mode="text" onPress={() => router.push("/bookmarks")}>
                    Закладки
                </Button>
                {global.user === null && (
                    <Button icon="logout" mode="text" onPress={() => router.push("/login")}>
                        Ввійти
                    </Button>
                )}
            </View>

            {/* --- Бокове модальне вікно пошуку --- */}
            <Portal>
                <Modal visible={filterVisible} onDismiss={() => setFilterVisible(false)} contentContainerStyle={styles.modal}>
                    <Text style={{fontSize:18, fontWeight:"bold", marginBottom:10}}>Пошук тварин</Text>
                    <Text style={{marginBottom: 4}}>Порода</Text>
                    <Menu
                        visible={breedMenuVisible}
                        onDismiss={() => setBreedMenuVisible(false)}
                        anchor={
                            <Button
                                mode="outlined"
                                onPress={() => setBreedMenuVisible(true)}
                                style={{ justifyContent: 'flex-start', backgroundColor: "#fff" }}
                                contentStyle={{ flexDirection: 'row', justifyContent: 'flex-start' }}
                            >
                                {breed || "Оберіть породу"}
                            </Button>
                        }
                    >
                        <Menu.Item onPress={() => { setBreed(""); setBreedMenuVisible(false); }} title="Всі породи" />
                        {breeds.map((b) => (
                            <Menu.Item
                                key={b}
                                onPress={() => { setBreed(b); setBreedMenuVisible(false); }}
                                title={b}
                            />
                        ))}
                    </Menu>
                    <HelperText type="info">
                        Обери породу для фільтрації
                    </HelperText>
                    <TextInput
                        label="Вік"
                        value={age}
                        style={{backgroundColor: "#fff", marginBottom: 8}}
                        keyboardType="numeric"
                        onChangeText={setAge}
                    />
                    <TextInput
                        label="Широта"
                        value={lat}
                        style={{backgroundColor: "#fff", marginBottom: 8}}
                        keyboardType="numeric"
                        onChangeText={setLat}
                    />
                    <TextInput
                        label="Довгота"
                        value={lng}
                        style={{backgroundColor: "#fff", marginBottom: 14}}
                        keyboardType="numeric"
                        onChangeText={setLng}
                    />
                    <Button mode="contained" onPress={() => { setFilterVisible(false); refetch(); }}>
                        Пошук
                    </Button>
                    <Button mode="text" onPress={() => {
                        setBreed(""); setAge(""); setLat(""); setLng(""); setFilterVisible(false); refetch();
                    }}>
                        Очистити
                    </Button>
                </Modal>
            </Portal>
        </View>
    );
}

const styles = StyleSheet.create({
    bg: { backgroundColor: "#f7f7f7" },
    container: { padding: 16, paddingBottom: 32 },
    addBtn: { marginBottom: 16, borderRadius: 12 },
    card: { marginBottom: 16, borderRadius: 18, backgroundColor: "#fff", elevation: 3 },
    image: { height: 180, borderRadius: 12, marginHorizontal: 12, marginBottom: 10, marginTop: 4 },
    desc: { color: "#777", marginTop: 6 },
    pagination: { marginTop: 16, flexDirection: "row", alignItems: "center", justifyContent: "center" },
    pageNumber: { marginHorizontal: 16, fontSize: 16 },
    menu: { flexDirection: "row", justifyContent: "space-around", marginTop: 18 },
    modal: { backgroundColor: 'white', padding: 24, margin: 20, borderRadius: 16 }
});