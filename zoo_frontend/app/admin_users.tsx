import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Card, Text, Button, useTheme, Avatar, Portal, Modal, TextInput, IconButton, Snackbar } from "react-native-paper";
import api from "./api/api";
import {User} from "@/app/types/user";

export default function AdminUsersScreen() {
    const [users, setUsers] = useState<User[]>([]);
    const [filterVisible, setFilterVisible] = useState(false);
    const [search, setSearch] = useState("");
    const [snackbar, setSnackbar] = useState({ visible: false, message: "" });
    const theme = useTheme();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async (query: string = "") => {
        try {
            const res = await api.get("/admin", { params: query ? { search: query } : {} });
            setUsers(res.data);
        } catch (e) {
            setSnackbar({ visible: true, message: "Помилка завантаження користувачів" });
        }
    };

    const blockUser = async (id: number, block: boolean) => {
        try {
            if (block) {
                await api.post(`/admin/block/${id}`);
                setSnackbar({ visible: true, message: "Користувача заблоковано" });
            } else {
                await api.post(`/admin/unblock/${id}`);
                setSnackbar({ visible: true, message: "Користувача розблоковано" });
            }
            // Оновити список
            fetchUsers(search);
        } catch (e) {
            setSnackbar({ visible: true, message: "Помилка блокування" });
        }
    };

    const onSearch = () => {
        fetchUsers(search);
        setFilterVisible(false);
    };

    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <Text style={styles.title}>Адмін-панель: Користувачі</Text>
            <IconButton icon="magnify" size={28} onPress={() => setFilterVisible(true)} style={{ alignSelf: "flex-end", marginRight: 12, marginTop: -40 }} />
            <ScrollView>
                {users.map(user => (
                    // @ts-ignore
                    <Card key={user.id} style={styles.card}>
                        <Card.Title
                            title={user.name}
                            subtitle={user.email + (user.isAdmin ? " • адміністратор" : "")}
                            left={props => user.avatar_url ? <Avatar.Image {...props} source={{ uri: user.avatar_url }} /> : <Avatar.Icon {...props} icon="account" />}
                        />
                        <Card.Content>
                            <Text>Телефон: {user.phone || "—"}</Text>
                            <Text>Створено: {user.created_at && user.created_at.slice(0, 10)}</Text>
                            <Text style={{ color: user.isBlocked ? "red" : theme.colors.onSurface }}>
                                Статус: {user.isBlocked ? "Заблоковано" : "Активний"}
                            </Text>
                        </Card.Content>
                        <Card.Actions>
                            <Button
                                icon={user.isBlocked ? "lock-open-outline" : "lock-outline"}
                                onPress={() => blockUser(user.id, !user.isBlocked)}
                                textColor={user.isBlocked ? theme.colors.primary : "red"}
                            >
                                {user.isBlocked ? "Розблокувати" : "Заблокувати"}
                            </Button>
                        </Card.Actions>
                    </Card>
                ))}
            </ScrollView>
            <Portal>
                <Modal visible={filterVisible} onDismiss={() => setFilterVisible(false)}
                       contentContainerStyle={[
                           styles.modal,
                           { backgroundColor: theme.colors.surface }
                       ]}>
                    <Text style={{ fontWeight: "bold", fontSize: 18, marginBottom: 12 }}>Пошук користувача</Text>
                    <TextInput
                        label="Ім'я або email"
                        value={search}
                        onChangeText={setSearch}
                        autoFocus
                        style={{ marginBottom: 16 }}
                    />
                    <Button mode="contained" onPress={onSearch}>
                        Знайти
                    </Button>
                </Modal>
            </Portal>
            <Snackbar
                visible={snackbar.visible}
                onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
                duration={2500}
            >
                {snackbar.message}
            </Snackbar>
        </View>
    );
}

const styles = StyleSheet.create({
    title: { fontSize: 22, fontWeight: "bold", margin: 16, marginBottom: 0 },
    card: { margin: 12, borderRadius: 18 },
    modal: {
        margin: 24,
        padding: 22,
        borderRadius: 18,
        alignItems: "stretch",
        justifyContent: "flex-start",
    }
});