class PaymentService {
    constructor() {
        this.stripe = Stripe('your_publishable_key');
        this.db = firebase.firestore();
        this.paymentMethods = [];
        this.loadSavedPaymentMethods();
    }

    async loadSavedPaymentMethods() {
        try {
            const snapshot = await this.db
                .collection('users')
                .doc(app.auth.currentUser.id)
                .collection('payment_methods')
                .get();

            this.paymentMethods = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error loading payment methods:', error);
        }
    }

    async createPaymentIntent(orderId, amount, paymentMethodId = null) {
        try {
            const payload = {
                orderId,
                amount,
                currency: 'usd',
                customerId: app.auth.currentUser.id
            };

            if (paymentMethodId) {
                payload.payment_method = paymentMethodId;
            }

            const response = await fetch('/create-payment-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const { clientSecret } = await response.json();
            return clientSecret;
        } catch (error) {
            console.error('Error creating payment intent:', error);
            throw error;
        }
    }

    async processPayment(orderId, amount, saveCard = false, paymentMethodId = null) {
        try {
            const clientSecret = await this.createPaymentIntent(orderId, amount, paymentMethodId);
            let result;

            if (paymentMethodId) {
                // Use saved payment method
                result = await this.stripe.confirmCardPayment(clientSecret, {
                    payment_method: paymentMethodId
                });
            } else {
                // Use new card
                result = await this.stripe.confirmCardPayment(clientSecret, {
                    payment_method: {
                        card: elements.getElement('card'),
                        billing_details: {
                            name: app.auth.currentUser.name,
                            email: app.auth.currentUser.email
                        }
                    },
                    setup_future_usage: saveCard ? 'off_session' : undefined
                });
            }

            if (result.error) {
                throw result.error;
            }

            // Save payment method if requested
            if (saveCard && result.paymentIntent.payment_method) {
                await this.savePaymentMethod(result.paymentIntent.payment_method);
            }

            // Update order status
            await this.updateOrderStatus(orderId, 'paid');
            
            // Record transaction
            await this.recordTransaction(orderId, result.paymentIntent);

            return result.paymentIntent;
        } catch (error) {
            console.error('Payment failed:', error);
            throw error;
        }
    }

    async savePaymentMethod(paymentMethodId) {
        try {
            const paymentMethod = await this.stripe.paymentMethods.retrieve(paymentMethodId);
            
            await this.db
                .collection('users')
                .doc(app.auth.currentUser.id)
                .collection('payment_methods')
                .doc(paymentMethodId)
                .set({
                    type: paymentMethod.type,
                    brand: paymentMethod.card.brand,
                    last4: paymentMethod.card.last4,
                    expMonth: paymentMethod.card.exp_month,
                    expYear: paymentMethod.card.exp_year,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });

            await this.loadSavedPaymentMethods();
        } catch (error) {
            console.error('Error saving payment method:', error);
            throw error;
        }
    }

    async removePaymentMethod(paymentMethodId) {
        try {
            await this.stripe.paymentMethods.detach(paymentMethodId);
            
            await this.db
                .collection('users')
                .doc(app.auth.currentUser.id)
                .collection('payment_methods')
                .doc(paymentMethodId)
                .delete();

            await this.loadSavedPaymentMethods();
        } catch (error) {
            console.error('Error removing payment method:', error);
            throw error;
        }
    }

    async recordTransaction(orderId, paymentIntent) {
        try {
            await this.db.collection('transactions').add({
                orderId,
                userId: app.auth.currentUser.id,
                paymentIntentId: paymentIntent.id,
                amount: paymentIntent.amount,
                currency: paymentIntent.currency,
                status: paymentIntent.status,
                paymentMethod: paymentIntent.payment_method,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Error recording transaction:', error);
        }
    }

    async requestRefund(orderId, amount, reason) {
        try {
            const response = await fetch('/create-refund', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId,
                    amount,
                    reason
                })
            });

            const refund = await response.json();
            
            // Update order status
            await this.updateOrderStatus(orderId, 'refunded');
            
            // Record refund
            await this.recordRefund(orderId, refund);
            
            return refund;
        } catch (error) {
            console.error('Refund failed:', error);
            throw error;
        }
    }

    async recordRefund(orderId, refund) {
        try {
            await this.db.collection('refunds').add({
                orderId,
                userId: app.auth.currentUser.id,
                refundId: refund.id,
                amount: refund.amount,
                reason: refund.reason,
                status: refund.status,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Error recording refund:', error);
        }
    }

    async getTransactionHistory() {
        try {
            const snapshot = await this.db
                .collection('transactions')
                .where('userId', '==', app.auth.currentUser.id)
                .orderBy('createdAt', 'desc')
                .get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error loading transaction history:', error);
            throw error;
        }
    }

    formatCard(card) {
        return `${card.brand.toUpperCase()} •••• ${card.last4}`;
    }

    formatExpiryDate(month, year) {
        return `${month.toString().padStart(2, '0')}/${year.toString().slice(-2)}`;
    }

    async updateOrderStatus(orderId, status) {
        await this.db.collection('orders')
            .doc(orderId)
            .update({
                paymentStatus: status,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
    }
} 