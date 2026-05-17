import React, { useEffect, useRef, useState } from 'react';
import {
    FlatList,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StyleSheet,
    View,
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import {
    Avatar,
    IconButton,
    Text,
    TextInput
} from 'react-native-paper';
import { sendMessageToGemini } from '../../service/gemini';

interface Message {
    id: string;
    text: string;
    isUser: boolean;
    timestamp: Date;
}

export default function Chatbot() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: 'Hello! I\'m your VapeGuardian chatbot. I\'m here to help you with questions about vaping cessation, health effects, and support resources. How can I assist you today?',
            isUser: false,
            timestamp: new Date()
        }
    ]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    const scrollToBottom = () => {
        if (flatListRef.current && messages.length > 0) {
            flatListRef.current.scrollToEnd({ animated: true });
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = () => {
        if (inputText.trim() === '') return;

        const userMessage: Message = {
            id: Date.now().toString(),
            text: inputText.trim(),
            isUser: true,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsTyping(true);

        (async () => {
            const replyText = await sendMessageToGemini(userMessage.text);
            const botResponse: Message = {
                id: (Date.now() + 1).toString(),
                text: replyText,
                isUser: false,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, botResponse]);
            setIsTyping(false);
        })();
    };

    const renderMessage = ({ item }: { item: Message }) => (
        <View style={[
            styles.messageContainer,
            item.isUser ? styles.userMessageContainer : styles.botMessageContainer
        ]}>
            {!item.isUser && (
                <Avatar.Icon 
                    size={32} 
                    icon="robot" 
                    style={styles.botAvatar}
                />
            )}
            <View style={[
                styles.messageCard,
                item.isUser ? styles.userMessage : styles.botMessage
            ]}>
                {item.isUser ? (
                    <Text style={[styles.messageText, styles.userMessageText]}>
                        {item.text}
                    </Text>
                ) : (
                    <Markdown style={markdownStyles}>
                        {item.text}
                    </Markdown>
                )}
            </View>
            {item.isUser && (
                <Avatar.Icon 
                    size={32} 
                    icon="account" 
                    style={styles.userAvatar}
                />
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView 
                style={styles.keyboardAvoidingView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Chatbot</Text>
                </View>

                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={item => item.id}
                    style={styles.messagesList}
                    contentContainerStyle={styles.messagesContainer}
                    showsVerticalScrollIndicator={false}
                />

                {isTyping && (
                    <View style={styles.typingIndicator}>
                        <Avatar.Icon 
                            size={24} 
                            icon="robot" 
                            style={styles.typingAvatar}
                        />
                        <Text style={styles.typingText}>Bot is typing...</Text>
                    </View>
                )}

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.textInput}
                        value={inputText}
                        onChangeText={setInputText}
                        placeholder="Ask a question..."
                        multiline
                        mode="outlined"
                        onSubmitEditing={sendMessage}
                        returnKeyType="send"
                        placeholderTextColor="#A57C5C"
                        outlineColor="#6B4226"
                        activeOutlineColor="#6B4226"
                        textColor="#6B4226"
                    />
                    <IconButton
                        icon="send"
                        size={24}
                        mode="contained"
                        onPress={sendMessage}
                        style={styles.sendButton}
                        iconColor="#F7F4EA"
                        disabled={inputText.trim() === ''}
                    />
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FAF7F0' },
    keyboardAvoidingView: { flex: 1 },
    header: {
        backgroundColor: '#F7F4EA',
        paddingVertical: 16,
        paddingHorizontal: 20,
        paddingTop: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E4DCCF',
    },
    headerTitle: { fontSize: 28, fontWeight: '600', fontFamily: "SpaceMono-Regular", color: '#6B4226', textAlign: 'center' },
    messagesList: { flex: 1, backgroundColor: '#FAF7F0' },
    messagesContainer: { paddingVertical: 20, paddingHorizontal: 16, paddingBottom: 20 },
    messageContainer: { flexDirection: 'row', marginBottom: 16, alignItems: 'flex-end' },
    userMessageContainer: { justifyContent: 'flex-end' },
    botMessageContainer: { justifyContent: 'flex-start' },
    messageCard: {
        maxWidth: '75%',
        borderRadius: 18,
        paddingVertical: 12,
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    userMessage: { backgroundColor: '#6B4226', marginLeft: 8 },
    botMessage: { backgroundColor: '#F7F4EA', marginRight: 8 },
    messageText: { fontSize: 16,fontFamily: "SpaceMono-Regular", lineHeight: 22 },
    userMessageText: { color: '#F7F4EA' },
    botMessageText: { color: '#6B4226' },
    botAvatar: { backgroundColor: '#E4DCCF', marginRight: 8, tintColor: '#6B4226' },
    userAvatar: { backgroundColor: '#6B4226', marginLeft: 8 },
    typingIndicator: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 8 },
    typingAvatar: { backgroundColor: '#E4DCCF', marginRight: 8 },
    typingText: { fontSize: 14, color: '#8B5E3C', fontFamily: "SpaceMono-Regular", fontStyle: 'italic' },
    inputContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingBottom: 100,
        backgroundColor: '#F7F4EA',
        alignItems: 'flex-end',
        borderTopWidth: 1,
        borderTopColor: '#E4DCCF',
    },
    textInput: {
        flex: 1,
        maxHeight: 100,
        marginRight: 8,
        backgroundColor: '#FAF7F0',
    },
    sendButton: {
        backgroundColor: '#6B4226',
        borderRadius: 20,
    },
});

const markdownStyles = {
    body: { color: '#6B4226', fontFamily: "SpaceMono-Regular", fontSize: 16, lineHeight: 22 },
    strong: { fontWeight: 'bold', color: '#6B4226' },
    heading1: { fontSize: 24, fontFamily: "SpaceMono-Regular", fontWeight: '700', marginTop: 10, marginBottom: 6, color: '#6B4226' },
    heading2: { fontSize: 20, fontFamily: "SpaceMono-Regular", fontWeight: '600', marginTop: 10, marginBottom: 6, color: '#6B4226' },
    heading3: { fontSize: 18, fontFamily: "SpaceMono-Regular",fontWeight: '600', marginTop: 8, marginBottom: 4, color: '#6B4226' },
    list_item: { flexDirection: 'row', alignItems: 'flex-start', color: '#6B4226' },
};
