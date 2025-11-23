import React, { useEffect, useState } from 'react';
import { transactionAPI } from '../services/api.service';
import { useTransactionStore } from '../stores/transactionStore';
import { Plus, Search, Filter, Trash2, Edit, FileText, X } from 'lucide-react';
import TransactionModal from '../components/TransactionModal';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const Transactions = () => {
  const { transactions, filters, setTransactions, setFilters, deleteTransaction } = useTransactionStore();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState(null);

  useEffect(() => {
    fetchTransactions();
  }, [filters]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      // Filter out 'all' values before sending to API
      const apiFilters = {};
      if (filters.type && filters.type !== 'all') apiFilters.type = filters.type;
      if (filters.category && filters.category !== 'all') apiFilters.category = filters.category;
      if (filters.startDate) apiFilters.startDate = filters.startDate;
      if (filters.endDate) apiFilters.endDate = filters.endDate;
      if (filters.minAmount) apiFilters.minAmount = filters.minAmount;
      if (filters.maxAmount) apiFilters.maxAmount = filters.maxAmount;
      if (filters.search) apiFilters.search = filters.search;

      const response = await transactionAPI.getAll(apiFilters);
      if (response.success) {
        setTransactions(response.data);
      }
    } catch (error) {
      toast.error('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;

    try {
      await transactionAPI.delete(id);
      deleteTransaction(id);
      toast.success('Transaction deleted');
    } catch (error) {
      toast.error('Failed to delete transaction');
    }
  };

  const handleEdit = (transaction) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedTransaction(null);
    setIsModalOpen(true);
  };

  const getTypeColor = (type) => {
    return type === 'income' ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
        <button onClick={handleAdd} className="btn btn-primary flex items-center gap-2">
          <Plus size={20} />
          Add Transaction
        </button>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search transactions..."
              className="input pl-10"
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Filter size={20} />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t">
            <select
              className="input"
              value={filters.type}
              onChange={(e) => setFilters({ type: e.target.value })}
            >
              <option value="all">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>

            <select
              className="input"
              value={filters.category}
              onChange={(e) => setFilters({ category: e.target.value })}
            >
              <option value="all">All Categories</option>
              <option value="Food & Drinks">Food & Drinks</option>
              <option value="Transportation">Transportation</option>
              <option value="Shopping">Shopping</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Bills & Utilities">Bills & Utilities</option>
              <option value="Salary">Salary</option>
              <option value="Freelance">Freelance</option>
            </select>

            <input
              type="date"
              className="input"
              value={filters.startDate || ''}
              onChange={(e) => setFilters({ startDate: e.target.value })}
            />
          </div>
        )}
      </div>

      {/* Transactions List */}
      <div className="card">
        {loading ? (
          <div className="text-center py-8">Loading transactions...</div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No transactions found. Add your first transaction!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Description</th>
                  <th className="text-left py-3 px-4">Category</th>
                  <th className="text-left py-3 px-4">Type</th>
                  <th className="text-right py-3 px-4">Amount</th>
                  <th className="text-center py-3 px-4">Receipt</th>
                  <th className="text-right py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction._id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      {format(new Date(transaction.date), 'MMM dd, yyyy')}
                    </td>
                    <td className="py-3 px-4">{transaction.description || '-'}</td>
                    <td className="py-3 px-4">{transaction.category}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(transaction.type)}`}>
                        {transaction.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold">
                      ${transaction.amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {transaction.receipt?.url ? (
                        <button
                          onClick={() => setViewingReceipt(transaction.receipt.url)}
                          className="text-blue-600 hover:text-blue-800"
                          title="View receipt"
                        >
                          <FileText size={18} />
                        </button>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleEdit(transaction)}
                        className="text-blue-600 hover:text-blue-800 mr-3"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(transaction._id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Receipt Viewer Modal */}
      {viewingReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setViewingReceipt(null)}>
          <div className="relative max-w-4xl max-h-[90vh] p-4">
            <button
              onClick={() => setViewingReceipt(null)}
              className="absolute top-2 right-2 bg-white rounded-full p-2 hover:bg-gray-100 z-10"
            >
              <X size={24} />
            </button>
            <img
              src={viewingReceipt}
              alt="Receipt"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      {isModalOpen && (
        <TransactionModal
          transaction={selectedTransaction}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedTransaction(null);
          }}
          onSuccess={fetchTransactions}
        />
      )}
    </div>
  );
};

export default Transactions;
