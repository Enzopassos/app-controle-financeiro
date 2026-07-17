import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
  StatusBar,
  ScrollView,
  Image,
} from 'react-native';
import * as Sharing from 'expo-sharing';
import { theme } from './src/theme/colors';
import { Transaction } from './src/types/transaction';
import { AsyncStorageTransactionRepository } from './src/database/repository';
import { calculateFinancialProjection, MonthlyProjection } from './src/services/projection';
import TransactionForm from './src/components/TransactionForm';

const repository = new AsyncStorageTransactionRepository();

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [projections, setProjections] = useState<MonthlyProjection[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'transactions' | 'projection'>('transactions');
  
  // New States
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedProjectionYear, setSelectedProjectionYear] = useState<number>(new Date().getFullYear());
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [previewImageUri, setPreviewImageUri] = useState<string | null>(null);

  const PORTUGUESE_MONTHS = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // Load transactions from database
  const loadData = async () => {
    try {
      const allTx = await repository.getAll();
      // Sort by date descending
      const sortedTx = [...allTx].sort((a, b) => b.date.localeCompare(a.date));
      setTransactions(sortedTx);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar as transações.');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update projections when transactions or projection year changes
  useEffect(() => {
    const proj = calculateFinancialProjection(transactions, new Date(), selectedProjectionYear);
    setProjections(proj);
  }, [transactions, selectedProjectionYear]);

  const handleSaveTransaction = async (formData: any) => {
    try {
      await repository.save(formData);
      await loadData();
      setIsModalOpen(false);
      setEditingTransaction(null);
      Alert.alert('Sucesso', editingTransaction ? 'Transação atualizada com sucesso!' : 'Transação adicionada com sucesso!');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar a transação.');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTransaction(null);
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsModalOpen(true);
  };

  const handleDeleteTransaction = async (id: string) => {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza de que deseja excluir esta transação?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await repository.delete(id);
              await loadData();
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível excluir a transação.');
            }
          },
        },
      ]
    );
  };

  // Month navigation helpers
  const handlePrevMonth = () => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  const isCurrentMonth = (date: Date) => {
    const today = new Date();
    return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth();
  };

  const handleResetToCurrentMonth = () => {
    setSelectedDate(new Date());
  };

  // Projection year list (current, current+1, current+2)
  const currentYear = new Date().getFullYear();
  const projectionYears = [currentYear, currentYear + 1, currentYear + 2];

  // Calculate cumulative total savings up to a specific date
  const calculateCumulativeSavings = (upToDate: Date) => {
    let totalSavings = 0;
    const limitYear = upToDate.getFullYear();
    const limitMonth = upToDate.getMonth();
    const limitOffset = limitYear * 12 + limitMonth;

    transactions.forEach((tx) => {
      const parts = tx.date.split('-');
      if (parts.length < 2) return;
      const txYear = parseInt(parts[0], 10);
      const txMonth = parseInt(parts[1], 10) - 1;
      const txOffset = txYear * 12 + txMonth;

      if (txOffset > limitOffset) return;

      let occurrences = 0;
      if (tx.recurrenceType === 'single') {
        occurrences = txOffset <= limitOffset ? 1 : 0;
      } else if (tx.recurrenceType === 'fixed') {
        occurrences = Math.max(0, limitOffset - txOffset + 1);
      } else if (tx.recurrenceType === 'installment') {
        const count = tx.installmentsCount || 1;
        const endOffset = txOffset + count - 1;
        const activeEnd = Math.min(limitOffset, endOffset);
        occurrences = Math.max(0, activeEnd - txOffset + 1);
      }

      if (tx.type === 'saving') {
        totalSavings += tx.amount * occurrences;
      } else if (tx.type === 'withdraw') {
        totalSavings -= tx.amount * occurrences;
      }
    });

    return totalSavings;
  };

  // Calculate selected month financial summary
  const selectedMonthSummary = () => {
    let income = 0;
    let expense = 0;
    let monthlySavings = 0;
    let monthlyWithdraws = 0;
    const targetYear = selectedDate.getFullYear();
    const targetMonth = selectedDate.getMonth();
    const targetOffset = targetYear * 12 + targetMonth;

    transactions.forEach((tx) => {
      const parts = tx.date.split('-');
      if (parts.length < 2) return;
      const txYear = parseInt(parts[0], 10);
      const txMonth = parseInt(parts[1], 10) - 1;
      const txOffset = txYear * 12 + txMonth;

      let isActive = false;

      if (tx.recurrenceType === 'single') {
        isActive = txOffset === targetOffset;
      } else if (tx.recurrenceType === 'fixed') {
        isActive = targetOffset >= txOffset;
      } else if (tx.recurrenceType === 'installment') {
        const count = tx.installmentsCount || 1;
        isActive = targetOffset >= txOffset && targetOffset < txOffset + count;
      }

      if (isActive) {
        if (tx.type === 'income') {
          income += tx.amount;
        } else if (tx.type === 'expense') {
          expense += tx.amount;
        } else if (tx.type === 'saving') {
          monthlySavings += tx.amount;
        } else if (tx.type === 'withdraw') {
          monthlyWithdraws += tx.amount;
        }
      }
    });

    return {
      income,
      expense,
      balance: income + monthlyWithdraws - expense - monthlySavings,
    };
  };

  const { income, expense, balance } = selectedMonthSummary();
  const savingsBalance = calculateCumulativeSavings(selectedDate);

  // Get active transactions for selected month
  const getFilteredTransactions = () => {
    const targetYear = selectedDate.getFullYear();
    const targetMonth = selectedDate.getMonth();
    const targetOffset = targetYear * 12 + targetMonth;

    return transactions.filter(tx => {
      const parts = tx.date.split('-');
      if (parts.length < 2) return false;
      const txYear = parseInt(parts[0], 10);
      const txMonth = parseInt(parts[1], 10) - 1;
      const txOffset = txYear * 12 + txMonth;

      if (tx.recurrenceType === 'single') {
        return txOffset === targetOffset;
      } else if (tx.recurrenceType === 'fixed') {
        return targetOffset >= txOffset;
      } else if (tx.recurrenceType === 'installment') {
        const count = tx.installmentsCount || 1;
        return targetOffset >= txOffset && targetOffset < txOffset + count;
      }
      return false;
    });
  };

  const filteredTransactions = getFilteredTransactions();

  // Calculate installment text (e.g. Parcela 1/3)
  const getInstallmentText = (tx: Transaction) => {
    if (tx.recurrenceType !== 'installment') return '';
    
    const parts = tx.date.split('-');
    if (parts.length < 2) return '';
    const txYear = parseInt(parts[0], 10);
    const txMonth = parseInt(parts[1], 10) - 1;
    const txOffset = txYear * 12 + txMonth;

    const targetYear = selectedDate.getFullYear();
    const targetMonth = selectedDate.getMonth();
    const targetOffset = targetYear * 12 + targetMonth;

    const currentInstallment = (targetOffset - txOffset) + 1;
    const totalInstallments = tx.installmentsCount || 1;

    return `Parcela ${currentInstallment}/${totalInstallments}`;
  };

  const toggleExpandMonth = (month: string) => {
    setExpandedMonths(prev => ({
      ...prev,
      [month]: !prev[month]
    }));
  };

  const handleViewAttachment = async (uri: string) => {
    const isImage = /\.(jpg|jpeg|png|gif|webp|heic|bmp)(\?.*)?$/i.test(uri);
    if (isImage) {
      setPreviewImageUri(uri);
    } else {
      try {
        const available = await Sharing.isAvailableAsync();
        if (available) {
          await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Abrir Anexo' });
        } else {
          Alert.alert('Erro', 'O seu dispositivo não suporta compartilhamento ou abertura de arquivos.');
        }
      } catch (error) {
        Alert.alert('Erro', 'Não foi possível abrir o documento.');
      }
    }
  };

  const renderTransactionItem = ({ item }: { item: Transaction }) => {
    const installmentText = getInstallmentText(item);
    const sign = (item.type === 'income' || item.type === 'withdraw') ? '+' : '-';
    
    let amountStyle = styles.amountExpense;
    if (item.type === 'income') {
      amountStyle = styles.amountIncome;
    } else if (item.type === 'saving' || item.type === 'withdraw') {
      amountStyle = styles.amountSavings;
    }

    const typeLabel = item.type === 'income'
      ? 'Receita'
      : item.type === 'expense'
      ? 'Despesa'
      : item.type === 'saving'
      ? 'Guardado'
      : 'Resgatado';

    return (
      <View style={styles.transactionCard}>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionName}>{item.name}</Text>
          <Text style={styles.transactionMeta}>
            {typeLabel} • {item.category} • {item.recurrenceType === 'single' ? 'Única' : item.recurrenceType === 'fixed' ? 'Fixa' : installmentText}
          </Text>
          <Text style={styles.transactionDate}>Início: {item.date}</Text>
          {item.attachmentUri && (
            <TouchableOpacity
              onPress={() => handleViewAttachment(item.attachmentUri!)}
              style={styles.attachmentBadge}
              activeOpacity={0.7}
            >
              <Text style={styles.attachmentBadgeIcon}>📎</Text>
              <Text style={styles.attachmentBadgeText}>Ver anexo</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.transactionAction}>
          <Text style={[styles.transactionAmount, amountStyle]}>
            {sign} R$ {item.amount.toFixed(2)}
          </Text>
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity onPress={() => handleEditTransaction(item)} style={styles.editButton}>
              <Text style={styles.editButtonText}>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDeleteTransaction(item.id)} style={styles.deleteButton}>
              <Text style={styles.deleteButtonText}>Excluir</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const monthLabel = `${PORTUGUESE_MONTHS[selectedDate.getMonth()]} de ${selectedDate.getFullYear()}`;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>App Financeiro</Text>
        <Text style={styles.headerSubtitle}>Controle & Projeção Simplificada</Text>
      </View>

      {/* Month Selector (Only shown on Transactions tab) */}
      {selectedTab === 'transactions' && (
        <View style={styles.monthSelectorCard}>
          <TouchableOpacity onPress={handlePrevMonth} style={styles.selectorButton}>
            <Text style={styles.selectorButtonText}>◀</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => setIsMonthPickerOpen(true)}
            style={styles.selectedMonthContainer}
            activeOpacity={0.7}
          >
            <Text style={styles.selectedMonthText}>{monthLabel} 📅</Text>
            {!isCurrentMonth(selectedDate) && (
              <TouchableOpacity onPress={handleResetToCurrentMonth} style={styles.todayButton}>
                <Text style={styles.todayButtonText}>Mês Atual</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={handleNextMonth} style={styles.selectorButton}>
            <Text style={styles.selectorButtonText}>▶</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Summary Card (Only shown on Transactions tab) */}
      {selectedTab === 'transactions' && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Saldo de {PORTUGUESE_MONTHS[selectedDate.getMonth()]}</Text>
          <Text style={[styles.summaryBalance, balance >= 0 ? styles.balancePositive : styles.balanceNegative]}>
            R$ {balance.toFixed(2)}
          </Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>Receitas</Text>
              <Text style={styles.summaryValueIncome}>R$ {income.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>Despesas</Text>
              <Text style={styles.summaryValueExpense}>R$ {expense.toFixed(2)}</Text>
            </View>
          </View>
          <View style={styles.summaryRow}>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>Dinheiro Guardado (Total)</Text>
              <Text style={styles.summaryValueSavings}>R$ {savingsBalance.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Navigation Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, selectedTab === 'transactions' && styles.tabButtonActive]}
          onPress={() => setSelectedTab('transactions')}
        >
          <Text style={[styles.tabText, selectedTab === 'transactions' && styles.tabTextActive]}>
            Transações
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, selectedTab === 'projection' && styles.tabButtonActive]}
          onPress={() => setSelectedTab('projection')}
        >
          <Text style={[styles.tabText, selectedTab === 'projection' && styles.tabTextActive]}>
            Projeção Anual
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Contents */}
      {selectedTab === 'transactions' ? (
        <View style={styles.listContainer}>
          {filteredTransactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Nenhuma transação ativa neste mês.</Text>
            </View>
          ) : (
            <FlatList
              data={filteredTransactions}
              keyExtractor={(item) => item.id}
              renderItem={renderTransactionItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      ) : (
        <ScrollView style={styles.listContainer} contentContainerStyle={styles.listContent}>
          <View style={styles.projectionTitleRow}>
            <Text style={styles.sectionTitle}>Projeção de Renda</Text>
            
            {/* Year Selector for Projections */}
            <View style={styles.yearSelectorContainer}>
              {projectionYears.map(year => (
                <TouchableOpacity
                  key={year}
                  style={[
                    styles.yearChip,
                    selectedProjectionYear === year && styles.yearChipActive
                  ]}
                  onPress={() => setSelectedProjectionYear(year)}
                >
                  <Text
                    style={[
                      styles.yearChipText,
                      selectedProjectionYear === year && styles.yearChipTextActive
                    ]}
                  >
                    {year}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {projections.map((proj) => (
            <TouchableOpacity
              key={proj.month}
              style={styles.projectionCard}
              activeOpacity={0.8}
              onPress={() => toggleExpandMonth(proj.month)}
            >
              <View style={styles.projectionHeader}>
                <Text style={styles.projectionMonthName}>{proj.monthName}</Text>
                <View style={styles.projectionHeaderRight}>
                  <Text style={styles.projectionMonth}>{proj.month}</Text>
                  <Text style={styles.expandIcon}>
                    {expandedMonths[proj.month] ? '▲' : '▼'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.projectionRow}>
                <Text style={styles.projectionLabel}>Renda Prevista:</Text>
                <Text style={styles.projectionValueIncome}>+R$ {proj.estimatedIncomes.toFixed(2)}</Text>
              </View>
              <View style={styles.projectionRow}>
                <Text style={styles.projectionLabel}>Despesas Previstas:</Text>
                <Text style={styles.projectionValueExpense}>-R$ {proj.estimatedExpenses.toFixed(2)}</Text>
              </View>
              <View style={styles.projectionDivider} />
              <View style={styles.projectionRow}>
                <Text style={styles.projectionLabelBold}>Saldo do Mês:</Text>
                <Text style={[styles.projectionValueBold, proj.monthlyBalance >= 0 ? styles.balancePositive : styles.balanceNegative]}>
                  R$ {proj.monthlyBalance.toFixed(2)}
                </Text>
              </View>

              {expandedMonths[proj.month] && (
                <View style={styles.detailsContainer}>
                  <View style={styles.detailsDivider} />
                  <Text style={styles.detailsTitle}>Detalhamento dos Valores:</Text>
                  {proj.details.length === 0 ? (
                    <Text style={styles.emptyDetailsText}>Nenhuma receita ou despesa prevista para este mês.</Text>
                  ) : (
                    proj.details.map((detail, idx) => {
                      const sign = (detail.transaction.type === 'income' || detail.transaction.type === 'withdraw') ? '+' : '-';
                      
                      let amountStyle = styles.amountExpense;
                      if (detail.transaction.type === 'income') {
                        amountStyle = styles.amountIncome;
                      } else if (detail.transaction.type === 'saving' || detail.transaction.type === 'withdraw') {
                        amountStyle = styles.amountSavings;
                      }

                      const typeLabel = detail.transaction.type === 'income'
                        ? 'Receita'
                        : detail.transaction.type === 'expense'
                        ? 'Despesa'
                        : detail.transaction.type === 'saving'
                        ? 'Guardado'
                        : 'Resgatado';

                      const recurrenceText = detail.transaction.recurrenceType === 'fixed'
                        ? 'Fixa'
                        : detail.transaction.recurrenceType === 'single'
                        ? 'Única'
                        : `Parcela ${detail.currentInstallmentNumber}/${detail.transaction.installmentsCount}`;
                      
                      return (
                        <View key={`${detail.transaction.id}-${idx}`} style={styles.detailItem}>
                          <View style={styles.detailTextContainer}>
                            <Text style={styles.detailName}>{detail.transaction.name}</Text>
                            <Text style={styles.detailMeta}>{typeLabel} • {detail.transaction.category} • {recurrenceText}</Text>
                          </View>
                          <Text style={[styles.detailAmount, amountStyle]}>
                            {sign} R$ {detail.transaction.amount.toFixed(2)}
                          </Text>
                        </View>
                      );
                    })
                  )}
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => setIsModalOpen(true)}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Form Modal */}
      <Modal
        visible={isModalOpen}
        animationType="slide"
        transparent={false}
        onRequestClose={handleCloseModal}
      >
        <SafeAreaView style={styles.modalContainer}>
          <TransactionForm
            key={editingTransaction ? editingTransaction.id : 'new'}
            onSubmit={handleSaveTransaction}
            onCancel={handleCloseModal}
            initialData={editingTransaction || undefined}
          />
        </SafeAreaView>
      </Modal>

      {/* Custom Month Picker Modal */}
      <Modal
        visible={isMonthPickerOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsMonthPickerOpen(false)}
      >
        <View style={styles.pickerModalOverlay}>
          <View style={styles.pickerModalContent}>
            {/* Modal Header */}
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Selecionar Mês/Ano</Text>
              <TouchableOpacity onPress={() => setIsMonthPickerOpen(false)} style={styles.pickerCloseButton}>
                <Text style={styles.pickerCloseButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Year Navigator inside Picker */}
            <View style={styles.pickerYearSelector}>
              <TouchableOpacity
                onPress={() => {
                  setSelectedDate(prev => {
                    const newDate = new Date(prev);
                    newDate.setFullYear(newDate.getFullYear() - 1);
                    return newDate;
                  });
                }}
                style={styles.pickerYearButton}
              >
                <Text style={styles.pickerYearButtonText}>◀</Text>
              </TouchableOpacity>
              
              <Text style={styles.pickerYearText}>{selectedDate.getFullYear()}</Text>

              <TouchableOpacity
                onPress={() => {
                  setSelectedDate(prev => {
                    const newDate = new Date(prev);
                    newDate.setFullYear(newDate.getFullYear() + 1);
                    return newDate;
                  });
                }}
                style={styles.pickerYearButton}
              >
                <Text style={styles.pickerYearButtonText}>▶</Text>
              </TouchableOpacity>
            </View>

            {/* Month Grid */}
            <View style={styles.pickerMonthGrid}>
              {PORTUGUESE_MONTHS.map((monthName, index) => {
                const isSelected = selectedDate.getMonth() === index;
                return (
                  <TouchableOpacity
                    key={monthName}
                    style={[
                      styles.pickerMonthCell,
                      isSelected && styles.pickerMonthCellActive
                    ]}
                    onPress={() => {
                      setSelectedDate(prev => {
                        const newDate = new Date(prev);
                        newDate.setMonth(index);
                        return newDate;
                      });
                      setIsMonthPickerOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.pickerMonthText,
                        isSelected && styles.pickerMonthTextActive
                      ]}
                    >
                      {monthName.substring(0, 3)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>

      {/* Fullscreen Attachment Viewer Modal */}
      <Modal
        visible={previewImageUri !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPreviewImageUri(null)}
      >
        <View style={styles.imageViewerOverlay}>
          <TouchableOpacity
            style={styles.imageViewerClose}
            onPress={() => setPreviewImageUri(null)}
            activeOpacity={0.7}
          >
            <Text style={styles.imageViewerCloseText}>✕ Fechar</Text>
          </TouchableOpacity>
          {previewImageUri && (() => {
            const isImage = /\.(jpg|jpeg|png|gif|webp|heic|bmp)(\?.*)?$/i.test(previewImageUri);
            if (isImage) {
              return (
                <Image
                  source={{ uri: previewImageUri }}
                  style={styles.imageViewerImage}
                  resizeMode="contain"
                />
              );
            }
            const fileName = decodeURIComponent(previewImageUri.split('/').pop() || 'documento');
            return (
              <View style={styles.pdfViewerCard}>
                <Text style={styles.pdfViewerIcon}>📄</Text>
                <Text style={styles.pdfViewerTitle}>Documento PDF</Text>
                <Text style={styles.pdfViewerName} numberOfLines={3}>{fileName}</Text>
                <TouchableOpacity
                  style={styles.pdfOpenButton}
                  activeOpacity={0.8}
                  onPress={async () => {
                    try {
                      await Sharing.shareAsync(previewImageUri, { mimeType: 'application/pdf', dialogTitle: 'Abrir Anexo' });
                    } catch (err) {
                      Alert.alert('Erro', 'Não foi possível abrir o documento.');
                    }
                  }}
                >
                  <Text style={styles.pdfOpenButtonText}>Abrir com App Externo</Text>
                </TouchableOpacity>
              </View>
            );
          })()}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  monthSelectorCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.light,
  },
  selectorButton: {
    padding: theme.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.primaryLight,
  },
  selectorButtonText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.bold,
  },
  selectedMonthContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedMonthText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
  todayButton: {
    marginTop: 2,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.borderRadius.sm,
  },
  todayButtonText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.semibold,
  },
  summaryCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.medium,
  },
  summaryTitle: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  summaryBalance: {
    fontSize: theme.typography.sizes.xxxl,
    fontWeight: theme.typography.weights.bold,
    textAlign: 'center',
    marginVertical: theme.spacing.sm,
  },
  balancePositive: {
    color: theme.colors.income,
  },
  balanceNegative: {
    color: theme.colors.expense,
  },
  summaryRow: {
    flexDirection: 'row',
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  summaryCol: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: theme.colors.border,
    height: '100%',
  },
  summaryLabel: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  summaryValueIncome: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.income,
  },
  summaryValueExpense: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.expense,
  },
  summaryValueSavings: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.savings,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: 3,
  },
  tabButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    borderRadius: theme.borderRadius.sm,
  },
  tabButtonActive: {
    backgroundColor: theme.colors.surface,
  },
  tabText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.textSecondary,
  },
  tabTextActive: {
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.weights.bold,
  },
  listContainer: {
    flex: 1,
    marginTop: theme.spacing.md,
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 80, // space for FAB
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  emptyStateText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.md,
  },
  transactionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...theme.shadows.light,
  },
  transactionInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  transactionName: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
  },
  transactionMeta: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  transactionDate: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textLight,
    marginTop: 2,
  },
  transactionAction: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    marginBottom: 4,
  },
  amountIncome: {
    color: theme.colors.income,
  },
  amountExpense: {
    color: theme.colors.expense,
  },
  amountSavings: {
    color: theme.colors.savings,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  editButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.primaryLight,
  },
  editButtonText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.semibold,
  },
  deleteButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.expenseBackground,
  },
  deleteButtonText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.expense,
    fontWeight: theme.typography.weights.semibold,
  },
  projectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
  yearSelectorContainer: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.border,
    padding: 2,
    borderRadius: theme.borderRadius.sm,
  },
  yearChip: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm - 2,
  },
  yearChipActive: {
    backgroundColor: theme.colors.surface,
  },
  yearChipText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.weights.semibold,
  },
  yearChipTextActive: {
    color: theme.colors.textPrimary,
  },
  projectionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.light,
  },
  projectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  projectionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  projectionMonthName: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
  projectionMonth: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textLight,
  },
  expandIcon: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
  },
  projectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  projectionLabel: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
  },
  projectionLabelBold: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
  projectionValueIncome: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.income,
  },
  projectionValueExpense: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.expense,
  },
  projectionValueBold: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
  },
  projectionDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.sm,
  },
  detailsContainer: {
    marginTop: theme.spacing.md,
  },
  detailsDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
  },
  detailsTitle: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  emptyDetailsText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textLight,
    fontStyle: 'italic',
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailTextContainer: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  detailName: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
  },
  detailMeta: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  detailAmount: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
  },
  fab: {
    position: 'absolute',
    right: theme.spacing.lg,
    bottom: theme.spacing.lg,
    backgroundColor: theme.colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.medium,
  },
  fabText: {
    color: theme.colors.surface,
    fontSize: 32,
    lineHeight: 34,
    fontWeight: '300',
  },
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerModalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    width: '85%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.medium,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  pickerTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
  pickerCloseButton: {
    padding: theme.spacing.xs,
  },
  pickerCloseButtonText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.weights.bold,
  },
  pickerYearSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  pickerYearButton: {
    padding: theme.spacing.xs,
  },
  pickerYearButtonText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.bold,
  },
  pickerYearText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
  pickerMonthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    justifyContent: 'space-between',
  },
  pickerMonthCell: {
    width: '30%',
    aspectRatio: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.xs,
  },
  pickerMonthCellActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  pickerMonthText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textSecondary,
  },
  pickerMonthTextActive: {
    color: theme.colors.surface,
  },
  // Attachment badge in transaction list
  attachmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  attachmentBadgeIcon: {
    fontSize: 11,
  },
  attachmentBadgeText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.semibold,
  },
  // Fullscreen Image Viewer
  imageViewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    zIndex: 10,
  },
  imageViewerCloseText: {
    color: '#FFFFFF',
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
  },
  imageViewerImage: {
    width: '95%',
    height: '80%',
    borderRadius: theme.borderRadius.md,
  },
  // PDF viewer card (shown when attachment is not an image)
  pdfViewerCard: {
    width: '80%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  pdfViewerIcon: {
    fontSize: 56,
  },
  pdfViewerTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
  pdfViewerName: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  pdfViewerHint: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textLight,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: theme.spacing.sm,
  },
  pdfOpenButton: {
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.md,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfOpenButtonText: {
    color: theme.colors.surface,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
  },
});
