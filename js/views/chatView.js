import BaseView from './baseView.js';

export default class ChatView extends BaseView {
    constructor() {
        super();
        this.chats = [];
        this.currentChat = null;
        this.unsubscribe = null;
        this.bindEvents();
    }

    bindEvents() {
        document.addEventListener('submit', async (e) => {
            if (e.target.matches('#messageForm')) {
                e.preventDefault();
                await this.sendMessage(e.target);
            }
        });
    }

    async render() {
        this.showLoading();
        
        try {
            await this.loadChats();
            
            this.container.innerHTML = `
                <div class="container-fluid py-4">
                    <div class="row g-4">
                        <!-- Chat List -->
                        <div class="col-md-4 col-lg-3">
                            <div class="card">
                                <div class="card-header bg-light">
                                    <h5 class="mb-0">Messages</h5>
                                </div>
                                <div class="list-group list-group-flush" id="chatList">
                                    ${this.renderChatList()}
                                </div>
                            </div>
                        </div>

                        <!-- Chat Window -->
                        <div class="col-md-8 col-lg-9">
                            <div class="card" style="height: calc(100vh - 120px);">
                                ${this.currentChat ? this.renderChatWindow() : this.renderEmptyState()}
                            </div>
                        </div>
                    </div>
                </div>
            `;

            if (this.currentChat) {
                this.scrollToBottom();
                this.subscribeToMessages();
            }
        } catch (error) {
            this.showError('Failed to load chats');
            console.error(error);
        }
    }

    async loadChats() {
        const userId = app.auth.currentUser.id;
        const snapshot = await firebase.firestore()
            .collection('chats')
            .where('participants', 'array-contains', userId)
            .orderBy('lastMessageAt', 'desc')
            .get();

        this.chats = await Promise.all(snapshot.docs.map(async doc => {
            const chat = { id: doc.id, ...doc.data() };
            
            // Get other participant's details
            const otherUserId = chat.participants.find(id => id !== userId);
            const userDoc = await firebase.firestore()
                .collection('users')
                .doc(otherUserId)
                .get();
                
            return {
                ...chat,
                otherUser: userDoc.data()
            };
        }));
    }

    renderChatList() {
        if (this.chats.length === 0) {
            return `
                <div class="text-center p-4 text-muted">
                    No conversations yet
                </div>
            `;
        }

        return this.chats.map(chat => `
            <a href="#" class="list-group-item list-group-item-action ${this.currentChat?.id === chat.id ? 'active' : ''}"
                onclick="chatView.selectChat('${chat.id}')">
                <div class="d-flex align-items-center">
                    <div class="avatar-circle bg-primary me-3">
                        ${chat.otherUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div class="flex-grow-1">
                        <div class="d-flex justify-content-between align-items-center">
                            <h6 class="mb-0">${chat.otherUser.name}</h6>
                            <small class="text-muted">
                                ${this.formatTimestamp(chat.lastMessageAt)}
                            </small>
                        </div>
                        <p class="mb-0 small text-truncate">
                            ${chat.lastMessage || 'No messages yet'}
                        </p>
                    </div>
                </div>
            </a>
        `).join('');
    }

    renderChatWindow() {
        return `
            <div class="card-header bg-light">
                <div class="d-flex align-items-center">
                    <div class="avatar-circle bg-primary me-3">
                        ${this.currentChat.otherUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h6 class="mb-0">${this.currentChat.otherUser.name}</h6>
                        <small class="text-muted">
                            ${this.currentChat.otherUser.role.charAt(0).toUpperCase() + 
                              this.currentChat.otherUser.role.slice(1)}
                        </small>
                    </div>
                </div>
            </div>
            <div class="card-body p-4" id="messageContainer" 
                style="height: calc(100% - 130px); overflow-y: auto;">
                ${this.renderMessages()}
            </div>
            <div class="card-footer bg-light">
                <form id="messageForm" class="d-flex gap-2">
                    <input type="text" class="form-control" 
                        placeholder="Type your message..." required>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </form>
            </div>
        `;
    }

    renderEmptyState() {
        return `
            <div class="card-body d-flex align-items-center justify-content-center text-center text-muted">
                <div>
                    <i class="fas fa-comments fa-3x mb-3"></i>
                    <h5>Select a conversation to start messaging</h5>
                </div>
            </div>
        `;
    }

    async selectChat(chatId) {
        if (this.unsubscribe) {
            this.unsubscribe();
        }

        this.currentChat = this.chats.find(chat => chat.id === chatId);
        await this.render();
    }

    subscribeToMessages() {
        this.unsubscribe = firebase.firestore()
            .collection('chats')
            .doc(this.currentChat.id)
            .collection('messages')
            .orderBy('createdAt', 'asc')
            .onSnapshot(snapshot => {
                snapshot.docChanges().forEach(change => {
                    if (change.type === 'added') {
                        this.addMessage(change.doc.data());
                    }
                });
            });
    }

    async sendMessage(form) {
        const input = form.querySelector('input');
        const message = input.value.trim();
        input.value = '';

        if (!message) return;

        try {
            const messageData = {
                text: message,
                senderId: app.auth.currentUser.id,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            // Add message to chat
            await firebase.firestore()
                .collection('chats')
                .doc(this.currentChat.id)
                .collection('messages')
                .add(messageData);

            // Update chat metadata
            await firebase.firestore()
                .collection('chats')
                .doc(this.currentChat.id)
                .update({
                    lastMessage: message,
                    lastMessageAt: messageData.createdAt
                });

        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message');
        }
    }

    addMessage(message) {
        const container = document.getElementById('messageContainer');
        if (!container) return;

        const isOwnMessage = message.senderId === app.auth.currentUser.id;
        const messageHtml = `
            <div class="d-flex ${isOwnMessage ? 'justify-content-end' : 'justify-content-start'} mb-3">
                <div class="message ${isOwnMessage ? 'message-own' : 'message-other'}">
                    ${message.text}
                    <div class="message-time">
                        ${this.formatTimestamp(message.createdAt)}
                    </div>
                </div>
            </div>
        `;

        container.insertAdjacentHTML('beforeend', messageHtml);
        this.scrollToBottom();
    }

    scrollToBottom() {
        const container = document.getElementById('messageContainer');
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }

    formatTimestamp(timestamp) {
        if (!timestamp) return '';
        
        const date = timestamp.toDate();
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff/60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff/3600000)}h ago`;
        return date.toLocaleDateString();
    }

    cleanup() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }
} 