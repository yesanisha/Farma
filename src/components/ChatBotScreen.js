import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Use same API key as geminiService (from environment)
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const ChatBotScreen = ({ navigation, visible, onClose }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm FARMA AI, your farming assistant. I can help you with plant diseases, farming techniques, weather advice, and crop management. How can I assist you today?",
      isBot: true,
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const scrollViewRef = useRef();
  const slideAnim = useRef(new Animated.Value(500)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else {
      Animated.spring(slideAnim, {
        toValue: 500,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    }
  }, [visible]);

  const generateResponse = async (userMessage) => {
    try {
      console.log("FARMA AI generating response for:", userMessage);

      // Use same model as geminiService for consistency
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      });

      // Enhanced farming-focused prompt
      const prompt = `You are FARMA AI, an expert agricultural assistant developed for farmers and gardeners. Your expertise includes:

🌱 PLANT HEALTH:
- Disease identification and treatment recommendations
- Pest control (organic and conventional methods)
- Nutrient deficiency diagnosis

🌾 CROP MANAGEMENT:
- Planting schedules and seasonal calendars
- Irrigation and watering best practices
- Harvesting timing and techniques

🌍 SOIL & ENVIRONMENT:
- Soil health improvement
- Composting and organic fertilizers
- Climate adaptation strategies

🔬 MODERN FARMING:
- Sustainable farming practices
- Integrated pest management (IPM)
- Precision agriculture basics

GUIDELINES:
- Provide practical, actionable advice
- Include specific product names or treatments when relevant
- Mention safety precautions when dealing with chemicals
- Suggest organic alternatives when possible
- Keep responses concise but comprehensive
- Use bullet points for clarity when listing steps

User's question: ${userMessage}

Please respond helpfully and practically:`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      console.log("FARMA AI response generated successfully");
      return responseText;
    } catch (error) {
      console.error("FARMA AI Error:", error);

      // Provide helpful fallback responses
      if (error.message?.includes("API key")) {
        return "I'm having trouble connecting to my knowledge base. The API key may need to be checked. Please try again in a moment.";
      } else if (error.message?.includes("quota") || error.message?.includes("limit")) {
        return "I've reached my response limit for now. Please try again in a few minutes. In the meantime, you can check the Plant Gallery for information.";
      } else if (error.message?.includes("network") || error.message?.includes("fetch")) {
        return "I'm having trouble connecting to the internet. Please check your connection and try again.";
      }
      return "I apologize, but I'm having trouble processing your question right now. Please try rephrasing or ask again in a moment.";
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: inputText.trim(),
      isBot: false,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    setIsTyping(true);

    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      console.log('Starting message generation...');
      const botResponse = await generateResponse(userMessage.text);

      const botMessage = {
        id: Date.now() + 1,
        text: botResponse,
        isBot: true,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Send message error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: "I'm sorry, I encountered an unexpected error. Please try asking your question again.",
        isBot: true,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const renderMessage = (message) => (
    <View
      key={message.id}
      style={[
        styles.messageContainer,
        message.isBot ? styles.botMessageContainer : styles.userMessageContainer,
      ]}
    >
      {message.isBot && (
        <View style={styles.botAvatar}>
          <Ionicons name="leaf" size={16} color="#FFFFFF" />
        </View>
      )}

      <View
        style={[
          styles.messageBubble,
          message.isBot ? styles.botMessage : styles.userMessage,
        ]}
      >
        <Text style={[
          styles.messageText,
          message.isBot ? styles.botMessageText : styles.userMessageText,
        ]}>
          {message.text}
        </Text>
        <Text style={[
          styles.timestamp,
          message.isBot ? styles.botTimestamp : styles.userTimestamp,
        ]}>
          {message.timestamp.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>
      </View>
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.quickActions}>
      <Text style={styles.quickActionsTitle}>Ask FARMA AI</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => setInputText('How do I identify and treat plant diseases?')}
        >
          <Ionicons name="bug" size={16} color="#4A7C59" />
          <Text style={styles.quickActionText}>Disease Help</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => setInputText('What vegetables can I plant this month?')}
        >
          <Ionicons name="calendar" size={16} color="#4A7C59" />
          <Text style={styles.quickActionText}>Planting Guide</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => setInputText('How can I get rid of pests organically?')}
        >
          <Ionicons name="shield-checkmark" size={16} color="#4A7C59" />
          <Text style={styles.quickActionText}>Pest Control</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => setInputText('Best ways to improve soil fertility naturally?')}
        >
          <Ionicons name="earth" size={16} color="#4A7C59" />
          <Text style={styles.quickActionText}>Soil Health</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => setInputText('How often should I water my vegetable garden?')}
        >
          <Ionicons name="water" size={16} color="#4A7C59" />
          <Text style={styles.quickActionText}>Watering Tips</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => setInputText('What are signs of nutrient deficiency in plants?')}
        >
          <Ionicons name="leaf" size={16} color="#4A7C59" />
          <Text style={styles.quickActionText}>Plant Nutrition</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY: slideAnim }] }
      ]}
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.botHeaderAvatar}>
              <Ionicons name="leaf" size={20} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.headerTitle}>FARMA AI</Text>
              <Text style={styles.headerSubtitle}>
                {isTyping ? 'Typing...' : 'Farming Assistant'}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#1C1C1E" />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          style={styles.chatContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Messages */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.map(renderMessage)}

            {isLoading && (
              <View style={styles.typingIndicator}>
                <View style={styles.botAvatar}>
                  <Ionicons name="leaf" size={16} color="#FFFFFF" />
                </View>
                <View style={styles.typingBubble}>
                  <ActivityIndicator size="small" color="#4A7C59" />
                  <Text style={styles.typingText}>FARMA AI is thinking...</Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Quick Actions */}
          {messages.length === 1 && renderQuickActions()}

          {/* Input Area */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Ask about farming, plants, diseases..."
                placeholderTextColor="#8E8E93"
                multiline
                maxLength={500}
                editable={!isLoading}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!inputText.trim() || isLoading) && styles.sendButtonDisabled
                ]}
                onPress={sendMessage}
                disabled={!inputText.trim() || isLoading}
              >
                <Ionicons
                  name="send"
                  size={20}
                  color={(!inputText.trim() || isLoading) ? "#8E8E93" : "#FFFFFF"}
                />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    zIndex: 1000,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  botHeaderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4A7C59',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  botMessageContainer: {
    justifyContent: 'flex-start',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
    flexDirection: 'row-reverse',
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4A7C59',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  botMessage: {
    backgroundColor: '#F0F0F0',
    borderBottomLeftRadius: 4,
  },
  userMessage: {
    backgroundColor: '#4A7C59',
    borderBottomRightRadius: 4,
    marginLeft: 8,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  botMessageText: {
    color: '#1C1C1E',
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  timestamp: {
    fontSize: 12,
    marginTop: 4,
  },
  botTimestamp: {
    color: '#8E8E93',
  },
  userTimestamp: {
    color: 'rgba(255,255,255,0.7)',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
  },
  typingText: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 8,
  },
  quickActions: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  quickActionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8F0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#4A7C59',
  },
  quickActionText: {
    fontSize: 14,
    color: '#4A7C59',
    fontWeight: '500',
    marginLeft: 6,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F8F9FA',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 50,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4A7C59',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#E5E5EA',
  },
});

export default ChatBotScreen;