import React, { useState, useEffect } from 'react';
import { transactionAPI, aiAPI, notificationAPI } from '../services/api.service';
import { useTransactionStore } from '../stores/transactionStore';
import { useNotificationStore } from '../stores/notificationStore';
import { X, Sparkles, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES = {
  expense: [
    'Food & Drinks', 'Transportation', 'Shopping', 'Entertainment',
    'Bills & Utilities', 'Healthcare', 'Education', 'Travel',
    'Groceries', 'Rent', 'Insurance', 'Other Expense'
  ],
  income: ['Salary', 'Freelance', 'Investment', 'Gift', 'Other Income']
};

const TransactionModal = ({ transaction, onClose, onSuccess }) => {
  const { addTransaction, updateTransaction } = useTransactionStore();
  const { setNotifications, setUnreadCount } = useNotificationStore();
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [receiptFile, setReceiptFile] = useState(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  
  const [formData, setFormData] = useState({
    type: transaction?.type || 'expense',
    amount: transaction?.amount || '',
    category: transaction?.category || '',
    description: transaction?.description || '',
    date: transaction?.date ? new Date(transaction.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    merchant: transaction?.merchant || '',
    tags: transaction?.tags?.join(', ') || '',
    isRecurring: transaction?.isRecurring || false,
    recurringFrequency: transaction?.recurringFrequency || ''
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleAICategorize = async () => {
    if (!formData.description) {
      toast.error('Please enter a description first');
      return;
    }

    try {
      setAiLoading(true);
      const response = await aiAPI.categorize(formData.description, formData.amount);
      if (response.success) {
        setFormData({ ...formData, category: response.data.category });
        toast.success('Category suggested by AI!');
      }
    } catch (error) {
      toast.error('Failed to get AI suggestion');
    } finally {
      setAiLoading(false);
    }
  };

  const handleReceiptChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File size should be less than 5MB');
        return;
      }
      setReceiptFile(file);
    }
  };

  const handleUploadReceipt = async (transactionId) => {
    if (!receiptFile) return;

    try {
      setUploadingReceipt(true);
      const response = await transactionAPI.uploadReceipt(transactionId, receiptFile);
      if (response.success) {
        toast.success('Receipt uploaded successfully');
      }
    } catch (error) {
      toast.error('Failed to upload receipt');
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        amount: parseFloat(formData.amount),
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(t => t) : []
      };

      if (transaction) {
        const response = await transactionAPI.update(transaction._id, submitData);
        if (response.success) {
          updateTransaction(transaction._id, response.data);
          
          // Upload receipt if provided
          if (receiptFile) {
            await handleUploadReceipt(transaction._id);
          }
          
          // Fetch notifications to check for any budget alerts
          const notifResponse = await notificationAPI.getAll();
          if (notifResponse.success) {
            setNotifications(notifResponse.data);
            setUnreadCount(notifResponse.unreadCount);
          }
          
          toast.success('Transaction updated');
        }
      } else {
        const response = await transactionAPI.create(submitData);
        if (response.success) {
          addTransaction(response.data);
          
          // Upload receipt if provided
          if (receiptFile) {
            await handleUploadReceipt(response.data._id);
          }
          
          // Fetch notifications to check for any budget alerts triggered by this transaction
          const notifResponse = await notificationAPI.getAll();
          if (notifResponse.success) {
            setNotifications(notifResponse.data); // updating the notification store
            setUnreadCount(notifResponse.unreadCount); // updating unread count of notifications // i am polling the notifications here
            
            // Show toast if there are new budget alerts
            const budgetAlerts = notifResponse.data.filter(
              n => !n.isRead && n.type === 'budget_alert'
            );
            if (budgetAlerts.length > 0) {
              toast.error(`⚠️ ${budgetAlerts[0].title}`, { duration: 5000 });
            }
          }
          
          toast.success('Transaction added');
        }
      }

      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            {transaction ? 'Edit Transaction' : 'Add Transaction'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select name="type" value={formData.type} onChange={handleChange} className="input" required>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Amount</label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                className="input"
                placeholder="0.00"
                step="0.01"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="input"
              placeholder="e.g., Lunch at restaurant"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <div className="flex gap-2">
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="input flex-1"
                required
              >
                <option value="">Select category</option>
                {CATEGORIES[formData.type].map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAICategorize}
                className="btn btn-secondary flex items-center gap-2"
                disabled={aiLoading}
              >
                <Sparkles size={18} />
                {aiLoading ? 'AI...' : 'AI'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Merchant (optional)</label>
              <input
                type="text"
                name="merchant"
                value={formData.merchant}
                onChange={handleChange}
                className="input"
                placeholder="Store name"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tags (comma separated)</label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              className="input"
              placeholder="e.g., work, travel, gift"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Receipt (optional)</label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleReceiptChange}
                className="input flex-1"
                id="receipt-upload"
              />
            </div>
            {receiptFile && (
              <p className="text-sm text-gray-600 mt-1">
                Selected: {receiptFile.name}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isRecurring"
              checked={formData.isRecurring}
              onChange={handleChange}
              id="isRecurring"
            />
            <label htmlFor="isRecurring" className="text-sm font-medium">
              Recurring Transaction
            </label>
          </div>

          {formData.isRecurring && (
            <div>
              <label className="block text-sm font-medium mb-1">Frequency</label>
              <select
                name="recurringFrequency"
                value={formData.recurringFrequency}
                onChange={handleChange}
                className="input"
              >
                <option value="">Select frequency</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading || uploadingReceipt}
              className="btn btn-primary flex-1"
            >
              {loading || uploadingReceipt ? 'Saving...' : (transaction ? 'Update' : 'Add')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionModal;
