import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction } from '../types/transaction';

const STORAGE_KEY = '@app_financeiro:transactions';

export interface ITransactionRepository {
  /**
   * Retrieves all stored transactions.
   */
  getAll(): Promise<Transaction[]>;

  /**
   * Saves a new transaction or updates an existing one.
   * If date is omitted, it defaults to the current day (local timezone).
   */
  save(transactionData: Omit<Transaction, 'id' | 'date'> & { id?: string; date?: string }): Promise<Transaction>;

  /**
   * Deletes a transaction by its unique ID.
   */
  delete(id: string): Promise<void>;

  /**
   * Clears the entire database (useful for testing or reset functionality).
   */
  clearAll(): Promise<void>;
}

export class AsyncStorageTransactionRepository implements ITransactionRepository {
  
  async getAll(): Promise<Transaction[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error fetching transactions from AsyncStorage:', error);
      return [];
    }
  }

  async save(transactionData: Omit<Transaction, 'id' | 'date'> & { id?: string; date?: string }): Promise<Transaction> {
    try {
      const transactions = await this.getAll();
      
      const newTransaction: Transaction = {
        ...transactionData,
        id: transactionData.id || this.generateUUID(),
        date: transactionData.date || new Date().toISOString().split('T')[0],
      };

      const existingIndex = transactions.findIndex(t => t.id === newTransaction.id);
      
      if (existingIndex > -1) {
        // Update existing record
        transactions[existingIndex] = newTransaction;
      } else {
        // Insert new record
        transactions.push(newTransaction);
      }
      
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
      return newTransaction;
    } catch (error) {
      console.error('Error saving transaction to AsyncStorage:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const transactions = await this.getAll();
      const updatedList = transactions.filter(t => t.id !== id);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    } catch (error) {
      console.error('Error deleting transaction from AsyncStorage:', error);
      throw error;
    }
  }

  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing AsyncStorage:', error);
      throw error;
    }
  }

  /**
   * Simple, self-contained UUID v4 generator for React Native environments.
   * Avoids requiring extra native dependencies during early developer setup.
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
