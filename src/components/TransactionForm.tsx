import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { theme } from '../theme/colors';
import { TransactionType, RecurrenceType, CategoryType, Transaction } from '../types/transaction';

interface TransactionFormProps {
  onSubmit: (data: {
    name: string;
    amount: number;
    type: TransactionType;
    category: CategoryType;
    recurrenceType: RecurrenceType;
    installmentsCount?: number;
    id?: string;
    date?: string;
    attachmentUri?: string;
  }) => void;
  onCancel?: () => void;
  initialData?: Transaction;
}

const CATEGORIES = ['Mercado', 'Eletrônicos', 'Lazer', 'Salário', 'Outros'];

export default function TransactionForm({ onSubmit, onCancel, initialData }: TransactionFormProps) {
  const [name, setName] = useState(initialData ? initialData.name : '');
  const [amount, setAmount] = useState(initialData ? initialData.amount.toString() : '');
  const [type, setType] = useState<TransactionType>(initialData ? initialData.type : 'expense');
  const [category, setCategory] = useState<CategoryType>(initialData ? initialData.category : 'Outros');
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>(initialData ? initialData.recurrenceType : 'single');
  const [installmentsCount, setInstallmentsCount] = useState(
    initialData?.installmentsCount ? initialData.installmentsCount.toString() : '2'
  );
  const [attachmentUri, setAttachmentUri] = useState<string | undefined>(initialData?.attachmentUri);

  const [errors, setErrors] = useState<{ name?: string; amount?: string; installmentsCount?: string }>({});
  const [isAttachmentModalOpen, setIsAttachmentModalOpen] = useState(false);
  const [startMonthOption, setStartMonthOption] = useState<'current' | 'next'>('current');

  // helper: does current attachment look like an image?
  const isImageAttachment = attachmentUri
    ? /\.(jpg|jpeg|png|gif|webp|heic|bmp)(\?.*)?$/i.test(attachmentUri)
    : false;

  // Friendly filename for display (PDF or other docs)
  const attachmentFileName = attachmentUri
    ? decodeURIComponent(attachmentUri.split('/').pop() || 'arquivo')
    : '';

  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permissão necessária', 'Precisamos de permissão para acessar suas fotos.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAttachmentUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível selecionar a imagem.');
    }
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAttachmentUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível selecionar o documento.');
    }
  };

  const handleRemoveAttachment = () => {
    setAttachmentUri(undefined);
  };

  const validate = () => {
    const newErrors: typeof errors = {};

    if (!name.trim()) {
      newErrors.name = 'O nome da transação é obrigatório.';
    }

    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      newErrors.amount = 'Insira um valor válido maior que zero.';
    }

    if (recurrenceType === 'installment') {
      const parsedInstallments = parseInt(installmentsCount, 10);
      if (!installmentsCount || isNaN(parsedInstallments) || parsedInstallments < 2) {
        newErrors.installmentsCount = 'Mínimo de 2 parcelas.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    const parsedAmount = parseFloat(amount.replace(',', '.'));
    
    let finalDate = initialData?.date;
    if (!finalDate) {
      const baseDate = new Date();
      if (recurrenceType === 'installment' && startMonthOption === 'next') {
        baseDate.setMonth(baseDate.getMonth() + 1);
      }
      finalDate = baseDate.toISOString().split('T')[0];
    }

    const submitData = {
      name: name.trim(),
      amount: parsedAmount,
      type,
      category,
      recurrenceType,
      installmentsCount: recurrenceType === 'installment' ? parseInt(installmentsCount, 10) : undefined,
      id: initialData?.id,
      date: finalDate,
      attachmentUri,
    };

    onSubmit(submitData);
    
    // Clear Form on success
    setName('');
    setAmount('');
    setType('expense');
    setCategory('Outros');
    setRecurrenceType('single');
    setInstallmentsCount('2');
    setStartMonthOption('current');
    setAttachmentUri(undefined);
    setErrors({});
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardContainer}
    >
      <View style={styles.formContainer}>
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formCard}>
          <Text style={styles.formTitle}>
            {initialData ? 'Editar Transação' : 'Nova Transação'}
          </Text>

          {/* Nome da Transação */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descrição</Text>
            <TextInput
              style={[styles.input, errors.name ? styles.inputError : null]}
              placeholder="Ex: Energético Monster, Notebook, Salário"
              placeholderTextColor={theme.colors.placeholder}
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (errors.name) setErrors(prev => ({ ...prev, name: undefined }));
              }}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          {/* Valor */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Valor (R$)</Text>
            <View style={styles.amountInputWrapper}>
              <Text style={styles.currencyPrefix}>R$</Text>
              <TextInput
                style={[styles.amountInput, errors.amount ? styles.inputError : null]}
                placeholder="0,00"
                placeholderTextColor={theme.colors.placeholder}
                keyboardType="numeric"
                value={amount}
                onChangeText={(text) => {
                  setAmount(text);
                  if (errors.amount) setErrors(prev => ({ ...prev, amount: undefined }));
                }}
              />
            </View>
            {errors.amount && <Text style={styles.errorText}>{errors.amount}</Text>}
          </View>

          {/* Tipo (Receita / Despesa / Guardar / Resgatar) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tipo de Transação</Text>
            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[
                  styles.typeGridButton,
                  type === 'income' && styles.typeButtonIncomeActive,
                ]}
                activeOpacity={0.8}
                onPress={() => setType('income')}
              >
                <Text style={[styles.typeButtonText, type === 'income' && styles.typeButtonTextActive]}>
                  📥 Receita
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeGridButton,
                  type === 'expense' && styles.typeButtonExpenseActive,
                ]}
                activeOpacity={0.8}
                onPress={() => setType('expense')}
              >
                <Text style={[styles.typeButtonText, type === 'expense' && styles.typeButtonTextActive]}>
                  📤 Despesa
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[
                  styles.typeGridButton,
                  type === 'saving' && styles.typeButtonSavingActive,
                ]}
                activeOpacity={0.8}
                onPress={() => setType('saving')}
              >
                <Text style={[styles.typeButtonText, type === 'saving' && styles.typeButtonTextActive]}>
                  💰 Guardar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeGridButton,
                  type === 'withdraw' && styles.typeButtonWithdrawActive,
                ]}
                activeOpacity={0.8}
                onPress={() => setType('withdraw')}
              >
                <Text style={[styles.typeButtonText, type === 'withdraw' && styles.typeButtonTextActive]}>
                  🔄 Resgatar
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Categoria */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Categoria</Text>
            <View style={styles.chipsContainer}>
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.chip,
                      isSelected && styles.chipActive,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => setCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        isSelected && styles.chipTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Tipo de Recorrência */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Recorrência</Text>
            <View style={styles.segmentedControl}>
              <TouchableOpacity
                style={[
                  styles.segmentButton,
                  recurrenceType === 'single' && styles.segmentButtonActive,
                ]}
                activeOpacity={0.8}
                onPress={() => setRecurrenceType('single')}
              >
                <Text
                  style={[
                    styles.segmentText,
                    recurrenceType === 'single' && styles.segmentTextActive,
                  ]}
                >
                  Única
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.segmentButton,
                  recurrenceType === 'fixed' && styles.segmentButtonActive,
                ]}
                activeOpacity={0.8}
                onPress={() => setRecurrenceType('fixed')}
              >
                <Text
                  style={[
                    styles.segmentText,
                    recurrenceType === 'fixed' && styles.segmentTextActive,
                  ]}
                >
                  Fixa
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.segmentButton,
                  recurrenceType === 'installment' && styles.segmentButtonActive,
                ]}
                activeOpacity={0.8}
                onPress={() => setRecurrenceType('installment')}
              >
                <Text
                  style={[
                    styles.segmentText,
                    recurrenceType === 'installment' && styles.segmentTextActive,
                  ]}
                >
                  Parcelada
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Quantidade de Parcelas (Exibido Condicionalmente) */}
          {recurrenceType === 'installment' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Quantidade de Parcelas</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.parcelInput,
                  errors.installmentsCount ? styles.inputError : null
                ]}
                keyboardType="number-pad"
                value={installmentsCount}
                onChangeText={(text) => {
                  setInstallmentsCount(text);
                  if (errors.installmentsCount) {
                    setErrors(prev => ({ ...prev, installmentsCount: undefined }));
                  }
                }}
                placeholder="Mínimo 2"
                placeholderTextColor={theme.colors.placeholder}
              />
              {errors.installmentsCount && (
                <Text style={styles.errorText}>{errors.installmentsCount}</Text>
              )}
            </View>
          )}

          {/* Mês de Início das Parcelas (Exibido Condicionalmente) */}
          {recurrenceType === 'installment' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mês de Início das Parcelas</Text>
              <View style={styles.segmentedControl}>
                <TouchableOpacity
                  style={[
                    styles.segmentButton,
                    startMonthOption === 'current' && styles.segmentButtonActive,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setStartMonthOption('current')}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      startMonthOption === 'current' && styles.segmentTextActive,
                    ]}
                  >
                    Mês Atual
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.segmentButton,
                    startMonthOption === 'next' && styles.segmentButtonActive,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setStartMonthOption('next')}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      startMonthOption === 'next' && styles.segmentTextActive,
                    ]}
                  >
                    Próximo Mês
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Anexo / Comprovante */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Anexo (opcional)</Text>
            {attachmentUri ? (
              <View style={styles.attachmentPreviewContainer}>
                {isImageAttachment ? (
                  <Image
                    source={{ uri: attachmentUri }}
                    style={styles.attachmentThumbnail}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.attachmentDocRow}>
                    <Text style={styles.attachmentDocIcon}>📄</Text>
                    <Text style={styles.attachmentDocName} numberOfLines={1}>
                      {attachmentFileName}
                    </Text>
                  </View>
                )}
                <View style={styles.attachmentActions}>
                  <TouchableOpacity
                    onPress={() => setIsAttachmentModalOpen(true)}
                    style={styles.attachmentChangeButton}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.attachmentChangeText}>Trocar arquivo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleRemoveAttachment}
                    style={styles.attachmentRemoveButton}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.attachmentRemoveText}>✕ Remover</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => setIsAttachmentModalOpen(true)}
                style={styles.attachmentPickerButton}
                activeOpacity={0.7}
              >
                <Text style={styles.attachmentPickerIcon}>📎</Text>
                <Text style={styles.attachmentPickerText}>Adicionar Anexo</Text>
                <Text style={styles.attachmentPickerHint}>Foto ou PDF</Text>
              </TouchableOpacity>
            )}
          </View>

          </View>
        </ScrollView>

        {/* Botões de Ação Fixos */}
        <View style={styles.fixedFooter}>
          {onCancel && (
            <TouchableOpacity
              style={styles.cancelButton}
              activeOpacity={0.7}
              onPress={onCancel}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.saveButton}
            activeOpacity={0.8}
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>
              {initialData ? 'Salvar Alterações' : 'Salvar Transação'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal Personalizado de Seleção de Anexo */}
      <Modal
        visible={isAttachmentModalOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsAttachmentModalOpen(false)}
      >
        <TouchableOpacity
          style={styles.attachmentModalOverlay}
          activeOpacity={1}
          onPress={() => setIsAttachmentModalOpen(false)}
        >
          <View style={styles.attachmentModalContent}>
            <View style={styles.attachmentModalHeader}>
              <View style={styles.attachmentModalIndicator} />
              <Text style={styles.attachmentModalTitle}>Adicionar Anexo</Text>
              <Text style={styles.attachmentModalSubtitle}>Selecione o tipo de arquivo para anexar</Text>
            </View>

            <View style={styles.attachmentModalOptions}>
              <TouchableOpacity
                style={styles.attachmentModalOptionButton}
                activeOpacity={0.7}
                onPress={() => {
                  setIsAttachmentModalOpen(false);
                  handlePickImage();
                }}
              >
                <View style={styles.attachmentOptionIconContainer}>
                  <Text style={styles.attachmentOptionIcon}>🖼️</Text>
                </View>
                <View style={styles.attachmentOptionTextContainer}>
                  <Text style={styles.attachmentOptionTitle}>Foto da Galeria</Text>
                  <Text style={styles.attachmentOptionDescription}>Selecionar uma imagem da galeria</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.attachmentModalOptionButton}
                activeOpacity={0.7}
                onPress={() => {
                  setIsAttachmentModalOpen(false);
                  handlePickDocument();
                }}
              >
                <View style={styles.attachmentOptionIconContainer}>
                  <Text style={styles.attachmentOptionIcon}>📄</Text>
                </View>
                <View style={styles.attachmentOptionTextContainer}>
                  <Text style={styles.attachmentOptionTitle}>Documento / PDF</Text>
                  <Text style={styles.attachmentOptionDescription}>Selecionar arquivo PDF do aparelho</Text>
                </View>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.attachmentModalCancelButton}
              activeOpacity={0.7}
              onPress={() => setIsAttachmentModalOpen(false)}
            >
              <Text style={styles.attachmentModalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingVertical: theme.spacing.md,
  },
  formCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.medium,
  },
  formTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
  },
  inputGroup: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textPrimary,
  },
  parcelInput: {
    width: 120,
    textAlign: 'center',
  },
  amountInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
  },
  currencyPrefix: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textSecondary,
    marginRight: theme.spacing.sm,
  },
  amountInput: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textPrimary,
  },
  inputError: {
    borderColor: theme.colors.expense,
  },
  errorText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.expense,
    marginTop: theme.spacing.xs,
  },
  // Controles Segmentados (Tipo e Recorrência)
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    borderRadius: theme.borderRadius.sm,
  },
  segmentButtonActive: {
    backgroundColor: theme.colors.surface,
    ...theme.shadows.light,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  segmentButtonIncomeActive: {
    backgroundColor: theme.colors.incomeBackground,
    borderWidth: 1,
    borderColor: theme.colors.income,
  },
  segmentButtonExpenseActive: {
    backgroundColor: theme.colors.expenseBackground,
    borderWidth: 1,
    borderColor: theme.colors.expense,
  },
  segmentText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.textSecondary,
  },
  segmentTextActive: {
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
  // Chips de Categoria
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  chip: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.round,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  chipActive: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
  },
  chipText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
  },
  chipTextActive: {
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
  },
  // Ações
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  cancelButton: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
  },
  cancelButtonText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textSecondary,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.light,
  },
  saveButtonText: {
    color: theme.colors.surface,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
  },
  // Attachment
  attachmentPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    borderStyle: 'dashed' as const,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  attachmentPickerIcon: {
    fontSize: 20,
  },
  attachmentPickerText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
    flex: 1,
  },
  attachmentPickerHint: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textLight,
  },
  attachmentPreviewContainer: {
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden' as const,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  attachmentThumbnail: {
    width: '100%',
    height: 160,
  },
  attachmentActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.background,
  },
  attachmentChangeButton: {
    paddingVertical: 4,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.borderRadius.sm,
  },
  attachmentChangeText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.semibold,
  },
  attachmentRemoveButton: {
    paddingVertical: 4,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: theme.colors.expenseBackground,
    borderRadius: theme.borderRadius.sm,
  },
  attachmentRemoveText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.expense,
    fontWeight: theme.typography.weights.semibold,
  },
  // PDF document row inside the preview container
  attachmentDocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.background,
  },
  attachmentDocIcon: {
    fontSize: 28,
  },
  attachmentDocName: {
    flex: 1,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.weights.semibold,
  },
  // Modal de Seleção de Anexo
  attachmentModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  attachmentModalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 40 : theme.spacing.xl,
  },
  attachmentModalHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  attachmentModalIndicator: {
    width: 40,
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    marginBottom: theme.spacing.md,
  },
  attachmentModalTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
  attachmentModalSubtitle: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textLight,
    marginTop: 4,
  },
  attachmentModalOptions: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  attachmentModalOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  attachmentOptionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachmentOptionIcon: {
    fontSize: 20,
  },
  attachmentOptionTextContainer: {
    flex: 1,
  },
  attachmentOptionTitle: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
  attachmentOptionDescription: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textLight,
    marginTop: 2,
  },
  attachmentModalCancelButton: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  attachmentModalCancelText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textSecondary,
  },
  // Type selection grid (2x2)
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  typeGridButton: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeButtonText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textSecondary,
  },
  typeButtonTextActive: {
    color: theme.colors.surface,
  },
  typeButtonIncomeActive: {
    backgroundColor: theme.colors.income,
    borderColor: theme.colors.income,
  },
  typeButtonExpenseActive: {
    backgroundColor: theme.colors.expense,
    borderColor: theme.colors.expense,
  },
  typeButtonSavingActive: {
    backgroundColor: theme.colors.savings,
    borderColor: theme.colors.savings,
  },
  typeButtonWithdrawActive: {
    backgroundColor: theme.colors.savings,
    borderColor: theme.colors.savings,
  },
  // Type grid rows
  typeRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  formContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  fixedFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
});
